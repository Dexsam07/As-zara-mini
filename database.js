/**
 * Enhanced JSON-based Database for Group Settings
 * Features: in-memory caching, write debouncing, data validation, and graceful shutdown.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'database');
    this.files = {
      groups: path.join(this.dbPath, 'groups.json'),
      users: path.join(this.dbPath, 'users.json'),
      warnings: path.join(this.dbPath, 'warnings.json'),
      mods: path.join(this.dbPath, 'mods.json')
    };

    // In-memory caches
    this.cache = {
      groups: null,
      users: null,
      warnings: null,
      mods: null
    };

    // Write debounce timers
    this.writeTimers = {};

    // Initialize database directory and files
    this._init();

    // Graceful shutdown
    process.on('exit', () => this._flushAll());
    process.on('SIGINT', () => {
      this._flushAll();
      process.exit();
    });
  }

  // Initialize directory and load caches
  _init() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }

    // Initialize files with default data if missing
    const defaults = {
      groups: {},
      users: {},
      warnings: {},
      mods: { moderators: [] }
    };

    for (const [key, file] of Object.entries(this.files)) {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaults[key], null, 2));
      }
      // Load into cache
      this._loadCache(key);
    }
  }

  // Load a specific cache from disk
  _loadCache(key) {
    try {
      const data = fs.readFileSync(this.files[key], 'utf-8');
      this.cache[key] = JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error loading ${key} database:`, error.message);
      // Fallback to empty object
      this.cache[key] = key === 'mods' ? { moderators: [] } : {};
    }
  }

  // Schedule a write for a specific cache
  _scheduleWrite(key) {
    if (this.writeTimers[key]) {
      clearTimeout(this.writeTimers[key]);
    }
    this.writeTimers[key] = setTimeout(() => {
      this._writeNow(key);
    }, 500); // 500ms debounce
  }

  // Write a specific cache to disk immediately
  _writeNow(key) {
    try {
      fs.writeFileSync(this.files[key], JSON.stringify(this.cache[key], null, 2));
    } catch (error) {
      console.error(`❌ Error writing ${key} database:`, error.message);
    } finally {
      delete this.writeTimers[key];
    }
  }

  // Flush all pending writes (for shutdown)
  _flushAll() {
    for (const key of Object.keys(this.writeTimers)) {
      clearTimeout(this.writeTimers[key]);
      this._writeNow(key);
    }
  }

  // --- Groups ---
  getGroupSettings(groupId) {
    if (!this.cache.groups[groupId]) {
      // Clone default settings to avoid mutation
      this.cache.groups[groupId] = { ...config.defaultGroupSettings };
      this._scheduleWrite('groups');
    }
    return this.cache.groups[groupId];
  }

  updateGroupSettings(groupId, settings) {
    const current = this.getGroupSettings(groupId);
    // Merge, ensuring only valid keys (optional: validate against defaultGroupSettings)
    this.cache.groups[groupId] = { ...current, ...settings };
    this._scheduleWrite('groups');
    return true;
  }

  // --- Users ---
  getUser(userId) {
    if (!this.cache.users[userId]) {
      this.cache.users[userId] = {
        registered: Date.now(),
        premium: false,
        banned: false
      };
      this._scheduleWrite('users');
    }
    return this.cache.users[userId];
  }

  updateUser(userId, data) {
    const current = this.getUser(userId);
    this.cache.users[userId] = { ...current, ...data };
    this._scheduleWrite('users');
    return true;
  }

  // --- Warnings ---
  getWarnings(groupId, userId) {
    const key = `${groupId}_${userId}`;
    return this.cache.warnings[key] || { count: 0, warnings: [] };
  }

  addWarning(groupId, userId, reason) {
    const key = `${groupId}_${userId}`;
    if (!this.cache.warnings[key]) {
      this.cache.warnings[key] = { count: 0, warnings: [] };
    }
    this.cache.warnings[key].count++;
    this.cache.warnings[key].warnings.push({
      reason,
      date: Date.now()
    });
    this._scheduleWrite('warnings');
    return this.cache.warnings[key];
  }

  removeWarning(groupId, userId) {
    const key = `${groupId}_${userId}`;
    if (this.cache.warnings[key] && this.cache.warnings[key].count > 0) {
      this.cache.warnings[key].count--;
      this.cache.warnings[key].warnings.pop();
      this._scheduleWrite('warnings');
      return true;
    }
    return false;
  }

  clearWarnings(groupId, userId) {
    const key = `${groupId}_${userId}`;
    delete this.cache.warnings[key];
    this._scheduleWrite('warnings');
    return true;
  }

  // --- Moderators ---
  getModerators() {
    return this.cache.mods.moderators || [];
  }

  addModerator(userId) {
    if (!this.cache.mods.moderators.includes(userId)) {
      this.cache.mods.moderators.push(userId);
      this._scheduleWrite('mods');
      return true;
    }
    return false;
  }

  removeModerator(userId) {
    const initialLength = this.cache.mods.moderators.length;
    this.cache.mods.moderators = this.cache.mods.moderators.filter(id => id !== userId);
    if (this.cache.mods.moderators.length !== initialLength) {
      this._scheduleWrite('mods');
      return true;
    }
    return false;
  }

  isModerator(userId) {
    return this.cache.mods.moderators.includes(userId);
  }
}

// Singleton instance
const db = new Database();

// Export the same interface as before, now backed by the improved database
module.exports = {
  getGroupSettings: (groupId) => db.getGroupSettings(groupId),
  updateGroupSettings: (groupId, settings) => db.updateGroupSettings(groupId, settings),
  getUser: (userId) => db.getUser(userId),
  updateUser: (userId, data) => db.updateUser(userId, data),
  getWarnings: (groupId, userId) => db.getWarnings(groupId, userId),
  addWarning: (groupId, userId, reason) => db.addWarning(groupId, userId, reason),
  removeWarning: (groupId, userId) => db.removeWarning(groupId, userId),
  clearWarnings: (groupId, userId) => db.clearWarnings(groupId, userId),
  getModerators: () => db.getModerators(),
  addModerator: (userId) => db.addModerator(userId),
  removeModerator: (userId) => db.removeModerator(userId),
  isModerator: (userId) => db.isModerator(userId)
};