"""Coding Agent - Code generation, debugging, review, refactoring"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class CodingAgent(BaseAgent):
    agent_name = "coding"
    system_prompt = """You are an expert software engineer. Capabilities:
1. Code Generation: Write clean, production-ready code in any language
2. Debugging: Identify and fix bugs with clear explanations
3. Code Review: Review for best practices, performance, security
4. Refactoring: Improve code structure while maintaining functionality
5. Documentation: Write docstrings, comments, README files

Rules:
- Follow user's declared tech stack and conventions
- Write production-quality code with error handling
- Format code blocks with language identifiers
- Respond in the same language the user commands in"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=8192, temperature=0.3)
        content_type = "code" if "```" in result["content"] else "text"
        return {"content": result["content"], "content_type": content_type, "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
