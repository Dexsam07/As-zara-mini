const fs = require('fs/promises');
const path = require('path');

const root = path.join(__dirname, '..', '..', 'database');
const pending = new Map();

async function readNamespace(namespace) {
  const file = path.join(root, `${String(namespace).replace(/[^a-z0-9_-]/gi, '_')}.json`);
  try {
    const value = JSON.parse(await fs.readFile(file, 'utf8'));
    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`[STORE] Could not read ${namespace}: ${error.message}`);
    return {};
  }
}

async function writeNamespace(namespace, value) {
  const file = path.join(root, `${String(namespace).replace(/[^a-z0-9_-]/gi, '_')}.json`);
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  await fs.rename(temp, file);
}

async function getSetting(namespace, key) {
  const values = await readNamespace(namespace);
  return values[key];
}

async function saveSetting(namespace, key, value) {
  const previous = pending.get(namespace) || Promise.resolve();
  const operation = previous.then(async () => {
    const values = await readNamespace(namespace);
    if (value === null || value === undefined) delete values[key];
    else values[key] = value;
    await writeNamespace(namespace, values);
    return value;
  });
  pending.set(namespace, operation.catch(() => {}));
  return operation;
}

module.exports = { getSetting, saveSetting };
