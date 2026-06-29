"""Accounting Agent"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class AccountingAgent(BaseAgent):
    agent_name = "accounting"
    system_prompt = "You are an expert accounting specialist."
    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}])
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"]}
