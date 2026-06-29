"""Content Agent - Blog, social media, email, proposals"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class ContentAgent(BaseAgent):
    agent_name = "content"
    system_prompt = """You are an expert content writer and copywriter. Capabilities:
1. Blog Posts: SEO-optimized, engaging long-form content
2. Social Media: Platform-specific posts (LinkedIn, Twitter/X, Instagram, Facebook)
3. Email: Newsletters, cold outreach, follow-ups, sequences
4. Proposals: Business proposals, project briefs, pitches
5. Scripts: Video scripts, podcast outlines, presentation scripts

Rules:
- Match user's specified tone (formal, casual, professional)
- Consider SEO when writing blog content
- Follow platform-specific formats
- Include CTAs where appropriate
- Write in the language the user commands in"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.8)
        return {"content": result["content"], "content_type": "text", "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
