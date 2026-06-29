"""Response Aggregator - Combines multi-agent outputs"""
from typing import Any, Dict, List
class ResponseAggregator:
    async def aggregate(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not results: return {"content": "No results.", "content_type": "text"}
        if len(results) == 1: return results[0]
        combined = "\n\n---\n\n".join(r.get("content", "") for r in results)
        return {"content": combined, "content_type": "text", "agent_name": ", ".join(r.get("agent_name", "") for r in results)}
