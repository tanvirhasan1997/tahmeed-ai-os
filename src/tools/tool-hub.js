import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';

export class ToolHub {
  constructor() {
    this.db = getDB();
    this.availableTools = [
      { id: 'github', name: 'GitHub', icon: '🐙', description: 'কোড রিপোজিটরি ও PR ম্যানেজমেন্ট', category: 'development', status: 'available', actions: ['create_repo', 'push_code', 'create_pr'] },
      { id: 'vscode', name: 'VS Code', icon: '💻', description: 'কোড এডিটিং ও ডিবাগিং', category: 'development', status: 'available', actions: ['open_file', 'edit_code'] },
      { id: 'google_drive', name: 'Google Drive', icon: '📁', description: 'ফাইল স্টোরেজ ও শেয়ারিং', category: 'productivity', status: 'available', actions: ['upload_file', 'share_file'] },
      { id: 'gmail', name: 'Gmail', icon: '📧', description: 'ইমেইল পাঠানো ও ম্যানেজমেন্ট', category: 'communication', status: 'available', actions: ['send_email', 'draft_email'] },
      { id: 'slack', name: 'Slack', icon: '💬', description: 'টিম কমিউনিকেশন', category: 'communication', status: 'available', actions: ['send_message', 'create_channel'] },
      { id: 'notion', name: 'Notion', icon: '📓', description: 'নোটস ও প্রজেক্ট ম্যানেজমেন্ট', category: 'productivity', status: 'available', actions: ['create_page', 'update_database'] },
      { id: 'canva', name: 'Canva', icon: '🎨', description: 'গ্রাফিক ডিজাইন', category: 'design', status: 'available', actions: ['create_design', 'export_image'] },
      { id: 'api_connector', name: 'API Connector', icon: '🔌', description: 'REST API ইন্টিগ্রেশন', category: 'integration', status: 'available', actions: ['make_request', 'setup_webhook'] }
    ];
  }
  getAvailableTools() { return this.availableTools; }
  getByCategory(category) { return this.availableTools.filter(t => t.category === category); }
  connectTool(toolId, config = {}) { const id = uuidv4(); this.db.prepare(`INSERT INTO tool_connections (id, tool_name, config, status) VALUES (?, ?, ?, 'connected')`).run(id, toolId, JSON.stringify(config)); return { id, tool: toolId, status: 'connected' }; }
  getConnections() { return this.db.prepare(`SELECT * FROM tool_connections ORDER BY created_at DESC`).all(); }
  getStats() { const c = this.db.prepare(`SELECT COUNT(*) as count FROM tool_connections`).get(); return { totalAvailable: this.availableTools.length, connected: c.count }; }
}
