"""Dispatcher - Full agent dispatch with task tracking"""
from datetime import datetime
from typing import Any, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Workspace, Task

class Dispatcher:
    AGENT_MAP = {
        "coding": "agents.coding_agent.CodingAgent",
        "research": "agents.research_agent.ResearchAgent",
        "marketing": "agents.marketing_agent.MarketingAgent",
        "content": "agents.content_agent.ContentAgent",
        "accounting": "agents.accounting_agent.AccountingAgent",
        "security": "agents.security_agent.SecurityAgent",
        "data": "agents.data_agent.DataAgent",
        "support": "agents.support_agent.SupportAgent",
        "hr": "agents.hr_agent.HRAgent",
    }

    def _get_agent_class(self, name: str):
        import importlib
        path = self.AGENT_MAP.get(name, self.AGENT_MAP["content"])
        module_path, class_name = path.rsplit(".", 1)
        module = importlib.import_module(module_path)
        return getattr(module, class_name)

    async def dispatch(self, routing_result: dict, workspace: Workspace, user: User, session_id: UUID, db: AsyncSession) -> Dict[str, Any]:
        agents = routing_result.get("agents", [])
        if not agents:
            return {"content": "No agent matched your request.", "content_type": "text"}

        if len(agents) == 1:
            return await self._execute_single(agents[0], workspace, user, session_id, db)
        else:
            results = []
            for assignment in agents:
                result = await self._execute_single(assignment, workspace, user, session_id, db)
                results.append(result)
            combined = "\n\n---\n\n".join(f"**{r.get('agent_name', 'Agent')}:**\n{r.get('content', '')}" for r in results)
            return {"content": combined, "content_type": "text", "agent_name": ", ".join(r.get("agent_name", "") for r in results), "metadata": {"multi_agent": True, "agents_used": len(results)}}

    async def _execute_single(self, assignment: dict, workspace: Workspace, user: User, session_id: UUID, db: AsyncSession) -> Dict[str, Any]:
        agent_name = assignment.get("agent_name", "content")
        command = assignment.get("task_description", "")

        # Create task record
        task = Task(session_id=session_id, workspace_id=workspace.id, user_id=user.id, agent_name=agent_name, title=command[:500], status="running", priority=assignment.get("priority", 5), input={"command": command}, started_at=datetime.utcnow())
        db.add(task)
        await db.flush()

        try:
            agent_class = self._get_agent_class(agent_name)
            agent = agent_class(workspace=workspace, user=user, db=db)
            result = await agent.execute(command)

            task.status = "completed"
            task.output = result
            task.completed_at = datetime.utcnow()
            task.tokens_used = result.get("tokens_used", 0)
            task.cost_usd = result.get("cost_usd", 0)
            db.add(task)

            # Track usage
            try:
                from utils.cost_tracker import CostTracker
                tracker = CostTracker(db)
                await tracker.record_usage(user.id, tokens=task.tokens_used, cost_usd=float(task.cost_usd or 0), workspace_id=workspace.id)
            except: pass

            return {"content": result.get("content", "Done."), "content_type": result.get("content_type", "text"), "agent_name": agent_name, "task_id": task.id, "metadata": result.get("metadata", {})}

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            task.completed_at = datetime.utcnow()
            db.add(task)
            return {"content": f"Agent '{agent_name}' error: {str(e)}", "content_type": "error", "agent_name": agent_name, "task_id": task.id}
