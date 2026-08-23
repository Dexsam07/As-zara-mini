const autoReact = require('../../utils/autoReact');

function normalizeTarget(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (raw.includes('@')) {
    const jid = raw.split(':')[0];
    return /@(s\.whatsapp\.net|lid)$/.test(jid) ? jid : '';
  }
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
}

function help() {
  return [
    '📋 *AutoReact Commands:*',
    '',
    '• `.autoreact on <number>` — selected number ke messages par react',
    '• `.autoreact off` — feature band',
    '• `.autoreact status` — current settings',
    '• `.autoreact emoji random` — emoji list se random reaction',
    '• `.autoreact emoji fixed ❤️` — fixed emoji reaction',
    '• `.autoreact emoji custom ❤️ [number]` — apna custom emoji reaction',
    '• `.autoreact custom ❤️ [number]` — custom emoji ka shorthand',
    '• `.autoreact set bot` — legacy: sirf bot commands par react',
    '• `.autoreact set all` — legacy: sabhi messages par react',
    '',
    'Number country code ke saath do, jaise: 919876543210'
  ].join('\n');
}

module.exports = {
  name: 'autoreact',
  aliases: ['ar'],
  category: 'owner',
  description: 'React to messages from one selected number in DMs and groups',
  usage: '.autoreact on <country-code-number> | off | status | emoji | set bot|all',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const current = autoReact.load();
      const action = String(args[0] || 'status').toLowerCase();
      const subAction = String(args[1] || '').toLowerCase();

      if (action === 'help') return extra.reply(help());

      if (action === 'status') {
        return extra.reply([
          '🤖 *AutoReact Status*',
          `• Feature: ${current.enabled ? 'ON' : 'OFF'}`,
          `• Mode: ${current.mode}`,
          `• Target: ${current.target || 'not set'}`,
          `• Emoji: ${current.emojiMode === 'fixed' ? current.fixedEmoji : 'random'}`,
          '',
          help()
        ].join('\n'));
      }

      if (action === 'on') {
        const target = normalizeTarget(args[1] || current.target);
        if (!target) return extra.reply('❌ Target number do. Example: `.autoreact on 919876543210`');
        autoReact.save({ ...current, enabled: true, mode: 'target', target });
        return extra.reply(`✅ AutoReact ON\n🎯 Target: ${target}\nDM aur group dono mein is number ke naye messages par reaction aayega.`);
      }

      if (action === 'off') {
        autoReact.save({ ...current, enabled: false });
        return extra.reply('✅ AutoReact OFF. Ab automatic reactions nahi bheje jayenge.');
      }

      if (action === 'set' && (subAction === 'bot' || subAction === 'all')) {
        autoReact.save({ ...current, enabled: true, mode: subAction });
        return extra.reply(`✅ AutoReact ON\nMode: ${subAction}\nTarget mode ke liye use karo: .autoreact on <number>`);
      }

      if (action === 'emoji' || action === 'custom') {
        if (action === 'custom') {
          const rawArgs = args.slice(1);
          if (!rawArgs.length) return extra.reply('Usage: `.autoreact custom ❤️ [number]`');
          const possibleTarget = rawArgs[rawArgs.length - 1];
          const hasExplicitTarget = /(?:@s\.whatsapp\.net|@lid)$/.test(possibleTarget) || /^\+?[\d\s()-]{7,}$/.test(possibleTarget);
          const target = hasExplicitTarget ? normalizeTarget(possibleTarget) : current.target;
          const emojiParts = hasExplicitTarget ? rawArgs.slice(0, -1) : rawArgs;
          const emoji = emojiParts.join(' ').trim();
          if (!emoji) return extra.reply('Usage: `.autoreact custom ❤️ [number]`');
          const mode = target && target !== current.target ? 'target' : current.mode;
          autoReact.save({ ...current, enabled: true, mode, target, emojiMode: 'fixed', fixedEmoji: emoji });
          if (mode === 'target' && !target) {
            return extra.reply(`✅ Custom emoji saved: ${emoji}\n⚠️ Target number missing. Use: .autoreact on 919876543210`);
          }
          return extra.reply(`✅ Custom emoji active: ${emoji}\nMode: ${mode}${target ? `\n🎯 Target: ${target}` : ''}`);
        }
        if (subAction === 'random') {
          autoReact.save({ ...current, emojiMode: 'random' });
          return extra.reply('✅ Random emoji mode enabled.');
        }
        if ((subAction === 'fixed' || subAction === 'custom') && args.slice(2).join(' ').trim()) {
          const emoji = args.slice(2).join(' ').trim();
          autoReact.save({ ...current, enabled: true, emojiMode: 'fixed', fixedEmoji: emoji });
          return extra.reply(`✅ Custom emoji enabled: ${emoji}`);
        }
        return extra.reply('Usage: `.autoreact emoji random` ya `.autoreact emoji custom ❤️ [number]`');
      }

      return extra.reply(help());
    } catch (error) {
      console.error('[autoreact command] error:', error);
      return extra.reply(`❌ AutoReact error: ${error.message || 'configuration failed'}`);
    }
  }
};
