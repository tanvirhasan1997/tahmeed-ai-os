import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';

export class AutomationEngine {
  constructor() { this.db = getDB(); this.scheduledJobs = new Map(); this.isRunning = false; }

  start() {
    this.isRunning = true;
    const existing = this.db.prepare(`SELECT COUNT(*) as count FROM automations`).get();
    if (existing.count === 0) {
      this.addAutomation({ name: 'দৈনিক সামারি রিপোর্ট', triggerType: 'cron', triggerConfig: '0 9 * * *', actionType: 'generate_report', actionConfig: { type: 'daily' } });
      this.addAutomation({ name: 'টাস্ক ফলো-আপ চেক', triggerType: 'cron', triggerConfig: '0 */4 * * *', actionType: 'task_followup', actionConfig: {} });
      this.addAutomation({ name: 'সিস্টেম হেলথ চেক', triggerType: 'cron', triggerConfig: '0 * * * *', actionType: 'health_check', actionConfig: {} });
      this.addAutomation({ name: 'সাপ্তাহিক অ্যানালিটিক্স', triggerType: 'cron', triggerConfig: '0 8 * * 1', actionType: 'generate_report', actionConfig: { type: 'weekly' } });
    }
    console.log('  🤖 Automation Engine started');
  }

  addAutomation(config) {
    const id = uuidv4();
    this.db.prepare(`INSERT INTO automations (id, name, trigger_type, trigger_config, action_type, action_config) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, config.name, config.triggerType, config.triggerConfig, config.actionType, JSON.stringify(config.actionConfig));
    if (config.triggerType === 'cron' && cron.validate(config.triggerConfig)) {
      const job = cron.schedule(config.triggerConfig, () => {});
      this.scheduledJobs.set(id, job);
    }
    return id;
  }

  getAll() { return this.db.prepare(`SELECT * FROM automations ORDER BY created_at DESC`).all(); }
  toggle(id) { const a = this.db.prepare(`SELECT * FROM automations WHERE id = ?`).get(id); if (a) { const s = a.is_active ? 0 : 1; this.db.prepare(`UPDATE automations SET is_active = ? WHERE id = ?`).run(s, id); return { id, isActive: s === 1 }; } return null; }
  getStatus() { return { isRunning: this.isRunning, activeJobs: this.scheduledJobs.size, totalAutomations: this.db.prepare(`SELECT COUNT(*) as count FROM automations`).get().count }; }
}
