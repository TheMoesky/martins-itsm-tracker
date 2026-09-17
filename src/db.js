const Database = require('better-sqlite3');

const dbFile = process.env.NODE_ENV === 'test' ? 'test.db' : 'itsm.db';
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT,
    assignee TEXT,
    sla_due_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;