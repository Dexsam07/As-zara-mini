/**
 * Safe Update Command - hot reload command files, controlled restart for core updates.
 * State directories and configuration are always preserved.
 */

const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('../../config');

const MAX_REDIRECTS = 5;
const UPDATE_TIMEOUT_MS = 60 * 1000;

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true, timeout: UPDATE_TIMEOUT_MS }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
      resolve((stdout || '').toString());
    });
  });
}

function runFile(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: UPDATE_TIMEOUT_MS }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
      resolve((stdout || '').toString());
    });
  });
}

function withTimeout(promise, ms, label = 'operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000} seconds`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function extractZip(zipPath, outDir) {
  if (process.platform === 'win32') {
    await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`);
    return;
  }
  try { await run('command -v unzip'); await run(`unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
  try { await run('command -v 7z'); await run(`7z x -y '${zipPath}' -o'${outDir}'`); return; } catch {}
  try { await run('busybox unzip -h'); await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
  throw new Error('No unzip tool found');
}

function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    if (visited.has(url) || visited.size > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
    visited.add(url);
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'AS-ZARA-MINI-Updater/2.0', Accept: '*/*' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        res.resume();
        if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
        return downloadFile(new URL(location, url).toString(), dest, visited).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', error => { try { file.close(() => {}); } catch {} fs.unlink(dest, () => reject(error)); });
    });
    req.setTimeout(UPDATE_TIMEOUT_MS, () => req.destroy(new Error('Download timed out after 60 seconds')));
    req.on('error', error => fs.unlink(dest, () => reject(error)));
  });
}

function walkFiles(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, output);
    else output.push(full);
  }
  return output;
}

async function validateJavaScriptFiles(root) {
  const jsFiles = walkFiles(root).filter(file => file.endsWith('.js'));
  for (const file of jsFiles) await runFile(process.execPath, ['--check', file]);
  return jsFiles.length;
}

function copyChangedFiles(src, dest, ignore = [], relative = '', changes = [], backupRoot = '') {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const sourcePath = path.join(src, entry);
    const destinationPath = path.join(dest, entry);
    const relativePath = path.join(relative, entry).replace(/\\/g, '/');
    const stat = fs.lstatSync(sourcePath);
    if (stat.isDirectory()) {
      copyChangedFiles(sourcePath, destinationPath, ignore, path.join(relative, entry), changes, backupRoot);
      continue;
    }
    const sourceBuffer = fs.readFileSync(sourcePath);
    const existing = fs.existsSync(destinationPath) ? fs.readFileSync(destinationPath) : null;
    if (existing && Buffer.compare(sourceBuffer, existing) === 0) continue;
    if (existing && backupRoot) {
      const backupPath = path.join(backupRoot, relativePath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(destinationPath, backupPath);
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
    changes.push(relativePath);
  }
}

function restoreBackup(backupRoot, cwd) {
  if (!fs.existsSync(backupRoot)) return;
  for (const backupFile of walkFiles(backupRoot)) {
    const relative = path.relative(backupRoot, backupFile);
    const destination = path.join(cwd, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(backupFile, destination);
  }
}

async function updateViaZip(zipUrl) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  const zipPath = path.join(tmpDir, `update-${Date.now()}.zip`);
  const extractTo = path.join(tmpDir, `update-extract-${Date.now()}`);
  const backupRoot = path.join(tmpDir, `update-backup-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    await withTimeout(downloadFile(zipUrl, zipPath), UPDATE_TIMEOUT_MS, 'download');
    await withTimeout(extractZip(zipPath, extractTo), UPDATE_TIMEOUT_MS, 'extract');
    const entries = fs.readdirSync(extractTo);
    const rootCandidate = entries.length === 1 ? path.join(extractTo, entries[0]) : extractTo;
    const srcRoot = fs.existsSync(rootCandidate) && fs.lstatSync(rootCandidate).isDirectory() ? rootCandidate : extractTo;
    const validatedJavaScriptFiles = await validateJavaScriptFiles(srcRoot);
    const ignore = ['node_modules', '.git', 'session', 'tmp', 'temp', 'database', 'config.js'];
    const changedFiles = [];
    copyChangedFiles(srcRoot, process.cwd(), ignore, '', changedFiles, backupRoot);
    return { changedFiles, validatedJavaScriptFiles, backupRoot };
  } catch (error) {
    restoreBackup(backupRoot, process.cwd());
    throw error;
  } finally {
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}
  }
}

function requiresRestart(changedFiles, fullMode) {
  if (fullMode) return true;
  return changedFiles.some(file => /^(index\.js|handler\.js|package\.json|package-lock\.json|utils\/commandLoader\.js)$/.test(file));
}

module.exports = {
  name: 'update',
  aliases: ['upgrade'],
  category: 'owner',
  description: 'Safely hot-update commands or controlled-restart core files',
  usage: '.update <zip_url> | .update full <zip_url>',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    const chatId = msg.key.remoteJid;
    const fullMode = String(args[0] || '').toLowerCase() === 'full';
    const zipUrl = (args[fullMode ? 1 : 0] || config.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
    if (!zipUrl) return extra.reply('❌ Update URL missing. Use `.update <zip_url>` or `.update full <zip_url>`');

    try {
      await extra.reply('🔄 Safe update started. Bot online rahega; maximum time: 60 seconds.');
      const result = await withTimeout(updateViaZip(zipUrl), UPDATE_TIMEOUT_MS, 'update');
      const restart = requiresRestart(result.changedFiles, fullMode);

      if (!restart) {
        let reloaded = 0;
        try {
          const handler = require('../../handler');
          if (typeof handler.reloadCommands === 'function') reloaded = handler.reloadCommands().size;
        } catch (error) {
          console.error('[UPDATE] Command reload failed:', error);
          restoreBackup(result.backupRoot, process.cwd());
          return extra.reply(`❌ New files copied but command reload failed. Old files restored.\n${error.message}`);
        }
        try { fs.rmSync(result.backupRoot, { recursive: true, force: true }); } catch {}
        return extra.reply(`✅ Hot-update complete. Bot offline nahi hua.\n📁 Changed files: ${result.changedFiles.length}\n🧩 JavaScript files validated: ${result.validatedJavaScriptFiles}\n🔄 Commands reloaded: ${reloaded}`);
      }

      await sock.sendMessage(chatId, { text: `✅ Core update validated. Changed files: ${result.changedFiles.length}\n⚠️ Controlled restart required; supervisor bot ko automatically start karega.` }, { quoted: msg });
      try { fs.rmSync(result.backupRoot, { recursive: true, force: true }); } catch {}
      try { await run('pm2 restart all'); return; } catch {}
      setTimeout(() => process.exit(0), 500);
    } catch (error) {
      console.error('Update failed:', error);
      return sock.sendMessage(chatId, { text: `❌ Update failed; running files safe rakhe gaye.\n${String(error.message || error)}` }, { quoted: msg });
    }
  }
};
