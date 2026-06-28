import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';

export class MemorySystem {
  constructor() { this.db = getDB(); }
  store(type, content, context = '', tags = [], importance = 5) { const id = uuidv4(); this.db.prepare(`INSERT INTO memory (id, type, content, context, tags, importance) VALUES (?, ?, ?, ?, ?, ?)`).run(id, type, content, context, JSON.stringify(tags), importance); return id; }
  recall(type, limit = 20) { return this.db.prepare(`SELECT * FROM memory WHERE type = ? ORDER BY importance DESC, created_at DESC LIMIT ?`).all(type, limit); }
  search(query, limit = 10) { return this.db.prepare(`SELECT * FROM memory WHERE content LIKE ? OR context LIKE ? ORDER BY importance DESC LIMIT ?`).all(`%${query}%`, `%${query}%`, limit); }
  getAll(limit = 50) { return this.db.prepare(`SELECT * FROM memory ORDER BY created_at DESC LIMIT ?`).all(limit); }
  delete(id) { this.db.prepare(`DELETE FROM memory WHERE id = ?`).run(id); }
  storeConversation(command, response) { return this.store('conversation', command, JSON.stringify(response), ['conversation'], 5); }
  getStats() { const total = this.db.prepare(`SELECT COUNT(*) as count FROM memory`).get(); const byType = this.db.prepare(`SELECT type, COUNT(*) as count FROM memory GROUP BY type`).all(); return { total: total.count, byType }; }
}
