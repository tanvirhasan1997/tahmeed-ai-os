import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'tahmeed_ai.db');

let db;

export function getDB() {
  if (!db) {
    // Auto-create data directory if missing
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const database = getDB();

  database.exec(`
    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, content TEXT NOT NULL, context TEXT,
      tags TEXT, importance INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, content TEXT,
      file_path TEXT, metadata TEXT, tags TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, assigned_agent TEXT,
      status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium', parent_task_id TEXT,
      result TEXT, started_at DATETIME, completed_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS agent_logs (
      id TEXT PRIMARY KEY, agent_name TEXT NOT NULL, action TEXT NOT NULL, input TEXT,
      output TEXT, status TEXT DEFAULT 'success', duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY, command TEXT NOT NULL, parsed_intent TEXT, assigned_agents TEXT,
      status TEXT DEFAULT 'processing', result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, trigger_type TEXT NOT NULL, trigger_config TEXT,
      action_type TEXT NOT NULL, action_config TEXT, is_active INTEGER DEFAULT 1,
      last_run DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tool_connections (
      id TEXT PRIMARY KEY, tool_name TEXT NOT NULL, config TEXT, status TEXT DEFAULT 'connected',
      last_used DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_config (
      id TEXT PRIMARY KEY, provider TEXT NOT NULL, api_key TEXT NOT NULL, model TEXT NOT NULL,
      is_active INTEGER DEFAULT 0, temperature REAL DEFAULT 0.7, max_tokens INTEGER DEFAULT 2000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id TEXT PRIMARY KEY, agent_name TEXT, role TEXT NOT NULL, content TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0, provider TEXT, model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  ✅ Database initialized successfully');
  return database;
}
