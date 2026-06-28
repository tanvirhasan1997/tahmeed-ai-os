import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './core/database.js';
import { apiRouter } from './api/routes.js';
import { AutomationEngine } from './automation/engine.js';
import { getAIProvider } from './ai/ai-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

initDatabase();

// Init AI from .env
const provider = process.env.AI_PROVIDER;
if (provider) {
  const aiProvider = getAIProvider();
  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) aiProvider.setProvider('openai', process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini');
    else if (provider === 'gemini' && process.env.GEMINI_API_KEY) aiProvider.setProvider('gemini', process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    else if (provider === 'claude' && process.env.CLAUDE_API_KEY) aiProvider.setProvider('claude', process.env.CLAUDE_API_KEY, process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514');
  } catch (e) { console.log('  ⚠️ AI init failed:', e.message); }
}

app.use('/api', apiRouter);
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const automationEngine = new AutomationEngine();
automationEngine.start();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🧠 TAHMEED AI OS v1.0.0 | http://localhost:${PORT}\n  Agents: 7/7 | Memory: Active | AI: ${getAIProvider().isReady() ? '✅' : '⚠️ Not configured'}\n`);
});

export default app;
