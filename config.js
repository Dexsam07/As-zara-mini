/**
 * Global Configuration for WhatsApp MD Bot
 * Enhanced with environment variable support and validation
 */

// Helper to parse boolean strings from environment
const toBool = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true' || value === '1';
};

// Helper to parse comma-separated strings into arrays (for ownerNumber, ownerName)
const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(item => item.trim());
};

// Helper to ensure a value is an array (for defaultGroupSettings)
const ensureArray = (value) => {
  return Array.isArray(value) ? value : [value];
};

// Load configuration from environment variables with defaults
const config = {
  // Bot Owner Configuration
  ownerNumber: (() => {
    const env = process.env.OWNER_NUMBER;
    return env ? toArray(env) : ['917384287404']; // default
  })(),

  ownerName: (() => {
    const env = process.env.OWNER_NAME;
    return env ? toArray(env) : ['Dex Shyam Chaudhari'];
  })(),

  // Bot Configuration
  botName: process.env.BOT_NAME || 'As-zara-mini',
  prefix: process.env.PREFIX || '.',
  sessionName: process.env.SESSION_NAME || 'AS~',
  sessionID: process.env.SESSION_ID || '',
  newsletterJid: process.env.NEWSLETTER_JID || '120363406449026172@newsletter',
  updateZipUrl: process.env.UPDATE_ZIP_URL || 'https://github.com/Dexsam07/As-zara-mini/archive/refs/heads/main.zip',

  // Sticker Configuration
  packname: process.env.PACKNAME || 'As-zara',

  // Bot Behavior
  selfMode: toBool(process.env.SELF_MODE) || false,
  autoRead: toBool(process.env.AUTO_READ) || false,
  autoTyping: toBool(process.env.AUTO_TYPING) || false,
  autoBio: toBool(process.env.AUTO_BIO) || false,
  autoSticker: toBool(process.env.AUTO_STICKER) || false,
  autoReact: toBool(process.env.AUTO_REACT) || false,
  autoReactMode: process.env.AUTO_REACT_MODE || 'bot', // 'bot' or 'all'
  autoDownload: toBool(process.env.AUTO_DOWNLOAD) || false,

  // Group Settings Defaults
  defaultGroupSettings: {
    antilink: toBool(process.env.DEFAULT_ANTILINK) || false,
    antilinkAction: process.env.DEFAULT_ANTILINK_ACTION || 'delete', // 'delete', 'kick', 'warn'
    antitag: toBool(process.env.DEFAULT_ANTITAG) || false,
    antitagAction: process.env.DEFAULT_ANTITAG_ACTION || 'delete',
    antiall: toBool(process.env.DEFAULT_ANTIALL) || false, // Owner only
    antiviewonce: toBool(process.env.DEFAULT_ANTIVIEWONCE) || false,
    antibot: toBool(process.env.DEFAULT_ANTIBOT) || false,
    anticall: toBool(process.env.DEFAULT_ANTICALL) || false,
    antigroupmention: toBool(process.env.DEFAULT_ANTIGROUPMENTION) || false,
    antigroupmentionAction: process.env.DEFAULT_ANTIGROUPMENTION_ACTION || 'delete',
    welcome: toBool(process.env.DEFAULT_WELCOME) || false,
    welcomeMessage: process.env.DEFAULT_WELCOME_MESSAGE || '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ AS-ZARA-MINI*',
    goodbye: toBool(process.env.DEFAULT_GOODBYE) || false,
    goodbyeMessage: process.env.DEFAULT_GOODBYE_MESSAGE || 'Goodbye @user 👋 We will never miss you!',
    antiSpam: toBool(process.env.DEFAULT_ANTISPAM) || false,
    antidelete: toBool(process.env.DEFAULT_ANTIDELETE) || false,
    nsfw: toBool(process.env.DEFAULT_NSFW) || false,
    detect: toBool(process.env.DEFAULT_DETECT) || false,
    chatbot: toBool(process.env.DEFAULT_CHATBOT) || false,
    autosticker: toBool(process.env.DEFAULT_AUTOSTICKER) || false
  },

  // API Keys (loaded from environment)
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || '',
    deepai: process.env.DEEPAI_API_KEY || '',
    remove_bg: process.env.REMOVE_BG_API_KEY || ''
  },

  // Message Templates (can be overridden via env if needed, but keep defaults)
  messages: {
    wait: process.env.MSG_WAIT || '⏳ Please wait...',
    success: process.env.MSG_SUCCESS || '✅ Success!',
    error: process.env.MSG_ERROR || '❌ Error occurred!',
    ownerOnly: process.env.MSG_OWNER_ONLY || '👑 This command is only for bot owner!',
    adminOnly: process.env.MSG_ADMIN_ONLY || '🛡️ This command is only for group admins!',
    groupOnly: process.env.MSG_GROUP_ONLY || '👥 This command can only be used in groups!',
    privateOnly: process.env.MSG_PRIVATE_ONLY || '💬 This command can only be used in private chat!',
    botAdminNeeded: process.env.MSG_BOT_ADMIN_NEEDED || '🤖 Bot needs to be admin to execute this command!',
    invalidCommand: process.env.MSG_INVALID_COMMAND || '❓ Invalid command! Type .menu for help'
  },

  // Timezone
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  // Limits
  maxWarnings: parseInt(process.env.MAX_WARNINGS) || 3,

  // Social Links (optional, from env)
  social: {
    github: process.env.SOCIAL_GITHUB || 'https://github.com/Dexsam07',
    instagram: process.env.SOCIAL_INSTAGRAM || 'https://instagram.com/@Dex_shyam_42',
    youtube: process.env.SOCIAL_YOUTUBE || 'http://youtube.com/@Dex_shyam_07'
  }
};

// Validate ownerNumber and ownerName lengths (if both are set, they should match)
if (config.ownerNumber.length !== config.ownerName.length) {
  console.warn('⚠️ Warning: ownerNumber and ownerName arrays have different lengths. Owner commands may not work as expected.');
}

// Ensure ownerNumber and ownerName are arrays (they already are, but just in case)
if (!Array.isArray(config.ownerNumber)) config.ownerNumber = [config.ownerNumber];
if (!Array.isArray(config.ownerName)) config.ownerName = [config.ownerName];

// Export the configuration
module.exports = config;