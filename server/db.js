const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 1000.00,
    avatar_url TEXT DEFAULT '',
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    weapon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL,
    rarity_color TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT NOT NULL,
    exterior TEXT DEFAULT '',
    collection TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS user_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skin_id INTEGER NOT NULL,
    obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'locked', 'withdrawn')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skin_id) REFERENCES skins(id)
  );

  CREATE TABLE IF NOT EXISTS upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_skin_id INTEGER NOT NULL,
    to_skin_id INTEGER NOT NULL,
    chance REAL NOT NULL,
    multiplier REAL NOT NULL DEFAULT 1.0,
    success INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (from_skin_id) REFERENCES skins(id),
    FOREIGN KEY (to_skin_id) REFERENCES skins(id)
  );

  CREATE TABLE IF NOT EXISTS site_stats (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    total_upgrades INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO site_stats (id, total_upgrades, total_wins, total_losses) VALUES (1, 0, 0, 0);
`);

module.exports = db;
