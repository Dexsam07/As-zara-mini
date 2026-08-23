function numberPart(jid) {
  return String(jid || '').split('@')[0].split(':')[0];
}

function matches(participant, jid) {
  if (!participant || !jid) return false;
  const wanted = numberPart(jid);
  return [participant.id, participant.lid, participant.userJid, participant.phoneNumber]
    .filter(Boolean)
    .some(value => value === jid || numberPart(value) === wanted);
}

module.exports = async function isAdmin(sock, chatId, senderId) {
  if (!chatId || !chatId.endsWith('@g.us')) {
    return { isSenderAdmin: false, isBotAdmin: false };
  }

  try {
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];
    const sender = participants.find(participant => matches(participant, senderId));
    const bot = participants.find(participant => matches(participant, sock.user?.id) || matches(participant, sock.user?.lid));
    const admin = participant => participant?.admin === 'admin' || participant?.admin === 'superadmin';
    return { isSenderAdmin: admin(sender), isBotAdmin: admin(bot) };
  } catch (_) {
    return { isSenderAdmin: false, isBotAdmin: false };
  }
};
