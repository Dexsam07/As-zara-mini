const fs = require('fs');
const path = require('path');

const markerFile = path.join(__dirname, '..', 'database', 'connection-notification.json');
const inFlight = new Set();

function normalizeSelfJid(rawId) {
  if (!rawId || typeof rawId !== 'string') return null;
  const base = rawId.split(':')[0];
  if (!base) return null;
  return base.includes('@') ? base : `${base}@s.whatsapp.net`;
}

function readMarker() {
  try {
    if (!fs.existsSync(markerFile)) return { notified: {} };
    const parsed = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    return parsed && typeof parsed === 'object' && parsed.notified && typeof parsed.notified === 'object'
      ? parsed
      : { notified: {} };
  } catch {
    return { notified: {} };
  }
}

function writeMarker(marker) {
  const dir = path.dirname(markerFile);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const temp = `${markerFile}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(marker, null, 2), { mode: 0o600 });
  fs.renameSync(temp, markerFile);
}

async function notifyConnectedOnce(sock, config) {
  if (config.connectionNotifyEnabled === false) return { sent: false, reason: 'disabled' };
  const jid = normalizeSelfJid(sock?.user?.id);
  if (!jid) return { sent: false, reason: 'missing-bot-jid' };
  if (inFlight.has(jid)) return { sent: false, reason: 'already-in-flight' };

  const marker = readMarker();
  if (marker.notified[jid]) return { sent: false, reason: 'already-sent' };

  inFlight.add(jid);
  try {
    const developer = config.developerName || 'Dex Shyam Chaudhari';
    const github = config.githubUrl || 'https://github.com/Dexsam07/As-zara-mini';
    const message = [
      '✅ *Bot Connected Successfully!*',
      '',
      `🤖 *Bot:* ${config.botName || 'AS-ZARA Mini Bot'}`,
      `👨‍💻 *Developer:* ${developer}`,
      `🔗 *GitHub:* ${github}`,
      '',
      '📡 WhatsApp connection is active and the bot is ready to receive commands.'
    ].join('\n');

    await sock.sendMessage(jid, { text: message });
    marker.notified[jid] = { sentAt: new Date().toISOString(), botName: config.botName || null };
    writeMarker(marker);
    return { sent: true, jid };
  } finally {
    inFlight.delete(jid);
  }
}

module.exports = { notifyConnectedOnce, normalizeSelfJid };
