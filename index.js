/**
 * WhatsApp MD Bot - Professional Main Entry Point
 * @module index
 */

'use strict';

// ==================== Environment Setup ====================
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

const { initializeTempSystem, cleanupTempFiles } = require('./utils/tempManager');
const { startCleanup, cleanupOldFiles } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();

// ==================== Console Filtering ====================
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

const FORBIDDEN_PATTERNS = [
  'closing session', 'closing open session', 'sessionentry', 'prekey bundle',
  'pendingprekey', '_chains', 'registrationid', 'currentratchet', 'chainkey',
  'ratchet', 'signal protocol', 'ephemeralkeypair', 'indexinfo', 'basekey'
];

const filterConsole = (method, args) => {
  const message = args.map(a => 
    typeof a === 'string' ? a : 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ').toLowerCase();
  
  if (!FORBIDDEN_PATTERNS.some(p => message.includes(p))) {
    originalConsole[method].apply(console, args);
  }
};

console.log = (...args) => filterConsole('log', args);
console.error = (...args) => filterConsole('error', args);
console.warn = (...args) => filterConsole('warn', args);

// ==================== Module Imports ====================
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const config = require('./config');
const handler = require('./handler');

// ==================== Constants ====================
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WATCHDOG_INTERVAL = 5 * 60 * 1000;   // 5 minutes
const MESSAGE_TTL = 5 * 60 * 1000;          // 5 minutes
const CLEANUP_INTERVAL = 60 * 1000;          // 1 minute
const RECONNECT_DELAY = 3000;                // 3 seconds
const DEFAULT_MAX_MESSAGE_AGE = 5;           // minutes

// ==================== Utility Functions ====================

/**
 * Clean Puppeteer cache to save disk space
 */
const cleanupPuppeteerCache = () => {
  try {
    const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer');
    if (fs.existsSync(cacheDir)) {
      console.log('🧹 Removing Puppeteer cache at:', cacheDir);
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ Puppeteer cache removed');
    }
  } catch (err) {
    console.error('⚠️ Failed to cleanup Puppeteer cache:', err.message);
  }
};

/**
 * Create a Pino logger with suppressed noise
 * @param {string} level - Log level
 * @returns {object} Pino logger instance
 */
const createSuppressedLogger = (level = 'silent') => {
  const forbidden = [
    'closing session', 'closing open session', 'sessionentry', 'prekey bundle',
    'pendingprekey', '_chains', 'registrationid', 'currentratchet', 'chainkey',
    'ratchet', 'signal protocol', 'ephemeralkeypair', 'indexinfo', 'basekey',
    'sessionentry', 'ratchetkey'
  ];

  let logger;
  try {
    logger = pino({
      level,
      transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, ignore: 'pid,hostname' }
      },
      redact: ['registrationId', 'ephemeralKeyPair', 'rootKey', 'chainKey', 'baseKey']
    });
  } catch {
    logger = pino({ level }); // Fallback
  }

  const originalInfo = logger.info.bind(logger);
  logger.info = (...args) => {
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').toLowerCase();
    if (!forbidden.some(p => msg.includes(p))) {
      originalInfo(...args);
    }
  };
  logger.debug = () => {};
  logger.trace = () => {};
  return logger;
};

// ==================== In-Memory Store ====================
class MessageStore {
  constructor(maxPerChat = 20) {
    this.messages = new Map(); // Map<chatJid, Map<msgId, message>>
    this.maxPerChat = maxPerChat;
  }

  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        const jid = msg.key.remoteJid;
        if (!this.messages.has(jid)) {
          this.messages.set(jid, new Map());
        }
        const chatMsgs = this.messages.get(jid);
        chatMsgs.set(msg.key.id, msg);

        // Enforce per-chat limit
        if (chatMsgs.size > this.maxPerChat) {
          const sorted = Array.from(chatMsgs.entries())
            .sort((a, b) => (a[1].messageTimestamp || 0) - (b[1].messageTimestamp || 0));
          for (let i = 0; i < sorted.length - this.maxPerChat; i++) {
            chatMsgs.delete(sorted[i][0]);
          }
        }
      }
    });
  }

  async loadMessage(jid, id) {
    return this.messages.get(jid)?.get(id) || null;
  }

  cleanupOldChats() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    for (const [jid, chatMsgs] of this.messages.entries()) {
      const timestamps = Array.from(chatMsgs.values())
        .map(m => (m.messageTimestamp || 0) * 1000);
      if (timestamps.length && now - Math.max(...timestamps) > ONE_DAY) {
        this.messages.delete(jid);
      }
    }
  }
}

// ==================== TTL Set for Deduplication ====================
class TtlSet {
  constructor(ttlMs = MESSAGE_TTL) {
    this.ttl = ttlMs;
    this.map = new Map(); // key -> timestamp
  }

  add(key) {
    this.map.set(key, Date.now());
  }

  has(key) {
    const ts = this.map.get(key);
    if (!ts) return false;
    if (Date.now() - ts > this.ttl) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, ts] of this.map.entries()) {
      if (now - ts > this.ttl) this.map.delete(key);
    }
  }
}

// ==================== Main Bot Class ====================
class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.store = new MessageStore(config.maxPerChat || 20);
    this.processedMessages = new TtlSet();
    this.watchdogInterval = null;
    this.lastActivity = Date.now();
    this.isShuttingDown = false;
    this.reconnectTimer = null;
  }

  /**
   * Start the bot
   */
  async start() {
    console.log('🚀 Starting WhatsApp MD Bot...\n');
    console.log(`📦 Bot Name: ${config.botName}`);
    console.log(`⚡ Prefix: ${config.prefix}`);
    const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
    console.log(`👑 Owner: ${ownerNames}\n`);

    cleanupPuppeteerCache();
    await this._connect();
    this._setupPeriodicCleanup();
    this._setupShutdownHandlers();
  }

  /**
   * Establish connection to WhatsApp
   */
  async _connect() {
    try {
      const sessionFolder = `./${config.sessionName}`;
      const sessionFile = path.join(sessionFolder, 'creds.json');

      // Process AS~ session if provided
      if (config.sessionID?.startsWith('AS~')) {
        await this._processASSession(sessionFolder, sessionFile);
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
      const { version } = await fetchLatestBaileysVersion();
      const logger = createSuppressedLogger('silent');

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: ['Chrome', 'Windows', '10.0'],
        auth: state,
        syncFullHistory: false,
        downloadHistory: false,
        markOnlineOnConnect: false,
        getMessage: async () => undefined
      });

      this.store.bind(this.sock.ev);
      this._attachEventHandlers(saveCreds);
      this._startWatchdog();

    } catch (error) {
      console.error('❌ Connection error:', error.message);
      this._scheduleReconnect();
    }
  }

  /**
   * Process AS~ session string
   */
  async _processASSession(sessionFolder, sessionFile) {
    try {
      const [header, b64data] = config.sessionID.split('!');
      if (header !== 'AS' || !b64data) {
        throw new Error("Invalid session format. Expected 'AS~.....'");
      }
      const cleanB64 = b64data.replace('...', '');
      const compressed = Buffer.from(cleanB64, 'base64');
      const decompressed = zlib.gunzipSync(compressed);

      if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
      }
      fs.writeFileSync(sessionFile, decompressed, 'utf8');
      console.log('📡 Session: 🔑 Retrieved from AS Session');
    } catch (e) {
      console.error('📡 Session: ❌ Error processing AS session:', e.message);
    }
  }

  /**
   * Attach all event handlers to the socket
   */
  _attachEventHandlers(saveCreds) {
    // Connection updates
    this.sock.ev.on('connection.update', this._handleConnectionUpdate.bind(this));
    
    // Credentials save
    this.sock.ev.on('creds.update', saveCreds);
    
    // Message handling
    this.sock.ev.on('messages.upsert', this._handleMessages.bind(this));
    
    // Group participant updates
    this.sock.ev.on('group-participants.update', this._handleGroupUpdate.bind(this));
    
    // Errors
    this.sock.ev.on('error', this._handleSocketError.bind(this));
    
    // Update activity on any message
    this.sock.ev.on('messages.upsert', this._resetActivity.bind(this));
  }

  /**
   * Handle connection updates
   */
  async _handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      this._stopWatchdog();
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || 'Unknown error';

      if ([408, 503, 515].includes(statusCode)) {
        console.log(`⚠️ Connection closed (${statusCode}). Reconnecting...`);
      } else {
        console.log('Connection closed due to:', errorMessage, '\nReconnecting:', shouldReconnect);
      }

      if (shouldReconnect) this._scheduleReconnect();
    } else if (connection === 'open') {
      this._onConnected();
    }
  }

  /**
   * Actions when successfully connected
   */
  async _onConnected() {
    console.log('\n✅ Bot connected successfully!');
    console.log(`📱 Bot Number: ${this.sock.user.id.split(':')[0]}`);
    console.log(`🤖 Bot Name: ${config.botName}`);
    console.log(`⚡ Prefix: ${config.prefix}`);
    const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
    console.log(`👑 Owner: ${ownerNames}\n`);
    console.log('Bot is ready to receive messages!\n');

    if (config.autoBio) {
      await this.sock.updateProfileStatus(`${config.botName} | Active 24/7`).catch(() => {});
    }

    if (handler.initializeAntiCall) {
      handler.initializeAntiCall(this.sock);
    } else {
      console.warn('⚠️ initializeAntiCall not found in handler');
    }

    this.store.cleanupOldChats();
    console.log(`🧹 Store cleaned. Active chats: ${this.store.messages.size}`);
    this._resetActivity();
    this._startWatchdog(); // Restart watchdog on new connection
  }

  /**
   * Handle incoming messages
   */
  async _handleMessages({ messages, type }) {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;

      const from = msg.key.remoteJid;
      if (!from || this._isSystemJid(from)) continue;

      const msgId = msg.key.id;

      // Deduplication
      if (this.processedMessages.has(msgId)) continue;

      // Age validation
      const maxAge = (config.maxMessageAgeMinutes || DEFAULT_MAX_MESSAGE_AGE) * 60 * 1000;
      if (msg.messageTimestamp) {
        const age = Date.now() - (msg.messageTimestamp * 1000);
        if (age > maxAge) continue;
      }

      this.processedMessages.add(msgId);

      // Store message
      if (!this.store.messages.has(from)) {
        this.store.messages.set(from, new Map());
      }
      const chatMsgs = this.store.messages.get(from);
      chatMsgs.set(msgId, msg);

      // Enforce per-chat limit
      if (chatMsgs.size > this.store.maxPerChat) {
        const sorted = Array.from(chatMsgs.entries())
          .sort((a, b) => (a[1].messageTimestamp || 0) - (b[1].messageTimestamp || 0));
        for (let i = 0; i < sorted.length - this.store.maxPerChat; i++) {
          chatMsgs.delete(sorted[i][0]);
        }
      }

      // Process command (async, but errors handled)
      handler.handleMessage(this.sock, msg).catch(err => {
        if (!err.message?.includes('rate-overlimit') && !err.message?.includes('not-authorized')) {
          console.error('Error handling message:', err.message);
        }
      });

      // Background tasks
      setImmediate(() => this._runBackgroundTasks(msg, from));
    }
  }

  /**
   * Run non-blocking background tasks
   */
  async _runBackgroundTasks(msg, from) {
    try {
      if (config.autoRead && from.endsWith('@g.us')) {
        await this.sock.readMessages([msg.key]).catch(() => {});
      }
      if (from.endsWith('@g.us')) {
        const groupMetadata = await handler.getGroupMetadata?.(this.sock, msg.key.remoteJid);
        if (groupMetadata) {
          await handler.handleAntilink?.(this.sock, msg, groupMetadata);
        }
      }
    } catch (e) {
      // Silently ignore background errors
    }
  }

  /**
   * Handle group participant updates
   */
  async _handleGroupUpdate(update) {
    if (handler.handleGroupUpdate) {
      await handler.handleGroupUpdate(this.sock, update).catch(() => {});
    }
  }

  /**
   * Handle socket errors
   */
  _handleSocketError(error) {
    const statusCode = error?.output?.statusCode;
    if ([408, 503, 515].includes(statusCode)) return;
    console.error('Socket error:', error.message || error);
  }

  /**
   * Reset activity timestamp
   */
  _resetActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Check if JID is system (broadcast, status, newsletter)
   */
  _isSystemJid(jid) {
    return jid.includes('@broadcast') ||
           jid.includes('status.broadcast') ||
           jid.includes('@newsletter') ||
           jid.includes('@newsletter.');
  }

  /**
   * Start the watchdog timer
   */
  _startWatchdog() {
    this._stopWatchdog();
    this.watchdogInterval = setInterval(() => {
      const inactive = Date.now() - this.lastActivity > INACTIVITY_TIMEOUT;
      if (inactive && this.sock?.ws?.readyState === 1) {
        console.log('⚠️ No activity detected. Forcing reconnect...');
        this.sock.end(undefined, undefined, { reason: 'inactive' });
      }
    }, WATCHDOG_INTERVAL);
  }

  /**
   * Stop the watchdog timer
   */
  _stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  _scheduleReconnect() {
    if (this.isShuttingDown) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      this._connect();
    }, RECONNECT_DELAY);
  }

  /**
   * Set up periodic cleanup of deduplication set
   */
  _setupPeriodicCleanup() {
    setInterval(() => {
      this.processedMessages.cleanup();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Set up shutdown handlers
   */
  _setupShutdownHandlers() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log(`\n👋 Received ${signal}. Cleaning up...`);
      
      this._stopWatchdog();
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      
      if (this.sock) {
        await this.sock.end(undefined, undefined, { reason: 'shutdown' });
      }
      
      console.log('✅ Bot shut down gracefully.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// ==================== Global Error Handlers ====================
process.on('uncaughtException', (err) => {
  if (err.code === 'ENOSPC' || err.errno === -28 || err.message?.includes('no space left on device')) {
    console.error('⚠️ ENOSPC Error: No space left on device. Attempting cleanup...');
    cleanupOldFiles();
    cleanupTempFiles();
    console.warn('⚠️ Cleanup completed. Bot will continue but may experience issues until space is freed.');
    return;
  }
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  if (err.code === 'ENOSPC' || err.errno === -28 || err.message?.includes('no space left on device')) {
    console.warn('⚠️ ENOSPC Error in promise: No space left on device. Attempting cleanup...');
    cleanupOldFiles();
    cleanupTempFiles();
    console.warn('⚠️ Cleanup completed. Bot will continue but may experience issues until space is freed.');
    return;
  }
  if (err.message?.includes('rate-overlimit')) {
    console.warn('⚠️ Rate limit reached. Please slow down your requests.');
    return;
  }
  console.error('Unhandled Rejection:', err);
});

// ==================== Start the Bot ====================
const bot = new WhatsAppBot();
bot.start().catch(err => {
  console.error('Fatal error starting bot:', err);
  process.exit(1);
});

// ==================== Export Store ====================
module.exports = { store: bot.store };