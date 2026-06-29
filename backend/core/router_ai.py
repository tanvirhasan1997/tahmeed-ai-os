"""Router AI - Intent classification and agent routing"""
from typing import List, Dict
from anthropic import AsyncAnthropic
from config import settings

AGENT_REGISTRY = {"coding": ["code","bug","debug","api","function","react","python","php","deploy","git"],
    "research": ["research","find","compare","competitor","market","trend"],
    "marketing": ["ad","campaign","marketing","audience","cpl","roas","meta ads"],
    "content": ["write","blog","post","email","caption","content","article"],
    "accounting": ["invoice","expense","revenue","profit","tax","vat","budget"],
    "security": ["security","vulnerability","owasp","xss","injection","audit"],
    "data": ["csv","excel","chart","analytics","metric","visualization"],
    "support": ["support","ticket","customer","complaint","faq"],
    "hr": ["job description","interview","hire","onboarding","sop","hr"]}

class RouterAI:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def route(self, command: str, workspace=None, user=None) -> Dict:
        command_lower = command.lower()
        matched = []
        for agent, keywords in AGENT_REGISTRY.items():
            if any(kw in command_lower for kw in keywords):
                matched.append({"agent_name": agent, "task_description": command})
        if not matched:
            matched = [{"agent_name": "content", "task_description": command}]
        return {"intent": "task", "language": "en", "agents": matched}
