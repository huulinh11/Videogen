import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'videogen.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_value TEXT NOT NULL UNIQUE,
      label TEXT DEFAULT '',
      quota INTEGER DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      prompt TEXT DEFAULT '',
      mode TEXT DEFAULT 'text-to-video',
      status TEXT DEFAULT 'queued',
      result_url TEXT,
      error TEXT,
      payload TEXT,
      api_key_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin user from env vars
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(adminUser);
  if (!existing) {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(adminPass).digest('hex');
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(adminUser, hash);
    console.log(`[DB] Admin user created: ${adminUser}`);
  }
}

export default db;
