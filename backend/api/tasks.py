"""Tasks API - List, stats, cancel, logs"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Task
from dependencies import get_db, get_current_user

router = APIRouter()

def task_response(t):
    return {"id": str(t.id), "session_id": str(t.session_id) if t.session_id else None, "workspace_id": str(t.workspace_id) if t.workspace_id else None, "agent_name": t.agent_name, "title": t.title, "status": t.status, "priority": t.priority, "input": t.input, "output": t.output, "error": t.error, "tokens_used": t.tokens_used, "cost_usd": float(t.cost_usd) if t.cost_usd else 0, "started_at": t.started_at.isoformat() if t.started_at else None, "completed_at": t.completed_at.isoformat() if t.completed_at else None, "created_at": t.created_at.isoformat()}

@router.get("")
async def list_tasks(workspace_id: Optional[UUID] = None, status_filter: Optional[str] = Query(None, alias="status"), agent_name: Optional[str] = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Task).where(Task.user_id == current_user.id)
    if workspace_id: query = query.where(Task.workspace_id == workspace_id)
    if status_filter: query = query.where(Task.status == status_filter)
    if agent_name: query = query.where(Task.agent_name == agent_name)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(Task.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return {"tasks": [task_response(t) for t in tasks], "total": total, "page": page, "page_size": page_size}

@router.get("/stats")
async def get_stats(workspace_id: Optional[UUID] = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    base = Task.user_id == current_user.id
    if workspace_id: base = and_(base, Task.workspace_id == workspace_id)
    total = (await db.execute(select(func.count()).where(base))).scalar() or 0
    pending = (await db.execute(select(func.count()).where(and_(base, Task.status == "pending")))).scalar() or 0
    running = (await db.execute(select(func.count()).where(and_(base, Task.status == "running")))).scalar() or 0
    completed = (await db.execute(select(func.count()).where(and_(base, Task.status == "completed")))).scalar() or 0
    failed = (await db.execute(select(func.count()).where(and_(base, Task.status == "failed")))).scalar() or 0
    tokens = (await db.execute(select(func.sum(Task.tokens_used)).where(base))).scalar() or 0
    cost = (await db.execute(select(func.sum(Task.cost_usd)).where(base))).scalar() or 0
    return {"total": total, "pending": pending, "running": running, "completed": completed, "failed": failed, "total_tokens": tokens, "total_cost_usd": float(cost)}

@router.get("/{task_id}")
async def get_task(task_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t: raise HTTPException(404, "Task not found")
    return task_response(t)

@router.post("/{task_id}/cancel", status_code=204)
async def cancel_task(task_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t: raise HTTPException(404, "Task not found")
    if t.status not in ("pending", "queued", "running"): raise HTTPException(400, f"Cannot cancel task with status '{t.status}'")
    t.status = "cancelled"
    db.add(t)
