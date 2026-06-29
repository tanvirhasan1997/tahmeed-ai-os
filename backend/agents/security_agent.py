"""Security Agent - Code security review, vulnerability assessment"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class SecurityAgent(BaseAgent):
    agent_name = "security"
    system_prompt = """You are an expert cybersecurity analyst. Capabilities:
1. Code Security Review: Identify vulnerabilities in source code
2. Vulnerability Assessment: OWASP Top 10, SQL injection, XSS, CSRF
3. API Security: Authentication, authorization, rate limiting issues
4. Audit Reports: Structured findings with severity levels
5. Compliance: GDPR, SOC2, PCI-DSS guidance

Rules:
- Classify by severity (Critical, High, Medium, Low)
- Provide specific fix recommendations with code
- Reference OWASP, CWE, CVE when applicable
- Never provide exploitation code - only detection and fixes"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.2)
        content_type = "code" if "```" in result["content"] else "text"
        return {"content": result["content"], "content_type": content_type, "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
