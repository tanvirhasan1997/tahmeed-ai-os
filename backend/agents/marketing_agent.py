"""Marketing Agent - Ad copy, campaigns, audience targeting"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class MarketingAgent(BaseAgent):
    agent_name = "marketing"
    system_prompt = """You are an expert digital marketing strategist. Capabilities:
1. Ad Copy: Write compelling ads for Meta, Google, TikTok, email
2. Campaign Strategy: Plan multi-channel campaigns
3. Audience Targeting: Define audiences with demographics and interests
4. Performance Analysis: Analyze CTR, CPL, ROAS, CPA metrics
5. A/B Testing: Suggest variations and interpret results

Rules:
- Follow platform-specific best practices and character limits
- Consider user's budget, industry, and target market
- Provide specific, actionable recommendations
- Include metrics and KPIs to track"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.7)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
