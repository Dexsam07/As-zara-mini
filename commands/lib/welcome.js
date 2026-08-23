const database = require('../../database');

async function handleWelcome(sock, chatId, message, input = '') {
  const value = String(input).trim();
  const lower = value.toLowerCase();
  const current = database.getGroupSettings(chatId);

  if (lower === 'on' || lower === 'off') {
    const enabled = lower === 'on';
    database.updateGroupSettings(chatId, { welcome: enabled });
    return sock.sendMessage(chatId, {
      text: `✅ Welcome messages ${enabled ? 'enabled' : 'disabled'}.`
    }, { quoted: message });
  }

  if (!value) {
    return sock.sendMessage(chatId, {
      text: `ℹ️ Welcome messages are currently ${current.welcome ? 'enabled' : 'disabled'}.\nUsage: .welcome on|off|your custom message`
    }, { quoted: message });
  }

  database.updateGroupSettings(chatId, {
    welcome: true,
    welcomeMessage: value.slice(0, 500)
  });
  return sock.sendMessage(chatId, {
    text: '✅ Custom welcome message saved and enabled.\nUse {user}, {group}, and {description} as placeholders.'
  }, { quoted: message });
}

module.exports = { handleWelcome };
