import { CodingAgent } from './coding-agent.js';
import { ResearchAgent } from './research-agent.js';
import { AccountingAgent } from './accounting-agent.js';
import { MarketingAgent } from './marketing-agent.js';
import { SecurityAgent } from './security-agent.js';
import { ContentAgent } from './content-agent.js';
import { DataAnalysisAgent } from './data-analysis-agent.js';

export class AgentManager {
  constructor() {
    this.agents = { coding: new CodingAgent(), research: new ResearchAgent(), accounting: new AccountingAgent(), marketing: new MarketingAgent(), security: new SecurityAgent(), content: new ContentAgent(), data_analysis: new DataAnalysisAgent() };
  }
  getAgent(name) { return this.agents[name] || null; }
  getAllAgentsInfo() { return Object.values(this.agents).map(a => a.getInfo()); }
  async executeTask(task) { const agent = this.agents[task.assigned_agent]; if (!agent) throw new Error(`Agent "${task.assigned_agent}" not found`); return await agent.execute(task); }
  async executeMultipleTasks(tasks) { const results = await Promise.allSettled(tasks.map(t => this.executeTask(t))); return results.map((r, i) => ({ task: tasks[i], status: r.status, result: r.status === 'fulfilled' ? r.value : null, error: r.status === 'rejected' ? r.reason.message : null })); }
  getStats() { const stats = {}; for (const [name, agent] of Object.entries(this.agents)) { const activity = agent.getRecentActivity(100); stats[name] = { ...agent.getInfo(), totalTasks: activity.length, successRate: activity.length > 0 ? Math.round((activity.filter(a => a.status === 'success').length / activity.length) * 100) : 100 }; } return stats; }
}
