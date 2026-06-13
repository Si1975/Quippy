const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../quippy.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    subreddit TEXT,
    upvotes INTEGER,
    num_comments INTEGER,
    created_utc INTEGER,
    fetched_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT,
    body TEXT,
    upvotes INTEGER,
    replies_count INTEGER,
    meme_score REAL,
    quips TEXT,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    subreddits_json TEXT,
    insights_json TEXT,
    model_used TEXT,
    signals_config_json TEXT,
    created_at INTEGER
  );
`);

// Migration for existing tables
try {
  const tableInfo = db.pragma('table_info(analyses)');
  if (!tableInfo.some(col => col.name === 'model_used')) {
    db.exec('ALTER TABLE analyses ADD COLUMN model_used TEXT;');
  }
  if (!tableInfo.some(col => col.name === 'signals_config_json')) {
    db.exec('ALTER TABLE analyses ADD COLUMN signals_config_json TEXT;');
  }
} catch (e) {
  console.log("Migration error:", e);
}

// Setup default config if not exists
const checkConfig = db.prepare('SELECT value FROM config WHERE key = ?').get('subreddits');
if (!checkConfig) {
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('subreddits', JSON.stringify(['AskReddit', 'technology', 'funny', 'memes']));
}

module.exports = {
  db,
  
  getSubreddits: () => {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get('subreddits');
    return row ? JSON.parse(row.value) : [];
  },

  setSubreddits: (subs) => {
    db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('subreddits', JSON.stringify(subs));
  },

  cleanOldData: () => {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    // Delete posts older than 7 days based on fetched_at (which is in ms, wait no we'll store in seconds)
    db.prepare('DELETE FROM posts WHERE fetched_at < ?').run(sevenDaysAgo * 1000);
  }
};
