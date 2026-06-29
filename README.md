# Tahmeed AI OS

> **One Command. Your Entire AI Team.**

Multi-Agent AI Operating System — যেকোনো মানুষ, যেকোনো industry-তে, যেকোনো ধরনের কাজ একটি command দিয়ে করতে পারবে।

## Architecture

```
Client (Next.js PWA) → API Gateway (FastAPI) → Router AI → Agent Layer (9 Agents)
                                                              ↕
                                              Memory System + Knowledge Vault + Tool Hub
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | FastAPI, Python 3.11, LangGraph, Celery |
| LLM | Claude Sonnet 4 (primary), GPT-4o (fallback) |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis 7.2 |
| Storage | Supabase Storage |
| Deploy | Vercel (FE) + Railway (BE) |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 20+

### Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/tanvirhasan1997/tahmeed-ai-os.git
cd tahmeed-ai-os

# 2. Copy environment file
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec backend alembic upgrade head

# 5. Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Agents

| # | Agent | Function |
|---|-------|----------|
| 1 | Coding | Code generation, debug, review, refactor |
| 2 | Research | Web research, competitor analysis, fact-check |
| 3 | Marketing | Ad copy, campaign strategy, performance |
| 4 | Content | Blog, social post, email, proposal |
| 5 | Accounting | Financial calculation, invoice, expense |
| 6 | Security | Code security review, vulnerability check |
| 7 | Data | CSV/Excel analysis, visualization, insights |
| 8 | Support | Support ticket, FAQ, complaint handling |
| 9 | HR | Job description, interview questions, SOP |

## License

Private — All rights reserved.
