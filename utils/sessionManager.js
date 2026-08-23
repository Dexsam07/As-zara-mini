const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const AS1_PREFIX = 'AS!';
const DEX_PREFIX = 'DEX~';
const MAX_SESSION_ID_BYTES = 12 * 1024 * 1024;
const MAX_SESSION_FILES = 2000;

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  return normalized === value.replace(/\\/g, '/') && normalized !== '.' && !normalized.startsWith('../') && !normalized.includes('/../');
}

function collectFiles(rootDir, currentDir = rootDir, output = []) {
  if (output.length > MAX_SESSION_FILES) throw new Error('session contains too many files');
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symbolic links are not allowed: ${entry.name}`);
    if (entry.isDirectory()) collectFiles(rootDir, fullPath, output);
    else if (entry.isFile()) {
      const relativePath = path.relative(rootDir, fullPath).split(path.sep).join('/');
      if (!safeRelativePath(relativePath)) throw new Error(`unsafe session path: ${relativePath}`);
      output.push({ path: relativePath, data: fs.readFileSync(fullPath).toString('base64') });
    }
  }
  return output;
}

function createSessionId(sessionDir) {
  if (!fs.existsSync(sessionDir) || !fs.statSync(sessionDir).isDirectory()) {
    throw new Error(`session directory not found: ${sessionDir}`);
  }
  const files = collectFiles(sessionDir);
  if (!files.some(file => file.path === 'creds.json')) throw new Error('session is missing creds.json');

  const payload = JSON.stringify({
    version: 2,
    algorithm: 'gzip+base64',
    createdAt: new Date().toISOString(),
    files
  });
  const compressed = zlib.gzipSync(Buffer.from(payload, 'utf8'), { level: 9 });
  return `${DEX_PREFIX}${compressed.toString('base64')}`;
}

function decodeCompressed(value) {
  const encoded = value.replace(/\.\.\./g, '').replace(/\s+/g, '');
  if (!encoded || !/^[A-Za-z0-9+/_=-]+$/.test(encoded)) throw new Error('invalid Base64 session payload');
  const normalizedBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const compressed = Buffer.from(normalizedBase64, 'base64');
  if (compressed.length > MAX_SESSION_ID_BYTES) throw new Error('session payload is too large');
  let data;
  const decoders = [
    () => zlib.gunzipSync(compressed),
    () => zlib.inflateSync(compressed),
    () => zlib.inflateRawSync(compressed)
  ];
  let lastError;
  for (const decode of decoders) {
    try {
      data = decode();
      break;
    } catch (error) {
      lastError = error;
    }
  }
  // Some older generators stored the complete JSON payload without
  // compression. Accept it only when it is valid UTF-8 JSON; all later
  // structural checks still run in validatePayload().
  if (!data) {
    const text = compressed.toString('utf8').trim();
    if (text.startsWith('{') || text.startsWith('[')) data = compressed;
  }
  if (!data) throw new Error(`unsupported session compression: ${lastError?.message || 'invalid payload'}`);
  if (data.length > MAX_SESSION_ID_BYTES) throw new Error('decompressed session payload is too large');
  return data;
}

function isCredentialsObject(value) {
  return Boolean(value && typeof value === 'object' && (
    value.registered !== undefined ||
    value.noiseKey ||
    value.signedIdentityKey ||
    value.signedPreKey ||
    value.registrationId
  ));
}

function validatePayload(payload) {
  if (!payload || payload.version !== 2 || !Array.isArray(payload.files)) {
    throw new Error('unsupported complete-session envelope');
  }
  if (payload.files.length === 0 || payload.files.length > MAX_SESSION_FILES) {
    throw new Error('invalid session file count');
  }
  const seen = new Set();
  for (const file of payload.files) {
    if (!safeRelativePath(file.path) || seen.has(file.path)) throw new Error(`unsafe or duplicate session path: ${file.path}`);
    if (typeof file.data !== 'string' || !/^[A-Za-z0-9+/=]*$/.test(file.data)) throw new Error(`invalid session file data: ${file.path}`);
    seen.add(file.path);
  }
  if (!seen.has('creds.json')) throw new Error('DEX~ session is missing creds.json');
}

function atomicReplaceDirectory(tempDir, targetDir) {
  const backupDir = `${targetDir}.backup-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  let movedExisting = false;
  try {
    if (fs.existsSync(targetDir)) {
      fs.renameSync(targetDir, backupDir);
      movedExisting = true;
    }
    fs.renameSync(tempDir, targetDir);
    if (movedExisting) fs.rmSync(backupDir, { recursive: true, force: true });
  } catch (error) {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    if (movedExisting && !fs.existsSync(targetDir)) fs.renameSync(backupDir, targetDir);
    throw error;
  }
}

function restoreSessionId(sessionId, targetDir) {
  if (typeof sessionId !== 'string' || !sessionId.trim()) return { restored: false, format: 'none' };
  const value = sessionId.trim();
  if (!value.startsWith(AS1_PREFIX) && !value.startsWith(DEX_PREFIX)) {
    throw new Error('session must start with DEX~');
  }

  const isNewFormat = value.startsWith(DEX_PREFIX);
  const prefixLength = isNewFormat ? DEX_PREFIX.length : AS1_PREFIX.length;
  const data = decodeCompressed(value.slice(prefixLength));
  const tempDir = `${targetDir}.tmp-${process.pid}-${Date.now()}`;
  fs.mkdirSync(tempDir, { recursive: true, mode: 0o700 });

  try {
    if (isNewFormat) {
      const payload = JSON.parse(data.toString('utf8'));

      // Compatibility with older DEX~ generators that wrapped a compressed
      // creds.json object directly, without the complete files[] envelope.
      if (isCredentialsObject(payload)) {
        fs.writeFileSync(path.join(tempDir, 'creds.json'), JSON.stringify(payload), { mode: 0o600 });
        atomicReplaceDirectory(tempDir, targetDir);
        return { restored: true, format: 'LEGACY-CREDS', files: 1, complete: false };
      }

      validatePayload(payload);
      for (const file of payload.files) {
        const destination = path.join(tempDir, ...file.path.split('/'));
        fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
        fs.writeFileSync(destination, Buffer.from(file.data, 'base64'), { mode: 0o600 });
      }
      atomicReplaceDirectory(tempDir, targetDir);
      return { restored: true, format: 'DEX~', files: payload.files.length, complete: payload.files.length > 1 };
    }

    // AS1 compatibility: the old format contains only compressed creds data.
    const credsPath = path.join(tempDir, 'creds.json');
    JSON.parse(data.toString('utf8'));
    fs.writeFileSync(credsPath, data, { mode: 0o600 });
    atomicReplaceDirectory(tempDir, targetDir);
    return { restored: true, format: 'AS1', files: 1, complete: false };
  } catch (error) {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

module.exports = { createSessionId, restoreSessionId, AS1_PREFIX, DEX_PREFIX };
