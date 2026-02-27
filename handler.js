/**
 * Professional Message Handler for WhatsApp MD Bot
 * Handles incoming messages, commands, group events, and security features
 * @module handler
 */

const config = require('./config');
const database = require('./database');
const { loadCommands } = require('./utils/commandLoader');
const { addMessage } = require('./utils/groupstats');
const { jidDecode, jidEncode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { performance } = require('perf_hooks');

// ==================== Constants ====================
const CACHE_TTL = 60 * 1000; // 1 minute
const MAX_CACHE_SIZE = 500; // Max group metadata entries
const MENTION_THRESHOLD = 3;
const WRITE_DEBOUNCE_MS = 500;
const LID_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_PROFILE_PIC = 'https://img.pyrocdn.com/dbKUgahg.png';
const WELCOME_API_URL = 'https://api.some-random-api.com/welcome/img/7/gaming4';
const PROTOCOL_MESSAGES = new Set(['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo']);

// ==================== Caching Systems ====================
class TimedCache {
  constructor(ttl = CACHE_TTL, maxSize = MAX_CACHE_SIZE) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  set(key, value) {
    this._prune();
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  _prune() {
    if (this.cache.size > this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) this.cache.delete(oldest[0]);
    }
  }
}

class LidMappingCache extends TimedCache {
  constructor() {
    super(LID_CACHE_TTL, 1000);
  }
}

// ==================== Initialize Caches ====================
const groupMetadataCache = new TimedCache(CACHE_TTL, MAX_CACHE_SIZE);
const lidMappingCache = new LidMappingCache();

// ==================== Load Commands ====================
const commands = loadCommands();

// ==================== Helper Functions ====================

/**
 * Safely parse a boolean from environment or string
 * @param {any} value
 * @returns {boolean}
 */
const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  return value.toString().toLowerCase() === 'true' || value === '1';
};

/**
 * Unwrap WhatsApp container messages (ephemeral, view once, etc.)
 * @param {Object} msg - Raw message object
 * @returns {Object|null} Unwrapped message content or null
 */
const getMessageContent = (msg) => {
  if (!msg?.message) return null;
  
  let m = msg.message;
  const wrappers = [
    'ephemeralMessage',
    'viewOnceMessageV2',
    'viewOnceMessage',
    'documentWithCaptionMessage'
  ];
  
  for (const wrapper of wrappers) {
    if (m[wrapper]) {
      m = m[wrapper].message;
    }
  }
  
  return m;
};

/**
 * Normalize a JID to just the number part
 * @param {string} jid
 * @returns {string|null}
 */
const normalizeJid = (jid) => {
  if (!jid || typeof jid !== 'string') return null;
  // Remove device ID if present (e.g., "1234567890:0@s.whatsapp.net" -> "1234567890")
  if (jid.includes(':')) return jid.split(':')[0];
  // Remove domain if present
  if (jid.includes('@')) return jid.split('@')[0];
  return jid;
};

/**
 * Get LID mapping value from session files
 * @param {string} user
 * @param {'pnToLid'|'lidToPn'} direction
 * @returns {string|null}
 */
const getLidMappingValue = (user, direction) => {
  if (!user) return null;
  
  const cacheKey = `${direction}:${user}`;
  const cached = lidMappingCache.get(cacheKey);
  if (cached !== undefined) return cached;
  
  const sessionPath = path.join(__dirname, config.sessionName || 'session');
  const suffix = direction === 'pnToLid' ? '.json' : '_reverse.json';
  const filePath = path.join(sessionPath, `lid-mapping-${user}${suffix}`);
  
  let value = null;
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      value = raw ? JSON.parse(raw) : null;
    } catch (error) {
      // Silently fail
    }
  }
  
  lidMappingCache.set(cacheKey, value);
  return value;
};

/**
 * Normalize JID handling LID conversion
 * @param {string} jid
 * @returns {string}
 */
const normalizeJidWithLid = (jid) => {
  if (!jid) return jid;
  
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      return `${jid.split(':')[0].split('@')[0]}@s.whatsapp.net`;
    }
    
    let user = decoded.user;
    let server = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;
    
    const mapToPn = () => {
      const pnUser = getLidMappingValue(user, 'lidToPn');
      if (pnUser) {
        user = pnUser;
        server = server === 'hosted.lid' ? 'hosted' : 's.whatsapp.net';
        return true;
      }
      return false;
    };
    
    if (server === 'lid' || server === 'hosted.lid') {
      mapToPn();
    } else if (server === 's.whatsapp.net' || server === 'hosted') {
      mapToPn();
    }
    
    if (server === 'hosted') {
      return jidEncode(user, 'hosted');
    }
    return jidEncode(user, 's.whatsapp.net');
  } catch (error) {
    return jid;
  }
};

/**
 * Build comparable JID variants (PN + LID) for matching
 * @param {string} jid
 * @returns {string[]}
 */
const buildComparableIds = (jid) => {
  if (!jid) return [];
  
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      const normalized = normalizeJidWithLid(jid);
      return normalized ? [normalized] : [];
    }
    
    const variants = new Set();
    const normalizedServer = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;
    
    variants.add(jidEncode(decoded.user, normalizedServer));
    
    const isPnServer = normalizedServer === 's.whatsapp.net' || normalizedServer === 'hosted';
    const isLidServer = normalizedServer === 'lid' || normalizedServer === 'hosted.lid';
    
    if (isPnServer) {
      const lidUser = getLidMappingValue(decoded.user, 'pnToLid');
      if (lidUser) {
        const lidServer = normalizedServer === 'hosted' ? 'hosted.lid' : 'lid';
        variants.add(jidEncode(lidUser, lidServer));
      }
    } else if (isLidServer) {
      const pnUser = getLidMappingValue(decoded.user, 'lidToPn');
      if (pnUser) {
        const pnServer = normalizedServer === 'hosted.lid' ? 'hosted' : 's.whatsapp.net';
        variants.add(jidEncode(pnUser, pnServer));
      }
    }
    
    return Array.from(variants);
  } catch (error) {
    return [jid];
  }
};

/**
 * Find a participant in a group by any of their JIDs
 * @param {Array} participants - Group participants array
 * @param {string|string[]} userIds - JID(s) to search for
 * @returns {Object|null} Found participant or null
 */
const findParticipant = (participants = [], userIds) => {
  const targets = (Array.isArray(userIds) ? userIds : [userIds])
    .filter(Boolean)
    .flatMap(id => buildComparableIds(id));
  
  if (!targets.length) return null;
  
  return participants.find(participant => {
    if (!participant) return false;
    
    const participantIds = [
      participant.id,
      participant.lid,
      participant.userJid
    ]
      .filter(Boolean)
      .flatMap(id => buildComparableIds(id));
    
    return participantIds.some(id => targets.includes(id));
  }) || null;
};

/**
 * Check if a sender is the bot owner
 * @param {string} sender - Sender JID
 * @returns {boolean}
 */
const isOwner = (sender) => {
  if (!sender) return false;
  
  const normalizedSender = normalizeJidWithLid(sender);
  const senderNumber = normalizeJid(normalizedSender);
  
  return config.ownerNumber.some(owner => {
    const normalizedOwner = normalizeJidWithLid(owner.includes('@') ? owner : `${owner}@s.whatsapp.net`);
    const ownerNumber = normalizeJid(normalizedOwner);
    return ownerNumber === senderNumber;
  });
};

/**
 * Check if a sender is a moderator
 * @param {string} sender - Sender JID
 * @returns {boolean}
 */
const isMod = (sender) => {
  const number = sender.split('@')[0];
  return database.isModerator(number);
};

/**
 * Get group metadata with caching (for non-critical operations)
 * @param {Object} sock - Socket instance
 * @param {string} groupId - Group JID
 * @returns {Promise<Object|null>} Group metadata or null
 */
const getCachedGroupMetadata = async (sock, groupId) => {
  try {
    if (!groupId?.endsWith('@g.us')) return null;
    
    const cached = groupMetadataCache.get(groupId);
    if (cached) return cached;
    
    const metadata = await sock.groupMetadata(groupId);
    groupMetadataCache.set(groupId, metadata);
    return metadata;
  } catch (error) {
    // Cache forbidden groups as null to avoid repeated attempts
    if (error.message?.includes('forbidden') || error.statusCode === 403) {
      groupMetadataCache.set(groupId, null);
      return null;
    }
    // Return cached data if available, otherwise null
    return groupMetadataCache.get(groupId) || null;
  }
};

/**
 * Get live group metadata (bypass cache, for admin checks)
 * @param {Object} sock - Socket instance
 * @param {string} groupId - Group JID
 * @returns {Promise<Object|null>} Group metadata or null
 */
const getLiveGroupMetadata = async (sock, groupId) => {
  try {
    if (!groupId?.endsWith('@g.us')) return null;
    
    const metadata = await sock.groupMetadata(groupId);
    groupMetadataCache.set(groupId, metadata);
    return metadata;
  } catch (error) {
    if (error.message?.includes('forbidden') || error.statusCode === 403) {
      groupMetadataCache.set(groupId, null);
      return null;
    }
    return groupMetadataCache.get(groupId) || null;
  }
};

// Alias for backward compatibility
const getGroupMetadata = getCachedGroupMetadata;

/**
 * Check if a user is an admin in a group
 * @param {Object} sock - Socket instance
 * @param {string} participant - Participant JID
 * @param {string} groupId - Group JID
 * @param {Object} [groupMetadata] - Optional cached metadata
 * @returns {Promise<boolean>}
 */
const isAdmin = async (sock, participant, groupId, groupMetadata = null) => {
  if (!participant || !groupId?.endsWith('@g.us')) return false;
  
  let liveMetadata = groupMetadata;
  if (!liveMetadata?.participants) {
    liveMetadata = await getLiveGroupMetadata(sock, groupId);
  }
  
  if (!liveMetadata?.participants) return false;
  
  const found = findParticipant(liveMetadata.participants, participant);
  return !!(found?.admin === 'admin' || found?.admin === 'superadmin');
};

/**
 * Check if the bot is an admin in a group
 * @param {Object} sock - Socket instance
 * @param {string} groupId - Group JID
 * @param {Object} [groupMetadata] - Optional cached metadata
 * @returns {Promise<boolean>}
 */
const isBotAdmin = async (sock, groupId, groupMetadata = null) => {
  if (!sock.user || !groupId?.endsWith('@g.us')) return false;
  
  const botJids = [sock.user.id];
  if (sock.user.lid) botJids.push(sock.user.lid);
  
  const liveMetadata = await getLiveGroupMetadata(sock, groupId);
  if (!liveMetadata?.participants) return false;
  
  const found = findParticipant(liveMetadata.participants, botJids);
  return !!(found?.admin === 'admin' || found?.admin === 'superadmin');
};

/**
 * Check if text contains a URL
 * @param {string} text
 * @returns {boolean}
 */
const isUrl = (text) => /(https?:\/\/[^\s]+)/gi.test(text);

/**
 * Check if text contains a WhatsApp group link
 * @param {string} text
 * @returns {boolean}
 */
const hasGroupLink = (text) => /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i.test(text);

/**
 * Check if JID is a system JID (broadcast, status, newsletter)
 * @param {string} jid
 * @returns {boolean}
 */
const isSystemJid = (jid) => {
  if (!jid) return true;
  return jid.includes('@broadcast') || 
         jid.includes('status.broadcast') || 
         jid.includes('@newsletter') ||
         jid.includes('@newsletter.');
};

/**
 * Extract text from a message
 * @param {Object} content - Unwrapped message content
 * @returns {string}
 */
const extractText = (content) => {
  if (!content) return '';
  return content.conversation ||
         content.extendedTextMessage?.text ||
         content.imageMessage?.caption ||
         content.videoMessage?.caption ||
         '';
};

/**
 * Extract mentioned JIDs from message context
 * @param {Object} content - Unwrapped message content
 * @returns {string[]}
 */
const extractMentions = (content) => {
  return content?.extendedTextMessage?.contextInfo?.mentionedJid ||
         content?.contextInfo?.mentionedJid ||
         [];
};

/**
 * Handle auto-react feature
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {string} from - Chat JID
 * @param {string} text - Message text
 * @returns {Promise<void>}
 */
const handleAutoReact = async (sock, msg, from, text) => {
  if (!config.autoReact || msg.key.fromMe) return;
  
  const emojis = ['❤️','🔥','👌','💀','😁','✨','👍','🤨','😎','😂','🤝','💫'];
  const mode = config.autoReactMode || 'bot';
  
  if (mode === 'bot' && text?.startsWith(config.prefix)) {
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
  } else if (mode === 'all') {
    const rand = emojis[Math.floor(Math.random() * emojis.length)];
    await sock.sendMessage(from, { react: { text: rand, key: msg.key } });
  }
};

// ==================== Command Execution Context Builder ====================
/**
 * Build context object for command execution
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {string} from - Chat JID
 * @param {string} sender - Sender JID
 * @param {boolean} isGroup - Whether it's a group
 * @param {Object|null} groupMetadata - Group metadata
 * @param {boolean} isOwnerCached - Precomputed owner status
 * @param {boolean} isAdminCached - Precomputed admin status
 * @param {boolean} isBotAdminCached - Precomputed bot admin status
 * @param {boolean} isModCached - Precomputed mod status
 * @returns {Object} Context object
 */
const buildCommandContext = (sock, msg, from, sender, isGroup, groupMetadata, isOwnerCached, isAdminCached, isBotAdminCached, isModCached) => ({
  from,
  sender,
  isGroup,
  groupMetadata,
  isOwner: isOwnerCached,
  isAdmin: isAdminCached,
  isBotAdmin: isBotAdminCached,
  isMod: isModCached,
  reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
  react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } })
});

// ==================== Anti-Feature Handlers ====================

/**
 * Handle anti-link feature
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {Object} groupMetadata - Group metadata
 * @returns {Promise<void>}
 */
const handleAntilink = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antilink) return;
    
    const content = getMessageContent(msg);
    const body = extractText(content);
    
    // Comprehensive link detection
    const linkPattern = /(https?:\/\/)?([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}(\/[^\s]*)?/i;
    if (!linkPattern.test(body)) return;
    
    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return;
    
    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    const action = (groupSettings.antilinkAction || 'delete').toLowerCase();
    
    if (action === 'kick' && botIsAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.groupParticipantsUpdate(from, [sender], 'remove');
      await sock.sendMessage(from, { 
        text: `🔗 Anti-link triggered. Link removed.`,
        mentions: [sender]
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.sendMessage(from, { 
        text: `🔗 Anti-link triggered. Link removed.`,
        mentions: [sender]
      }, { quoted: msg });
    }
  } catch (error) {
    console.error('[Antilink Error]', error.message);
  }
};

/**
 * Handle anti-tag feature
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {Object} groupMetadata - Group metadata
 * @returns {Promise<boolean>} True if message was handled (deleted/kicked)
 */
const handleAntitag = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antitag || msg.key.fromMe) return false;
    
    const content = getMessageContent(msg);
    const ctx = content?.extendedTextMessage?.contextInfo || content?.contextInfo;
    const mentionedJids = ctx?.mentionedJid || [];
    
    const messageText = extractText(content);
    const textMentions = messageText.match(/@[\d+\s\-()~.]+/g) || [];
    const numericMentions = messageText.match(/@\d{10,}/g) || [];
    
    const uniqueNumericMentions = new Set();
    numericMentions.forEach((mention) => {
      const numMatch = mention.match(/@(\d+)/);
      if (numMatch) uniqueNumericMentions.add(numMatch[1]);
    });
    
    const totalMentions = Math.max(mentionedJids.length, uniqueNumericMentions.size);
    if (totalMentions < MENTION_THRESHOLD) return false;
    
    const participants = groupMetadata.participants || [];
    const mentionThreshold = Math.max(3, Math.ceil(participants.length * 0.5));
    const hasManyMentions = totalMentions >= mentionThreshold || uniqueNumericMentions.size >= 10;
    
    if (!hasManyMentions) return false;
    
    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return false;
    
    const action = (groupSettings.antitagAction || 'delete').toLowerCase();
    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    
    if (action === 'delete' || !botIsAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.sendMessage(from, { 
        text: '⚠️ *Tagall Detected!*',
        mentions: [sender]
      }, { quoted: msg });
      return true;
    } else if (action === 'kick' && botIsAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.groupParticipantsUpdate(from, [sender], 'remove');
      await sock.sendMessage(from, {
        text: `🚫 *Antitag Detected!*\n\n@${sender.split('@')[0]} has been kicked for tagging all members.`,
        mentions: [sender],
      }, { quoted: msg });
      return true;
    }
  } catch (error) {
    console.error('[Antitag Error]', error.message);
  }
  return false;
};

/**
 * Handle anti-group mention (forwarded status mentions)
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {Object} groupMetadata - Group metadata
 * @returns {Promise<boolean>} True if message was handled
 */
const handleAntigroupmention = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antigroupmention) return false;
    
    // Detect forwarded status mention
    let isForwardedStatus = false;
    if (msg.message) {
      isForwardedStatus = !!(msg.message.groupStatusMentionMessage ||
        (msg.message.protocolMessage?.type === 25) ||
        msg.message.contextInfo?.forwardedNewsletterMessageInfo ||
        msg.message.contextInfo?.isForwarded ||
        msg.message.contextInfo?.forwardingScore);
    }
    
    if (!isForwardedStatus) return false;
    
    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return false;
    
    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    const action = (groupSettings.antigroupmentionAction || 'delete').toLowerCase();
    
    if (action === 'kick' && botIsAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.groupParticipantsUpdate(from, [sender], 'remove');
      // Silent removal
    } else {
      await sock.sendMessage(from, { delete: msg.key });
    }
    return true;
  } catch (error) {
    console.error('[Antigroupmention Error]', error.message);
  }
  return false;
};

/**
 * Handle anti-all feature (owner only)
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {Object} groupMetadata - Group metadata
 * @returns {Promise<boolean>} True if message was deleted
 */
const handleAntiall = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antiall) return false;
    
    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return false;
    
    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    if (botIsAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
      return true;
    }
  } catch (error) {
    console.error('[Antiall Error]', error.message);
  }
  return false;
};

/**
 * Handle auto-sticker feature
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Original message
 * @param {string} from - Chat JID
 * @param {string} sender - Sender JID
 * @param {Object} groupMetadata - Group metadata
 * @returns {Promise<boolean>} True if converted to sticker
 */
const handleAutoSticker = async (sock, msg, from, sender, groupMetadata) => {
  try {
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.autosticker) return false;
    
    const content = getMessageContent(msg);
    const media = content?.imageMessage || content?.videoMessage;
    if (!media) return false;
    
    const body = extractText(content);
    if (body.startsWith(config.prefix)) return false; // Let command handle
    
    const stickerCmd = commands.get('sticker');
    if (!stickerCmd) return false;
    
    const isOwnerCached = isOwner(sender);
    const isAdminCached = await isAdmin(sock, sender, from, groupMetadata);
    const isBotAdminCached = await isBotAdmin(sock, from, groupMetadata);
    const isModCached = isMod(sender);
    
    await stickerCmd.execute(sock, msg, [], buildCommandContext(
      sock, msg, from, sender, true, groupMetadata,
      isOwnerCached, isAdminCached, isBotAdminCached, isModCached
    ));
    return true;
  } catch (error) {
    console.error('[AutoSticker Error]', error.message);
  }
  return false;
};

// ==================== Welcome/Goodbye Handlers ====================

/**
 * Get display name for a user
 * @param {Object} sock - Socket instance
 * @param {string} jid - User JID
 * @param {string} fallback - Fallback number
 * @returns {Promise<string>}
 */
const getDisplayName = async (sock, jid, fallback) => {
  try {
    const phoneJid = jid.includes('@s.whatsapp.net') ? jid : normalizeJidWithLid(jid);
    if (!phoneJid?.includes('@s.whatsapp.net')) return fallback;
    
    // Try contact store
    if (sock.store?.contacts?.[phoneJid]) {
      const contact = sock.store.contacts[phoneJid];
      if (contact.notify?.trim() && !contact.notify.match(/^\d+$/)) return contact.notify.trim();
      if (contact.name?.trim() && !contact.name.match(/^\d+$/)) return contact.name.trim();
    }
    
    // Try onWhatsApp
    try {
      await sock.onWhatsApp(phoneJid);
      if (sock.store?.contacts?.[phoneJid]) {
        const contact = sock.store.contacts[phoneJid];
        if (contact.notify?.trim() && !contact.notify.match(/^\d+$/)) return contact.notify.trim();
        if (contact.name?.trim() && !contact.name.match(/^\d+$/)) return contact.name.trim();
      }
    } catch {
      // Ignore
    }
    
    return fallback;
  } catch {
    return fallback;
  }
};

/**
 * Send welcome image for new member
 * @param {Object} sock - Socket instance
 * @param {string} groupId - Group JID
 * @param {Object} groupMetadata - Group metadata
 * @param {string} participantJid - New member JID
 * @param {string} displayName - Display name
 * @param {number} memberCount - Member count
 * @returns {Promise<void>}
 */
const sendWelcomeImage = async (sock, groupId, groupMetadata, participantJid, displayName, memberCount) => {
  try {
    let profilePicUrl = DEFAULT_PROFILE_PIC;
    try {
      profilePicUrl = await sock.profilePictureUrl(participantJid, 'image');
    } catch {
      // Use default
    }
    
    const groupName = groupMetadata.subject || 'the group';
    const groupDesc = groupMetadata.desc || 'No description';
    const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const welcomeMsg = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${displayName} 👋\n┃Member count: #${memberCount}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${displayName}* Welcome to *${groupName}*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\n${groupDesc}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ SHYAM ${config.botName}*`;
    
    const apiUrl = `${WELCOME_API_URL}?type=join&textcolor=white&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(profilePicUrl)}`;
    
    const imageResponse = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const imageBuffer = Buffer.from(imageResponse.data);
    
    await sock.sendMessage(groupId, { 
      image: imageBuffer,
      caption: welcomeMsg,
      mentions: [participantJid] 
    });
  } catch (error) {
    console.error('[Welcome Image Error]', error.message);
    // Fallback to text
    const message = `Welcome @${displayName} to ${groupMetadata.subject || 'the group'}! 👋\nEnjoy your stay!`;
    await sock.sendMessage(groupId, { text: message, mentions: [participantJid] });
  }
};

/**
 * Send goodbye image for leaving member
 * @param {Object} sock - Socket instance
 * @param {string} groupId - Group JID
 * @param {Object} groupMetadata - Group metadata
 * @param {string} participantJid - Leaving member JID
 * @param {string} displayName - Display name
 * @param {number} memberCount - Member count
 * @returns {Promise<void>}
 */
const sendGoodbyeImage = async (sock, groupId, groupMetadata, participantJid, displayName, memberCount) => {
  try {
    let profilePicUrl = DEFAULT_PROFILE_PIC;
    try {
      profilePicUrl = await sock.profilePictureUrl(participantJid, 'image');
    } catch {
      // Use default
    }
    
    const groupName = groupMetadata.subject || 'the group';
    const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const goodbyeMsg = `Goodbye @${displayName} 👋 We will never miss you!`;
    
    const apiUrl = `${WELCOME_API_URL}?type=leave&textcolor=white&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(profilePicUrl)}`;
    
    const imageResponse = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const imageBuffer = Buffer.from(imageResponse.data);
    
    await sock.sendMessage(groupId, { 
      image: imageBuffer,
      caption: goodbyeMsg,
      mentions: [participantJid] 
    });
  } catch (error) {
    console.error('[Goodbye Image Error]', error.message);
    // Fallback to text
    const message = `Goodbye @${displayName} 👋 We will never miss you! 💀`;
    await sock.sendMessage(groupId, { text: message, mentions: [participantJid] });
  }
};

// ==================== Main Handlers ====================

/**
 * Main message handler
 * @param {Object} sock - Socket instance
 * @param {Object} msg - Incoming message
 * @returns {Promise<void>}
 */
const handleMessage = async (sock, msg) => {
  const startTime = performance.now();
  try {
    if (!msg.message) return;
    
    const from = msg.key.remoteJid;
    if (isSystemJid(from)) return;
    
    const sender = msg.key.fromMe ? sock.user.id : (msg.key.participant || msg.key.remoteJid);
    const isGroup = from.endsWith('@g.us');
    
    // Get group metadata early if needed
    const groupMetadata = isGroup ? await getCachedGroupMetadata(sock, from) : null;
    
    // Precompute user roles for performance
    const isOwnerCached = isOwner(sender);
    const isAdminCached = isGroup ? await isAdmin(sock, sender, from, groupMetadata) : false;
    const isBotAdminCached = isGroup ? await isBotAdmin(sock, from, groupMetadata) : false;
    const isModCached = isMod(sender);
    
    // Unwrap message content
    const content = getMessageContent(msg);
    if (!content) return;
    
    // Extract text and mentions
    const body = extractText(content).trim();
    const mentionedJids = extractMentions(content);
    
    // Auto-react
    await handleAutoReact(sock, msg, from, body);
    
    // Group statistics
    if (isGroup) {
      addMessage(from, sender);
    }
    
    // Security features (run in parallel for speed, but catch errors)
    if (isGroup) {
      const groupSettings = database.getGroupSettings(from);
      
      // Anti-group mention
      if (groupSettings.antigroupmention) {
        handleAntigroupmention(sock, msg, groupMetadata).catch(e => console.error('[Async Antigroupmention]', e.message));
      }
      
      // Anti-tag
      if (groupSettings.antitag && !msg.key.fromMe) {
        const handled = await handleAntitag(sock, msg, groupMetadata);
        if (handled) return; // Message deleted
      }
      
      // Anti-all
      if (groupSettings.antiall && !msg.key.fromMe) {
        const handled = await handleAntiall(sock, msg, groupMetadata);
        if (handled) return;
      }
      
      // Anti-link
      if (groupSettings.antilink) {
        handleAntilink(sock, msg, groupMetadata).catch(e => console.error('[Async Antilink]', e.message));
      }
      
      // Auto-sticker
      if (groupSettings.autosticker) {
        const handled = await handleAutoSticker(sock, msg, from, sender, groupMetadata);
        if (handled) return;
      }
    }
    
    // Handle button responses
    const btn = content.buttonsResponseMessage || msg.message?.buttonsResponseMessage;
    if (btn) {
      const buttonId = btn.selectedButtonId;
      const commandMap = { btn_menu: 'menu', btn_ping: 'ping', btn_help: 'list' };
      const cmdName = commandMap[buttonId];
      if (cmdName) {
        const cmd = commands.get(cmdName);
        if (cmd) {
          await cmd.execute(sock, msg, [], buildCommandContext(
            sock, msg, from, sender, isGroup, groupMetadata,
            isOwnerCached, isAdminCached, isBotAdminCached, isModCached
          ));
        }
      }
      return;
    }
    
    // Check command prefix
    if (!body.startsWith(config.prefix)) return;
    
    const args = body.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);
    if (!command) return;
    
    // Self mode check
    if (config.selfMode && !isOwnerCached) return;
    
    // Permission checks
    if (command.ownerOnly && !isOwnerCached) {
      await sock.sendMessage(from, { text: config.messages.ownerOnly }, { quoted: msg });
      return;
    }
    if (command.modOnly && !isModCached && !isOwnerCached) {
      await sock.sendMessage(from, { text: '🔒 This command is only for moderators!' }, { quoted: msg });
      return;
    }
    if (command.groupOnly && !isGroup) {
      await sock.sendMessage(from, { text: config.messages.groupOnly }, { quoted: msg });
      return;
    }
    if (command.privateOnly && isGroup) {
      await sock.sendMessage(from, { text: config.messages.privateOnly }, { quoted: msg });
      return;
    }
    if (command.adminOnly && !isAdminCached && !isOwnerCached) {
      await sock.sendMessage(from, { text: config.messages.adminOnly }, { quoted: msg });
      return;
    }
    if (command.botAdminNeeded && !isBotAdminCached) {
      await sock.sendMessage(from, { text: config.messages.botAdminNeeded }, { quoted: msg });
      return;
    }
    
    // Auto-typing
    if (config.autoTyping) {
      await sock.sendPresenceUpdate('composing', from);
    }
    
    console.log(`[CMD] ${commandName} from ${sender} (${performance.now() - startTime}ms)`);
    
    // Execute command
    await command.execute(sock, msg, args, buildCommandContext(
      sock, msg, from, sender, isGroup, groupMetadata,
      isOwnerCached, isAdminCached, isBotAdminCached, isModCached
    ));
    
  } catch (error) {
    console.error('[Message Handler Error]', error);
    if (!error.message?.includes('rate-overlimit')) {
      try {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: `${config.messages.error}\n\n${error.message}` 
        }, { quoted: msg });
      } catch (e) {
        if (!e.message?.includes('rate-overlimit')) console.error('Error sending error message:', e);
      }
    }
  }
};

/**
 * Group participant update handler (welcome/goodbye)
 * @param {Object} sock - Socket instance
 * @param {Object} update - Group update event
 * @returns {Promise<void>}
 */
const handleGroupUpdate = async (sock, update) => {
  try {
    const { id, participants, action } = update;
    if (!id?.endsWith('@g.us')) return;
    
    const groupSettings = database.getGroupSettings(id);
    if (!groupSettings.welcome && !groupSettings.goodbye) return;
    
    const groupMetadata = await getGroupMetadata(sock, id);
    if (!groupMetadata) return;
    
    const extractJid = (p) => {
      if (typeof p === 'string') return p;
      if (p?.id) return p.id;
      if (p?.jid) return p.jid;
      if (p?.participant) return p.participant;
      return null;
    };
    
    for (const participant of participants) {
      const participantJid = extractJid(participant);
      if (!participantJid) continue;
      
      const participantNumber = participantJid.split('@')[0];
      const displayName = await getDisplayName(sock, participantJid, participantNumber);
      const memberCount = groupMetadata.participants?.length || 0;
      
      if (action === 'add' && groupSettings.welcome) {
        await sendWelcomeImage(sock, id, groupMetadata, participantJid, displayName, memberCount);
      } else if (action === 'remove' && groupSettings.goodbye) {
        await sendGoodbyeImage(sock, id, groupMetadata, participantJid, displayName, memberCount);
      }
    }
  } catch (error) {
    if (!error.message?.includes('forbidden') && !error.message?.includes('403')) {
      console.error('[GroupUpdate Error]', error.message);
    }
  }
};

/**
 * Initialize anti-call feature
 * @param {Object} sock - Socket instance
 */
const initializeAntiCall = (sock) => {
  sock.ev.on('call', async (calls) => {
    try {
      // Reload config to get fresh settings
      const freshConfig = require('./config');
      if (!freshConfig.defaultGroupSettings.anticall) return;
      
      for (const call of calls) {
        if (call.status === 'offer') {
          await sock.rejectCall(call.id, call.from);
          await sock.updateBlockStatus(call.from, 'block');
          await sock.sendMessage(call.from, {
            text: '🚫 Calls are not allowed. You have been blocked.'
          });
        }
      }
    } catch (err) {
      console.error('[AntiCall Error]', err.message);
    }
  });
};

// ==================== Exports ====================
module.exports = {
  handleMessage,
  handleGroupUpdate,
  handleAntilink,
  handleAntigroupmention,
  initializeAntiCall,
  isOwner,
  isAdmin,
  isBotAdmin,
  isMod,
  getGroupMetadata,
  findParticipant
};