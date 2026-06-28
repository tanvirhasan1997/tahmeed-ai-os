import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database.js';

const INTENT_PATTERNS = {
  coding: {
    keywords: ['code', 'কোড', 'develop', 'ডেভেলপ', 'build', 'বানাও', 'feature', 'ফিচার', 'bug', 'বাগ',
               'fix', 'ফিক্স', 'api', 'database', 'ডাটাবেস', 'frontend', 'backend', 'deploy', 'ডিপ্লয়',
               'module', 'মডিউল', 'upgrade', 'আপগ্রেড', 'implement', 'program', 'প্রোগ্রাম', 'software',
               'app', 'অ্যাপ', 'website', 'ওয়েবসাইট', 'function', 'ফাংশন'],
    agent: 'coding', priority: 'high'
  },
  research: {
    keywords: ['research', 'গবেষণা', 'find', 'খুঁজো', 'analyze', 'বিশ্লেষণ', 'compare', 'তুলনা',
               'study', 'investigate', 'অনুসন্ধান', 'trend', 'ট্রেন্ড', 'market', 'মার্কেট',
               'competitor', 'প্রতিযোগী', 'data', 'ডাটা', 'information', 'তথ্য'],
    agent: 'research', priority: 'medium'
  },
  accounting: {
    keywords: ['account', 'হিসাব', 'finance', 'অর্থ', 'invoice', 'ইনভয়েস', 'payment', 'পেমেন্ট',
               'expense', 'খরচ', 'revenue', 'আয়', 'budget', 'বাজেট', 'tax', 'ট্যাক্স', 'profit',
               'লাভ', 'balance', 'ব্যালেন্স', 'salary', 'বেতন', 'bill', 'বিল'],
    agent: 'accounting', priority: 'medium'
  },
  marketing: {
    keywords: ['marketing', 'মার্কেটিং', 'campaign', 'ক্যাম্পেইন', 'social media', 'সোশ্যাল মিডিয়া',
               'brand', 'ব্র্যান্ড', 'advertisement', 'বিজ্ঞাপন', 'seo', 'promotion', 'প্রমোশন',
               'audience', 'অডিয়েন্স', 'growth', 'গ্রোথ', 'ads', 'অ্যাডস'],
    agent: 'marketing', priority: 'medium'
  },
  security: {
    keywords: ['security', 'সিকিউরিটি', 'audit', 'অডিট', 'vulnerability', 'দুর্বলতা', 'hack', 'হ্যাক',
               'protect', 'সুরক্ষা', 'encrypt', 'এনক্রিপ্ট', 'firewall', 'ssl', 'auth',
               'password', 'পাসওয়ার্ড', 'backup', 'ব্যাকআপ', 'threat', 'হুমকি'],
    agent: 'security', priority: 'high'
  },
  content: {
    keywords: ['write', 'লেখো', 'article', 'আর্টিকেল', 'blog', 'ব্লগ', 'copy', 'কপি', 'draft',
               'ড্রাফট', 'email', 'ইমেইল', 'document', 'ডকুমেন্ট', 'report', 'রিপোর্ট',
               'proposal', 'প্রস্তাব', 'description', 'বিবরণ', 'text', 'টেক্সট'],
    agent: 'content', priority: 'low'
  },
  data_analysis: {
    keywords: ['data analysis', 'ডাটা অ্যানালাইসিস', 'ডাটা বিশ্লেষণ', 'chart', 'চার্ট', 'graph', 'গ্রাফ',
               'statistics', 'পরিসংখ্যান', 'visualization', 'ভিজুয়ালাইজেশন', 'pattern', 'প্যাটার্ন',
               'metric', 'মেট্রিক', 'analytics', 'অ্যানালিটিক্স', 'kpi', 'performance', 'পারফরম্যান্স'],
    agent: 'data_analysis', priority: 'medium'
  }
};

export class RouterAI {
  constructor() { this.db = getDB(); }

  parseCommand(commandText) {
    const normalizedText = commandText.toLowerCase();
    const matchedAgents = [];
    const intents = [];

    for (const [intentName, config] of Object.entries(INTENT_PATTERNS)) {
      const matchedKeywords = config.keywords.filter(k => normalizedText.includes(k.toLowerCase()));
      if (matchedKeywords.length > 0) {
        matchedAgents.push({ agent: config.agent, confidence: Math.min(matchedKeywords.length / 3, 1.0), matchedKeywords, priority: config.priority });
        intents.push(intentName);
      }
    }

    matchedAgents.sort((a, b) => b.confidence - a.confidence);
    if (matchedAgents.length === 0) {
      matchedAgents.push({ agent: 'research', confidence: 0.3, matchedKeywords: [], priority: 'low' });
      intents.push('general');
    }

    return { originalCommand: commandText, intents, assignedAgents: matchedAgents, primaryAgent: matchedAgents[0].agent, timestamp: new Date().toISOString() };
  }

  routeCommand(commandText) {
    const parsed = this.parseCommand(commandText);
    const commandId = uuidv4();

    this.db.prepare(`INSERT INTO commands (id, command, parsed_intent, assigned_agents, status) VALUES (?, ?, ?, ?, 'processing')`)
      .run(commandId, commandText, JSON.stringify(parsed.intents), JSON.stringify(parsed.assignedAgents.map(a => a.agent)));

    const tasks = [];
    for (const agentInfo of parsed.assignedAgents) {
      const taskId = uuidv4();
      const task = { id: taskId, title: `[${agentInfo.agent.toUpperCase()}] ${commandText.substring(0, 100)}`, description: commandText, assigned_agent: agentInfo.agent, status: 'pending', priority: agentInfo.priority, parent_task_id: commandId };
      this.db.prepare(`INSERT INTO tasks (id, title, description, assigned_agent, status, priority, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(task.id, task.title, task.description, task.assigned_agent, task.status, task.priority, task.parent_task_id);
      tasks.push(task);
    }

    return { commandId, parsed, tasks, message: `কমান্ড বিশ্লেষণ সম্পন্ন। ${parsed.assignedAgents.length}টি এজেন্ট কাজে নিয়োজিত।` };
  }

  getHistory(limit = 20) {
    return this.db.prepare(`SELECT * FROM commands ORDER BY created_at DESC LIMIT ?`).all(limit);
  }
}
