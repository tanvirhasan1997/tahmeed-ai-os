"""Base Agent - Abstract class for all AI agents"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database.models import User, Workspace

class BaseAgent(ABC):
    agent_name: str = "base"
    system_prompt: str = "You are a helpful AI assistant."

    def __init__(self, workspace: Workspace, user: User, db: AsyncSession):
        self.workspace = workspace
        self.user = user
        self.db = db
        self._anthropic = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.config = (workspace.agent_config or {}).get(self.agent_name, {})

    @abstractmethod
    async def execute(self, command: str) -> Dict[str, Any]:
        pass

    async def call_llm(self, messages: List[Dict], system: Optional[str] = None, max_tokens: int = 4096, temperature: float = 0.7) -> Dict:
        sys_prompt = system or self.system_prompt
        try:
            response = await self._anthropic.messages.create(model=settings.ANTHROPIC_MODEL, max_tokens=max_tokens, temperature=temperature, system=sys_prompt, messages=messages)
            tokens = response.usage.input_tokens + response.usage.output_tokens
            cost = (response.usage.input_tokens * 0.003 + response.usage.output_tokens * 0.015) / 1000
            return {"content": response.content[0].text, "tokens_used": tokens, "cost_usd": cost, "model": settings.ANTHROPIC_MODEL}
        except Exception:
            response = await self._openai.chat.completions.create(model=settings.OPENAI_MODEL, messages=[{"role": "system", "content": sys_prompt}] + messages, max_tokens=max_tokens, temperature=temperature)
            return {"content": response.choices[0].message.content, "tokens_used": response.usage.total_tokens, "cost_usd": (response.usage.prompt_tokens * 0.005 + response.usage.completion_tokens * 0.015) / 1000, "model": settings.OPENAI_MODEL}
