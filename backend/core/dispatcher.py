"""Dispatcher - Routes tasks to agents"""
from datetime import datetime
from typing import Any, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Workspace, Task

class Dispatcher:
    async def dispatch(self, routing_result, workspace, user, session_id, db):
        agents = routing_result["agents"]
        if agents:
            return await self._execute(agents[0], workspace, user, session_id, db)
        return {"content": "No agent matched.", "content_type": "text"}

    async def _execute(self, assignment, workspace, user, session_id, db):
        from agents.coding_agent import CodingAgent
        from agents.content_agent import ContentAgent
        agent_map = {"coding": CodingAgent, "content": ContentAgent}
        agent_class = agent_map.get(assignment["agent_name"])
        if not agent_class:
            from agents.content_agent import ContentAgent
            agent_class = ContentAgent
        agent = agent_class(workspace=workspace, user=user, db=db)
        result = await agent.execute(assignment["task_description"])
        return {"content": result.get("content", "Done"), "content_type": "text", "agent_name": assignment["agent_name"]}
