const assert = require('assert');
const update = require('./commands/owner/update');

(async () => {
  const replies = [];
  const sends = [];
  const before = require('crypto').createHash('sha256').update(require('fs').readFileSync('./commands/owner/update.js')).digest('hex');
  const extra = {
    from: 'dry-run-test@s.whatsapp.net',
    reply: async text => { replies.push(String(text)); return { key: { id: 'dry-run' } }; }
  };
  const sock = { sendMessage: async (...args) => sends.push(args) };
  await update.execute(sock, { key: { remoteJid: extra.from } }, ['dry-run', 'https://github.com/Dexsam07/As-zara-mini/archive/refs/heads/main.zip'], extra);
  const after = require('crypto').createHash('sha256').update(require('fs').readFileSync('./commands/owner/update.js')).digest('hex');
  assert.strictEqual(before, after, 'update command changed during dry-run');
  assert.ok(replies.some(text => text.includes('Dry-run complete')), replies.join('\n'));
  assert.strictEqual(sends.length, 0, 'dry-run sent a restart/update message');
  console.log('UPDATE_DRY_RUN_PASSED');
  console.log(replies.join('\n'));
})().catch(error => { console.error(error); process.exit(1); });
