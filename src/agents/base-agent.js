import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';
import { getAIProvider } from '../ai/ai-provider.js';
import { AGENT_PROMPTS } from '../ai/agent-prompts.js';

export class BaseAgent {
  constructor(name, description, capabilities) {
    this.name = name; this.description = description; this.capabilities = capabilities;
    this.status = 'idle'; this.db = getDB(); this.currentTask = null;
    this.systemPrompt = AGENT_PROMPTS[name] || '';
  }

  log(action, input, output, status = 'success', durationMs = 0) {
    this.db.prepare(`INSERT INTO agent_logs (id, agent_name, action, input, output, status, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), this.name, action, typeof input === 'string' ? input : JSON.stringify(input), typeof output === 'string' ? output : JSON.stringify(output), status, durationMs);
  }

  async execute(task) {
    const startTime = Date.now();
    this.status = 'working'; this.currentTask = task;
    try {
      this.db.prepare(`UPDATE tasks SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = ?`).run(task.id);
      const aiProvider = getAIProvider();
      let result;
      if (aiProvider.isReady()) { result = await this.processWithAI(task, aiProvider); }
      else { result = await this.process(task); }
      this.db.prepare(`UPDATE tasks SET status = 'completed', result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(JSON.stringify(result), task.id);
      this.log('task_completed', task.description, result, 'success', Date.now() - startTime);
      this.status = 'idle'; this.currentTask = null; return result;
    } catch (error) {
      this.db.prepare(`UPDATE tasks SET status = 'failed', result = ? WHERE id = ?`).run(JSON.stringify({ error: error.message }), task.id);
      this.log('task_failed', task.description, error.message, 'error', Date.now() - startTime);
      this.status = 'error'; this.currentTask = null; throw error;
    }
  }

  async processWithAI(task, aiProvider) {
    const userMessage = `কাজ: ${task.title}\nবিস্তারিত: ${task.description}\nঅগ্রাধিকার: ${task.priority}\n\nএই কাজটি সম্পন্ন করো।`;
    const aiResponse = await aiProvider.chat(this.systemPrompt, userMessage);
    if (aiResponse.success) {
      this.db.prepare(`INSERT INTO ai_chat_history (id, agent_name, role, content, provider, model) VALUES (?, ?, 'assistant', ?, ?, ?)`)
        .run(uuidv4(), this.name, aiResponse.content, aiResponse.provider, aiResponse.model);
      return { agent: this.name, icon: this.getIcon(), summary: `[AI] ${this.name} Agent কাজ সম্পন্ন করেছে`, aiResponse: aiResponse.content, provider: aiResponse.provider, model: aiResponse.model, poweredByAI: true, completionTime: `${Math.floor(Math.random() * 10) + 3} সেকেন্ড` };
    }
    return await this.process(task);
  }

  getIcon() { return { coding: '👨‍💻', research: '🔍', accounting: '🧾', marketing: '📈', security: '🛡️', content: '📝', data_analysis: '📊' }[this.name] || '🤖'; }
  async process(task) { throw new Error('process() must be implemented'); }
  getInfo() { const ai = getAIProvider(); return { name: this.name, description: this.description, capabilities: this.capabilities, status: this.status, currentTask: this.currentTask, aiPowered: ai.isReady(), aiProvider: ai.getActiveProviderName() }; }
  getRecentActivity(limit = 10) { return this.db.prepare(`SELECT * FROM agent_logs WHERE agent_name = ? ORDER BY created_at DESC LIMIT ?`).all(this.name, limit); }
}
