# 🧠 Tahmeed AI OS

> Personal AI Operating System - একাধিক AI Agent একসাথে কাজ করবে। আপনি শুধু নির্দেশ দেবেন, বাকি কাজ AI-রা করবে।

## 🚀 Quick Start

```bash
npm install
npm start
# Open: http://localhost:3000
```

## 🔌 AI API Setup

Dashboard → ⚙️ AI Settings → API Key পেস্ট করুন

| Provider | Link | Cost |
|----------|------|------|
| 🟢 OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $5 free |
| 🔵 Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | **FREE** |
| 🟣 Claude | [console.anthropic.com](https://console.anthropic.com) | $5 free |

Or via `.env`:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-1.5-flash
```

## 🏗️ Architecture

```
Command Center → Router AI → Specialized Agents → Results
                                    ↕
                    Memory System / Knowledge Vault
```

### 🤖 7 AI Agents
- 👨‍💻 **Coding** - Software development, bug fixes, deployment
- 🔍 **Research** - Market analysis, trends, data gathering
- 🧾 **Accounting** - Finance, budget, invoicing, tax
- 📈 **Marketing** - Campaigns, SEO, social media, growth
- 🛡️ **Security** - Audit, vulnerabilities, encryption, backup
- 📝 **Content** - Writing, documentation, reports, copywriting
- 📊 **Data Analysis** - Statistics, KPI, visualization, predictions

### Other Systems
- 🧠 **Memory System** - Remembers conversations, decisions, preferences
- 📚 **Knowledge Vault** - Document storage and search
- ⚡ **Automation Engine** - Scheduled tasks (daily reports, health checks)
- 🔧 **Tool Hub** - GitHub, Drive, Gmail, Slack, Notion, Canva integrations

## 📡 API

```bash
POST /api/command              # Main command interface
GET  /api/dashboard            # Dashboard data
GET  /api/agents               # All agents
POST /api/ai/configure         # Set AI provider
POST /api/ai/test              # Test AI connection
POST /api/ai/chat              # Direct AI chat
```

## 🛠️ Tech Stack

Node.js, Express, SQLite, OpenAI/Gemini/Claude APIs, Vanilla JS

---
**তুমি পরিচালক, Tahmeed AI OS তোমার AI টিম** 🚀
