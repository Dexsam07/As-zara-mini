/**
 * Calculator Command - Perform safe arithmetic calculations.
 */

function calculate(expression) {
  const compact = expression.replace(/\s+/g, '');
  const tokens = compact.match(/\d+(?:\.\d+)?|[()+\-*/]/g) || [];
  if (tokens.join('') !== compact) throw new Error('invalid characters');

  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function parsePrimary() {
    const token = peek();
    if (token === '(') {
      consume();
      const value = parseAdditive();
      if (consume() !== ')') throw new Error('missing closing parenthesis');
      return value;
    }
    if (token === '+' || token === '-') {
      consume();
      const value = parsePrimary();
      return token === '-' ? -value : value;
    }
    if (!/^\d+(?:\.\d+)?$/.test(token || '')) throw new Error('expected number');
    consume();
    return Number(token);
  }

  function parseMultiplicative() {
    let value = parsePrimary();
    while (peek() === '*' || peek() === '/') {
      const operator = consume();
      const right = parsePrimary();
      if (operator === '/' && right === 0) throw new Error('division by zero');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  function parseAdditive() {
    let value = parseMultiplicative();
    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      const right = parseMultiplicative();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  if (!tokens.length) throw new Error('empty expression');
  const result = parseAdditive();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error('invalid result');
  return result;
}

module.exports = {
  name: 'calc',
  aliases: ['calculate', 'math'],
  category: 'utility',
  description: 'Calculate math expressions',
  usage: '.calc <expression>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('❌ Usage: .calc <expression>\n\nExample: .calc 5 + 3 * 2');
      }

      const expression = args.join(' ');
      if (expression.length > 200) {
        return extra.reply('❌ Expression is too long. Maximum length is 200 characters.');
      }

      try {
        const result = calculate(expression);
        await extra.reply(`🧮 *Calculator*\n\n📝 Expression: ${expression}\n✅ Result: ${result}`);
      } catch (_) {
        await extra.reply('❌ Invalid mathematical expression!');
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.calculate = calculate;

  