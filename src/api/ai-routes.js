import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../core/database.js';
import { getAIProvider, resetAIProvider } from '../ai/ai-provider.js';

export const aiRouter = Router();

aiRouter.get('/status', (req, res) => {
  const ai = getAIProvider(); let config = null;
  try { config = getDB().prepare(`SELECT provider, model, is_active, updated_at FROM ai_config WHERE is_active = 1`).get(); } catch(e) {}
  res.json({ configured: ai.isReady(), activeProvider: ai.getActiveProviderName(), config, message: ai.isReady() ? `✅ AI সক্রিয় - ${ai.getActiveProviderName()}` : '⚠️ AI কনফিগার করা হয়নি' });
});

aiRouter.get('/providers', (req, res) => res.json(getAIProvider().getAvailableProviders()));

aiRouter.post('/configure', async (req, res) => {
  const { provider, apiKey, model } = req.body;
  if (!provider || !apiKey || !model) return res.status(400).json({ error: 'provider, apiKey, model আবশ্যক' });
  const db = getDB();
  try {
    db.prepare(`UPDATE ai_config SET is_active = 0`).run();
    db.prepare(`INSERT INTO ai_config (id, provider, api_key, model, is_active) VALUES (?, ?, ?, ?, 1)`).run(uuidv4(), provider, apiKey, model);
    resetAIProvider(); getAIProvider().setProvider(provider, apiKey, model);
    res.json({ success: true, message: `✅ ${provider} কনফিগার সম্পন্ন! Model: ${model}` });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

aiRouter.post('/test', async (req, res) => {
  const ai = getAIProvider();
  if (!ai.isReady()) return res.status(400).json({ success: false, error: 'AI কনফিগার করা হয়নি' });
  const response = await ai.chat('তুমি একটি AI assistant।', 'তুমি কে? এক লাইনে বলো।', { maxTokens: 100 });
  res.json(response.success ? { success: true, message: '✅ AI সংযোগ সফল!', response: response.content, provider: response.provider, model: response.model } : { success: false, error: response.error });
});

aiRouter.post('/chat', async (req, res) => {
  const { message, agent } = req.body;
  if (!message) return res.status(400).json({ error: 'message আবশ্যক' });
  const ai = getAIProvider();
  if (!ai.isReady()) return res.status(400).json({ success: false, error: 'AI কনফিগার করা হয়নি' });
  const { AGENT_PROMPTS } = await import('../ai/agent-prompts.js');
  const systemPrompt = agent && AGENT_PROMPTS[agent] ? AGENT_PROMPTS[agent] : 'তুমি Tahmeed AI OS-এর সহকারী।';
  const response = await ai.chat(systemPrompt, message);
  if (response.success) { const db = getDB(); db.prepare(`INSERT INTO ai_chat_history (id, agent_name, role, content, provider, model) VALUES (?, ?, 'assistant', ?, ?, ?)`).run(uuidv4(), agent || 'general', response.content, response.provider, response.model); }
  res.json(response.success ? { success: true, response: response.content, provider: response.provider, model: response.model } : { success: false, error: response.error });
});

aiRouter.delete('/configure', (req, res) => { getDB().prepare(`UPDATE ai_config SET is_active = 0`).run(); resetAIProvider(); res.json({ success: true, message: 'AI নিষ্ক্রিয় করা হয়েছে' }); });
aiRouter.get('/usage', (req, res) => { try { const db = getDB(); res.json({ totalMessages: db.prepare(`SELECT COUNT(*) as count FROM ai_chat_history`).get().count, byAgent: db.prepare(`SELECT agent_name, COUNT(*) as count FROM ai_chat_history GROUP BY agent_name`).all() }); } catch(e) { res.json({ totalMessages: 0, byAgent: [] }); } });
