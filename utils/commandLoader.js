/**
 * Command loader and compatibility adapter.
 *
 * The project contains two command styles:
 *   1. { name, execute, ... }
 *   2. { command, handler, ... }
 *
 * Both are normalized to { name, execute, ... } so no existing command
 * needs to be removed while the codebase is gradually migrated.
 */

const fs = require('fs');
const path = require('path');

function normalizeCommand(rawCommand, filePath) {
  if (!rawCommand || typeof rawCommand !== 'object') {
    throw new TypeError('command module must export an object');
  }

  const legacyName = typeof rawCommand.command === 'string' ? rawCommand.command : null;
  const name = typeof rawCommand.name === 'string' && rawCommand.name.trim()
    ? rawCommand.name.trim()
    : legacyName;
  const modernExecute = typeof rawCommand.execute === 'function' ? rawCommand.execute : null;
  const legacyHandler = typeof rawCommand.handler === 'function' ? rawCommand.handler : null;

  if (!name || name === '-') throw new Error('missing a valid command name');
  if (!modernExecute && !legacyHandler) throw new Error('missing execute/handler function');

  const execute = modernExecute || (async (sock, message, args, context = {}) => {
    const legacyContext = {
      ...context,
      chatId: context.chatId || context.from || message.key?.remoteJid,
      senderId: context.senderId || context.sender,
      isSenderAdmin: context.isSenderAdmin ?? context.isAdmin ?? false,
      isBotAdmin: context.isBotAdmin ?? false
    };
    return legacyHandler(sock, message, args, legacyContext);
  });

  return {
    ...rawCommand,
    name,
    execute,
    aliases: Array.isArray(rawCommand.aliases) ? rawCommand.aliases : [],
    category: typeof rawCommand.category === 'string' ? rawCommand.category : 'misc',
    sourceFile: filePath
  };
}

function addKey(commands, key, command, sourceFile) {
  const normalizedKey = String(key || '').trim().toLowerCase();
  if (!normalizedKey) return;
  if (commands.has(normalizedKey) && commands.get(normalizedKey) !== command) {
    const existing = commands.get(normalizedKey);
    console.warn(`[COMMAND LOADER] Duplicate command/alias "${normalizedKey}". Keeping ${existing.sourceFile || 'earlier command'}; ignoring ${sourceFile}.`);
    return;
  }
  commands.set(normalizedKey, command);
}

function loadCommands() {
  const commands = new Map();
  const loaded = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(commandsPath)) {
    console.warn('[COMMAND LOADER] Commands directory not found');
    return commands;
  }

  for (const category of fs.readdirSync(commandsPath).sort()) {
    if (category === 'lib') continue; // compatibility modules are not commands
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const file of fs.readdirSync(categoryPath).filter(name => name.endsWith('.js')).sort()) {
      const filePath = path.join(categoryPath, file);
      try {
        delete require.cache[require.resolve(filePath)];
        loaded.push(normalizeCommand(require(filePath), filePath));
      } catch (error) {
        console.error(`[COMMAND LOADER] Skipping ${filePath}: ${error.message}`);
      }
    }
  }

  // Register primary names first. This guarantees that an alias cannot hide
  // a real command with the same spelling (for example `.fire`).
  for (const command of loaded) addKey(commands, command.name, command, command.sourceFile);
  for (const command of loaded) {
    for (const alias of command.aliases) addKey(commands, alias, command, command.sourceFile);
  }
  return commands;
}

module.exports = { loadCommands, normalizeCommand };
