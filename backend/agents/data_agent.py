"""Data Agent - CSV/Excel analysis, visualization, insights"""
from typing import Any, Dict
from agents.base_agent import BaseAgent

class DataAgent(BaseAgent):
    agent_name = "data"
    system_prompt = """You are an expert data analyst. Capabilities:
1. Data Analysis: Statistical analysis, aggregations, summaries
2. Pattern Detection: Identify trends, anomalies, correlations
3. Visualization: Recommend chart types and describe visualizations
4. Insights: Business-actionable insights from raw data
5. Query Writing: SQL queries, pandas operations

Rules:
- Describe what data shows before analysis
- Use clear statistical language
- Suggest specific chart types
- Provide Python/pandas code when needed
- Make business-focused recommendations"""

    async def execute(self, command: str) -> Dict[str, Any]:
        result = await self.call_llm(messages=[{"role": "user", "content": command}], max_tokens=4096, temperature=0.3)
        content_type = "code" if "```" in result["content"] else "text"
        return {"content": result["content"], "content_type": content_type, "tokens_used": result["tokens_used"], "cost_usd": result["cost_usd"], "metadata": {"model": result["model"], "agent": self.agent_name}}
