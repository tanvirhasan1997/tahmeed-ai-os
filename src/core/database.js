/**
 * JSON File Database - works on ANY hosting without native compilation
 * Replaces better-sqlite3 for shared hosting compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// In-memory database with file persistence
let database = {};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      database = JSON.parse(raw);
    }
  } catch (e) {
    database = {};
  }
}

function saveDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

// Ensure table exists
function ensureTable(name) {
  if (!database[name]) {
    database[name] = [];
  }
}

/**
 * Simple SQL-like query engine for JSON database
 */
class PreparedStatement {
  constructor(sql) {
    this.sql = sql.trim();
  }

  run(...params) {
    const sql = this.sql;

    // INSERT
    if (sql.toUpperCase().startsWith('INSERT')) {
      const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      if (!tableMatch) return;
      const table = tableMatch[1];
      ensureTable(table);

      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      if (!colsMatch) return;
      const cols = colsMatch[1].split(',').map(c => c.trim());

      const row = { _created_at: new Date().toISOString() };
      cols.forEach((col, i) => {
        row[col] = params[i] !== undefined ? params[i] : null;
      });
      database[table].push(row);
      saveDB();
      return;
    }

    // UPDATE
    if (sql.toUpperCase().startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)\s+SET/i);
      if (!tableMatch) return;
      const table = tableMatch[1];
      ensureTable(table);

      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      const whereMatch = sql.match(/WHERE\s+(.+)/i);

      if (setMatch && whereMatch) {
        const setClauses = setMatch[1].split(',').map(s => s.trim());
        const whereClause = whereMatch[1].trim();

        // Parse WHERE - support "field = ?"
        const whereField = whereClause.split('=')[0].trim();
        const whereParamIndex = setClauses.filter(s => s.includes('?')).length;
        const whereValue = params[whereParamIndex] !== undefined ? params[whereParamIndex] : params[params.length - 1];

        let paramIdx = 0;
        database[table].forEach(row => {
          if (String(row[whereField]) === String(whereValue)) {
            let pIdx = 0;
            setClauses.forEach(clause => {
              const [field, val] = clause.split('=').map(s => s.trim());
              if (val === '?' || val === ' ?') {
                row[field] = params[pIdx];
                pIdx++;
              } else if (val === 'CURRENT_TIMESTAMP') {
                row[field] = new Date().toISOString();
              } else {
                row[field] = val.replace(/'/g, '');
              }
            });
          }
        });
        saveDB();
      } else if (setMatch && !whereMatch) {
        // UPDATE without WHERE - update all
        const setClauses = setMatch[1] || sql.match(/SET\s+(.+)/i)?.[1];
        if (setClauses) {
          const clauses = setClauses.split(',').map(s => s.trim());
          let pIdx = 0;
          database[table].forEach(row => {
            clauses.forEach(clause => {
              const [field, val] = clause.split('=').map(s => s.trim());
              if (val === '?') {
                row[field] = params[pIdx];
              } else {
                row[field] = val.replace(/'/g, '');
              }
            });
          });
          pIdx++;
          saveDB();
        }
      }
      return;
    }

    // DELETE
    if (sql.toUpperCase().startsWith('DELETE')) {
      const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
      if (!tableMatch) return;
      const table = tableMatch[1];
      ensureTable(table);

      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (whereMatch) {
        const field = whereMatch[1];
        const value = params[0];
        database[table] = database[table].filter(row => String(row[field]) !== String(value));
        saveDB();
      }
      return;
    }
  }

  get(...params) {
    const rows = this._query(params);
    return rows[0] || null;
  }

  all(...params) {
    return this._query(params);
  }

  _query(params) {
    const sql = this.sql;

    // SELECT COUNT(*)
    if (sql.toUpperCase().includes('COUNT(*)')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (!tableMatch) return [{ count: 0 }];
      const table = tableMatch[1];
      ensureTable(table);

      let rows = [...database[table]];
      rows = this._applyWhere(rows, sql, params);
      
      // GROUP BY
      const groupMatch = sql.match(/GROUP\s+BY\s+(\w+)/i);
      if (groupMatch) {
        const groupField = groupMatch[1];
        const groups = {};
        rows.forEach(row => {
          const key = row[groupField] || 'unknown';
          groups[key] = (groups[key] || 0) + 1;
        });
        return Object.entries(groups).map(([key, count]) => ({ [groupField]: key, count }));
      }

      return [{ count: rows.length }];
    }

    // SELECT with GROUP BY
    if (sql.toUpperCase().includes('GROUP BY')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (!tableMatch) return [];
      const table = tableMatch[1];
      ensureTable(table);

      const groupMatch = sql.match(/GROUP\s+BY\s+(\w+)/i);
      const groupField = groupMatch[1];
      let rows = [...database[table]];
      rows = this._applyWhere(rows, sql, params);

      const groups = {};
      rows.forEach(row => {
        const key = row[groupField] || 'unknown';
        groups[key] = (groups[key] || 0) + 1;
      });
      return Object.entries(groups).map(([key, count]) => ({ [groupField]: key, count }));
    }

    // Regular SELECT
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];
    const table = tableMatch[1];
    ensureTable(table);

    let rows = [...database[table]];

    // Apply WHERE
    rows = this._applyWhere(rows, sql, params);

    // ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      rows.sort((a, b) => {
        const va = a[field] || a['_created_at'] || '';
        const vb = b[field] || b['_created_at'] || '';
        return dir === 'DESC' ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
      });
    }

    // LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\?|\d+)/i);
    if (limitMatch) {
      const limitVal = limitMatch[1] === '?' ? params[params.length - 1] : parseInt(limitMatch[1]);
      rows = rows.slice(0, limitVal);
    }

    // Select specific columns
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch && selectMatch[1] !== '*') {
      const cols = selectMatch[1].split(',').map(c => c.trim().split(' AS ').pop().split('.').pop().trim());
      if (!cols.includes('*')) {
        rows = rows.map(row => {
          const newRow = {};
          cols.forEach(col => { newRow[col] = row[col] !== undefined ? row[col] : null; });
          // Always include created_at as fallback
          if (!newRow.created_at && row._created_at) newRow.created_at = row._created_at;
          return newRow;
        });
      }
    }

    // Map _created_at to created_at
    rows = rows.map(row => {
      if (row._created_at && !row.created_at) row.created_at = row._created_at;
      return row;
    });

    return rows;
  }

  _applyWhere(rows, sql, params) {
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (!whereMatch) return rows;

    const whereClause = whereMatch[1].trim();
    let paramIdx = 0;

    // Handle multiple conditions with AND
    const conditions = whereClause.split(/\s+AND\s+/i);

    rows = rows.filter(row => {
      return conditions.every(condition => {
        // field = ?
        const eqMatch = condition.match(/(\w+)\s*=\s*\?/);
        if (eqMatch) {
          const field = eqMatch[1];
          const value = params[paramIdx++];
          return String(row[field]) === String(value);
        }

        // field LIKE ?
        const likeMatch = condition.match(/(\w+)\s+LIKE\s+\?/i);
        if (likeMatch) {
          const field = likeMatch[1];
          const pattern = String(params[paramIdx++]).replace(/%/g, '');
          return row[field] && String(row[field]).toLowerCase().includes(pattern.toLowerCase());
        }

        // field = 'value'
        const staticMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/);
        if (staticMatch) {
          return String(row[staticMatch[1]]) === staticMatch[2];
        }

        // field = number
        const numMatch = condition.match(/(\w+)\s*=\s*(\d+)/);
        if (numMatch) {
          return String(row[numMatch[1]]) === numMatch[2];
        }

        return true;
      });
    });

    return rows;
  }
}

/**
 * Database instance with SQLite-like API
 */
class JsonDatabase {
  constructor() {
    loadDB();
  }

  prepare(sql) {
    return new PreparedStatement(sql);
  }

  exec(sql) {
    // CREATE TABLE - just ensure the table exists
    const tableMatch = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
    if (tableMatch) {
      ensureTable(tableMatch[1]);
      saveDB();
    }
  }

  pragma() {} // No-op for compatibility
}

let db;

export function getDB() {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new JsonDatabase();
  }
  return db;
}

export function initDatabase() {
  const database = getDB();

  database.exec(`CREATE TABLE IF NOT EXISTS memory`);
  database.exec(`CREATE TABLE IF NOT EXISTS knowledge`);
  database.exec(`CREATE TABLE IF NOT EXISTS tasks`);
  database.exec(`CREATE TABLE IF NOT EXISTS agent_logs`);
  database.exec(`CREATE TABLE IF NOT EXISTS commands`);
  database.exec(`CREATE TABLE IF NOT EXISTS automations`);
  database.exec(`CREATE TABLE IF NOT EXISTS tool_connections`);
  database.exec(`CREATE TABLE IF NOT EXISTS ai_config`);
  database.exec(`CREATE TABLE IF NOT EXISTS ai_chat_history`);

  console.log('  ✅ Database initialized successfully');
  return database;
}
