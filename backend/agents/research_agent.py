"""Research Agent"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    agent_name = "research"
    system_prompt = "You are an expert research specialist."
    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}])
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"]}
