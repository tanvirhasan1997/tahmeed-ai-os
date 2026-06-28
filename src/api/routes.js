import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RouterAI } from '../core/router.js';
import { AgentManager } from '../agents/agent-manager.js';
import { MemorySystem } from '../memory/memory-system.js';
import { KnowledgeVault } from '../memory/knowledge-vault.js';
import { AutomationEngine } from '../automation/engine.js';
import { ToolHub } from '../tools/tool-hub.js';
import { getDB } from '../core/database.js';
import { aiRouter } from './ai-routes.js';

export const apiRouter = Router();
apiRouter.use('/ai', aiRouter);

const routerAI = new RouterAI();
const agentManager = new AgentManager();
const memorySystem = new MemorySystem();
const knowledgeVault = new KnowledgeVault();
const automationEngine = new AutomationEngine();
const toolHub = new ToolHub();

// Command Center
apiRouter.post('/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'কমান্ড প্রদান করুন' });
    const routing = routerAI.routeCommand(command);
    const results = await agentManager.executeMultipleTasks(routing.tasks);
    memorySystem.storeConversation(command, results);
    getDB().prepare(`UPDATE commands SET status = 'completed', result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(JSON.stringify(results), routing.commandId);
    res.json({ success: true, commandId: routing.commandId, routing: routing.parsed, results: results.map(r => ({ agent: r.task.assigned_agent, status: r.status, result: r.result, error: r.error })), message: `✅ কমান্ড সম্পন্ন! ${results.filter(r => r.status === 'fulfilled').length}/${results.length} এজেন্ট সফল।` });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

apiRouter.get('/commands/history', (req, res) => res.json(routerAI.getHistory(parseInt(req.query.limit) || 20)));
apiRouter.get('/agents', (req, res) => res.json(agentManager.getAllAgentsInfo()));
apiRouter.get('/agents/stats', (req, res) => res.json(agentManager.getStats()));

apiRouter.get('/tasks', (req, res) => { const db = getDB(); const s = req.query.status; res.json(s ? db.prepare(`SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC LIMIT 50`).all(s) : db.prepare(`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50`).all()); });
apiRouter.get('/tasks/summary', (req, res) => { const db = getDB(); res.json({ total: db.prepare(`SELECT COUNT(*) as count FROM tasks`).get().count, pending: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'`).get().count, inProgress: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'`).get().count, completed: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`).get().count, failed: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'failed'`).get().count }); });

apiRouter.get('/memory', (req, res) => res.json(req.query.type ? memorySystem.recall(req.query.type) : memorySystem.getAll()));
apiRouter.post('/memory', (req, res) => { const { type, content, context, tags, importance } = req.body; if (!type || !content) return res.status(400).json({ error: 'type ও content আবশ্যক' }); res.json({ id: memorySystem.store(type, content, context, tags, importance) }); });
apiRouter.get('/memory/search', (req, res) => res.json(memorySystem.search(req.query.q || '')));
apiRouter.get('/memory/stats', (req, res) => res.json(memorySystem.getStats()));
apiRouter.delete('/memory/:id', (req, res) => { memorySystem.delete(req.params.id); res.json({ success: true }); });

apiRouter.get('/knowledge', (req, res) => res.json(req.query.type ? knowledgeVault.getByType(req.query.type) : knowledgeVault.listAll()));
apiRouter.post('/knowledge', (req, res) => { const { title, type, content, metadata, tags } = req.body; if (!title || !type) return res.status(400).json({ error: 'title ও type আবশ্যক' }); res.json({ id: knowledgeVault.addDocument(title, type, content, metadata, tags) }); });
apiRouter.get('/knowledge/search', (req, res) => res.json(knowledgeVault.search(req.query.q || '')));
apiRouter.delete('/knowledge/:id', (req, res) => { knowledgeVault.delete(req.params.id); res.json({ success: true }); });

apiRouter.get('/automations', (req, res) => res.json(automationEngine.getAll()));
apiRouter.put('/automations/:id/toggle', (req, res) => { const r = automationEngine.toggle(req.params.id); res.json(r || { error: 'Not found' }); });
apiRouter.get('/automations/status', (req, res) => res.json(automationEngine.getStatus()));

apiRouter.get('/tools', (req, res) => res.json(req.query.category ? toolHub.getByCategory(req.query.category) : toolHub.getAvailableTools()));
apiRouter.post('/tools/connect', (req, res) => { const r = toolHub.connectTool(req.body.toolId, req.body.config); res.json(r || { error: 'Not found' }); });
apiRouter.get('/tools/connections', (req, res) => res.json(toolHub.getConnections()));

apiRouter.get('/dashboard', (req, res) => { const db = getDB(); res.json({ system: { name: 'Tahmeed AI OS', version: '1.0.0', status: 'online', uptime: process.uptime() }, agents: agentManager.getAllAgentsInfo(), tasks: { total: db.prepare(`SELECT COUNT(*) as count FROM tasks`).get().count, pending: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'`).get().count, completed: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`).get().count, inProgress: db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'`).get().count }, memory: memorySystem.getStats(), knowledge: knowledgeVault.getStats(), automation: automationEngine.getStatus(), tools: toolHub.getStats(), recentCommands: routerAI.getHistory(5) }); });
