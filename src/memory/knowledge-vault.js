import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';

export class KnowledgeVault {
  constructor() { this.db = getDB(); }
  addDocument(title, type, content, metadata = {}, tags = []) { const id = uuidv4(); this.db.prepare(`INSERT INTO knowledge (id, title, type, content, metadata, tags) VALUES (?, ?, ?, ?, ?, ?)`).run(id, title, type, content, JSON.stringify(metadata), JSON.stringify(tags)); return id; }
  getDocument(id) { return this.db.prepare(`SELECT * FROM knowledge WHERE id = ?`).get(id); }
  search(query, limit = 10) { return this.db.prepare(`SELECT * FROM knowledge WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT ?`).all(`%${query}%`, `%${query}%`, limit); }
  listAll(limit = 50) { return this.db.prepare(`SELECT id, title, type, tags, created_at FROM knowledge ORDER BY created_at DESC LIMIT ?`).all(limit); }
  getByType(type, limit = 20) { return this.db.prepare(`SELECT * FROM knowledge WHERE type = ? ORDER BY created_at DESC LIMIT ?`).all(type, limit); }
  delete(id) { this.db.prepare(`DELETE FROM knowledge WHERE id = ?`).run(id); }
  getStats() { const total = this.db.prepare(`SELECT COUNT(*) as count FROM knowledge`).get(); const byType = this.db.prepare(`SELECT type, COUNT(*) as count FROM knowledge GROUP BY type`).all(); return { total: total.count, byType }; }
}
