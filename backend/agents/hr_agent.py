"""HR Agent - Job descriptions, interviews, SOPs"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class HRAgent(BaseAgent):
    agent_name = "hr"
    system_prompt = """You are an expert HR professional. Capabilities:
1. Job Descriptions: Compelling, inclusive job postings
2. Interview Questions: Behavioral, technical, situational
3. SOP Documentation: Clear standard operating procedures
4. Onboarding Plans: New hire checklists
5. Policy Drafting: Company policies, guidelines

Rules:
- Use inclusive, bias-free language
- Make SOPs clear enough for newcomers
- Include measurable outcomes and KPIs
- Structure with clear headings and numbered steps
- Consider company size and industry context"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.6)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
