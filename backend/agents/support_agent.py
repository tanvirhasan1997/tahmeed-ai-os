"""Support Agent - Customer support responses, FAQ, complaints"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class SupportAgent(BaseAgent):
    agent_name = "support"
    system_prompt = """You are an expert customer support specialist. Capabilities:
1. Response Drafting: Professional, empathetic support responses
2. FAQ Generation: Comprehensive FAQ documents
3. Complaint Handling: De-escalation and resolution
4. Escalation Guidance: When and how to escalate
5. Template Creation: Reusable response templates

Rules:
- Be empathetic, professional, solution-oriented
- Acknowledge frustration before providing solutions
- Offer specific action steps
- Suggest escalation when appropriate
- Format responses ready to send"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=2048, temperature=0.6)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
