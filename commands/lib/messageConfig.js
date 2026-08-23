const config = require('../../config');

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.newsletterJid || '120363406449026172@newsletter',
      newsletterName: config.botName || 'AS-ZARA-MINI',
      serverMessageId: -1
    }
  }
};

module.exports = { channelInfo };
