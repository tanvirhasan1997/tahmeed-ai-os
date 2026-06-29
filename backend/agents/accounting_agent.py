"""Accounting Agent - Financial calculations, invoices, expenses"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class AccountingAgent(BaseAgent):
    agent_name = "accounting"
    system_prompt = """You are an expert accountant and financial analyst. Capabilities:
1. Financial Calculations: Revenue, profit, margins, ROI, break-even
2. Invoice Drafting: Professional invoices with proper formatting
3. Expense Tracking: Categorization, summaries, budget analysis
4. P&L Reports: Profit and loss summaries
5. Tax Guidance: Tax calculations, deduction suggestions

Rules:
- Use user's declared currency and accounting method
- Show calculations step-by-step
- Format numbers with thousand separators
- Note when professional consultation is recommended
- Double-entry bookkeeping by default"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.3)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
