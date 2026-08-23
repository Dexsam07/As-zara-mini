const axios = require('axios');
const config = require('../../config');

const REPO_URL = 'https://github.com/Dexsam07/As-zara-mini';
const PAIRING_URL = 'https://dex-sessions.zone.id/';
const API_URL = 'https://api.github.com/repos/Dexsam07/As-zara-mini';

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function fallbackMessage() {
  return [
    '╭━━『 *GitHub Repository* 』━━╮',
    '',
    `🤖 *Bot:* ${config.botName || 'AS-ZARA-MINI'}`,
    '👤 *Owner:* Dexsam07',
    '🔗 *Repository:* As-zara-mini',
    `🌐 *Repo link:* ${REPO_URL}`,
    `🔗 *Pairing link:* ${PAIRING_URL}`,
    '',
    '📊 *Live stats temporarily unavailable*',
    '⭐ Stars: check repository',
    '🍴 Forks: check repository',
    '',
    '╰━━━━━━━━━━━━━━━━━━╯'
  ].join('\n');
}

module.exports = {
  name: 'repo',
  aliases: [],
  category: 'general',
  description: 'Show GitHub repository link and live star/fork counts',
  usage: '.repo',
  ownerOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const loading = await extra.reply('🔍 GitHub repository stats fetch ho rahe hain...');
      let text;
      try {
        const response = await axios.get(API_URL, {
          timeout: 15000,
          headers: { 'User-Agent': 'AS-ZARA-MINI-BOT' }
        });
        const repo = response.data || {};
        text = [
          '╭━━『 *GitHub Repository* 』━━╮',
          '',
          `🤖 *Bot:* ${config.botName || 'AS-ZARA-MINI'}`,
          `👤 *Owner:* ${repo.owner?.login || 'Dexsam07'}`,
          `🔗 *Repository:* ${repo.full_name || 'Dexsam07/As-zara-mini'}`,
          `🌐 *Repo link:* ${repo.html_url || REPO_URL}`,
          `🔗 *Pairing link:* ${PAIRING_URL}`,
          '',
          '📊 *Repository Stats*',
          `⭐ *Stars:* ${formatCount(repo.stargazers_count)}`,
          `🍴 *Forks:* ${formatCount(repo.forks_count)}`,
          `👀 *Watchers:* ${formatCount(repo.watchers_count)}`,
          '',
          `⭐ Star: ${repo.html_url || REPO_URL}/stargazers`,
          `🍴 Fork: ${repo.html_url || REPO_URL}/fork`,
          '',
          '╰━━━━━━━━━━━━━━━━━━╯'
        ].join('\n');
      } catch (apiError) {
        console.error('[repo] GitHub API error:', apiError.message || apiError);
        text = fallbackMessage();
      }

      if (loading?.key) {
        return sock.sendMessage(extra.from, { text, edit: loading.key });
      }
      return extra.reply(text);
    } catch (error) {
      console.error('[repo] command error:', error);
      return extra.reply(fallbackMessage());
    }
  }
};
