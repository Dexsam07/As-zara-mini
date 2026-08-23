const fs = require('fs');
const path = require('path');
const { emojis } = require('./autoreact-emojis');

const CONFIG_PATH = path.join(__dirname, '../config.js');
const processedMessageIds = new Map();
const DEDUPE_TTL_MS = 10 * 60 * 1000;

function normalizeNumber(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/:(\d+)(?=@|$)/, '')
    .replace(/@.*$/, '')
    .replace(/\D/g, '');
}

function cleanJid(value) {
  return typeof value === 'string' ? value.split(':')[0] : '';
}

function getSenderJid(msg) {
  if (!msg?.key) return '';
  return cleanJid(msg.key.participant || msg.key.remoteJid || '');
}

function isTargetMessage(msg, config) {
  const target = String(config.autoReactTarget || '').trim();
  if (!target) return false;
  const targetJid = target.includes('@') ? cleanJid(target) : '';
  const senderJid = getSenderJid(msg);
  if (targetJid && senderJid === targetJid) return true;
  const targetNumber = normalizeNumber(target);
  return Boolean(targetNumber && normalizeNumber(senderJid) === targetNumber);
}

function isEligibleMessage(msg) {
  const key = msg?.key;
  if (!key?.id || key.fromMe || key.remoteJid === 'status@broadcast') return false;
  const jid = key.remoteJid || '';
  return jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid');
}

function chooseEmoji(config) {
  if (config.autoReactEmojiMode === 'fixed' && config.autoReactFixedEmoji) {
    return String(config.autoReactFixedEmoji);
  }
  return emojis[Math.floor(Math.random() * emojis.length)] || '❤️';
}

function shouldReact(msg, config) {
  if (!config.autoReact || !isEligibleMessage(msg)) return false;
  const mode = config.autoReactMode || 'target';
  if (mode === 'target') return isTargetMessage(msg, config);
  if (mode === 'all') return true;
  if (mode === 'bot') {
    const content = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message || {};
    const text = content.conversation || content.extendedTextMessage?.text || '';
    const prefix = String(config.prefix || '.');
    return text.trim().startsWith(prefix);
  }
  return false;
}

function claimMessage(msg) {
  const id = msg?.key?.id;
  if (!id) return false;
  const now = Date.now();
  for (const [key, time] of processedMessageIds) {
    if (now - time > DEDUPE_TTL_MS) processedMessageIds.delete(key);
  }
  if (processedMessageIds.has(id)) return false;
  processedMessageIds.set(id, now);
  return true;
}

async function reactIfTarget(sock, msg, config) {
  if (!shouldReact(msg, config) || !claimMessage(msg)) return false;
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: chooseEmoji(config), key: msg.key }
  });
  return true;
}

function load() {
  try {
    delete require.cache[require.resolve('../config.js')];
    const config = require('../config.js');
    return {
      enabled: Boolean(config.autoReact),
      mode: config.autoReactMode || 'target',
      target: config.autoReactTarget || '',
      emojiMode: config.autoReactEmojiMode || 'random',
      fixedEmoji: config.autoReactFixedEmoji || '❤️'
    };
  } catch {
    return { enabled: false, mode: 'target', target: '', emojiMode: 'random', fixedEmoji: '❤️' };
  }
}

function save(data) {
  try {
    let content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const replaceOrAdd = (key, value) => {
      const pattern = new RegExp(`^\\s*${key}\\s*:\\s*[^,\\n]+,?`, 'm');
      if (pattern.test(content)) content = content.replace(pattern, `    ${key}: ${value},`);
      else content = content.replace(/(autoReactFixedEmoji:[^\\n]*,?)/, `$1\\n    ${key}: ${value},`);
    };
    replaceOrAdd('autoReact', Boolean(data.enabled));
    replaceOrAdd('autoReactMode', JSON.stringify(data.mode || 'target'));
    replaceOrAdd('autoReactTarget', JSON.stringify(data.target || ''));
    replaceOrAdd('autoReactEmojiMode', JSON.stringify(data.emojiMode || 'random'));
    replaceOrAdd('autoReactFixedEmoji', JSON.stringify(data.fixedEmoji || '❤️'));
    fs.writeFileSync(CONFIG_PATH, content, 'utf8');
    delete require.cache[require.resolve('../config.js')];
  } catch (error) {
    console.error('[autoReact] save error:', error.message || error);
  }
}

module.exports = { load, save, normalizeNumber, getSenderJid, shouldReact, reactIfTarget, chooseEmoji };
