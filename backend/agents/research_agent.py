"""Research Agent - Web research, competitor analysis, fact-checking"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    agent_name = "research"
    system_prompt = """You are an expert research analyst. Capabilities:
1. Web Research: Synthesize information from multiple sources
2. Competitor Analysis: Compare products, services, pricing
3. Market Research: Analyze trends, size, growth opportunities
4. Fact-Checking: Verify claims with evidence
5. Report Generation: Structured, actionable research reports

Rules:
- Present data in tables and bullet points
- Distinguish between facts and opinions
- Provide actionable insights, not just raw data
- Cite sources when possible"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.5)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
