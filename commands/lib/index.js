const config = require('../../config');
const database = require('../../database');

function normalize(value) {
  return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

async function isSudo(senderId) {
  const sender = normalize(senderId);
  return (config.ownerNumber || []).some(owner => normalize(owner) === sender) || database.isModerator(sender);
}

async function isWelcomeOn(groupId) {
  return Boolean(database.getGroupSettings(groupId).welcome);
}

async function getWelcome(groupId) {
  return database.getGroupSettings(groupId).welcomeMessage || '';
}

module.exports = { isSudo, isWelcomeOn, getWelcome };
