"""Dashboard API - Overview stats, cost tracking"""
from datetime import date, timedelta
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Task, Memory, Document, Automation, UsageLog, Notification
from dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/overview")
async def get_overview(workspace_id: Optional[UUID] = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    task_filter = and_(Task.user_id == current_user.id, func.date(Task.created_at) == today)
    if workspace_id: task_filter = and_(task_filter, Task.workspace_id == workspace_id)
    total_tasks = (await db.execute(select(func.count()).where(task_filter))).scalar() or 0
    completed = (await db.execute(select(func.count()).where(and_(task_filter, Task.status == "completed")))).scalar() or 0
    running = (await db.execute(select(func.count()).where(and_(task_filter, Task.status == "running")))).scalar() or 0
    failed = (await db.execute(select(func.count()).where(and_(task_filter, Task.status == "failed")))).scalar() or 0
    memory_count = (await db.execute(select(func.count()).where(Memory.user_id == current_user.id))).scalar() or 0
    doc_count = (await db.execute(select(func.count()).where(Document.user_id == current_user.id))).scalar() or 0
    auto_count = (await db.execute(select(func.count()).where(Automation.user_id == current_user.id, Automation.is_active == True))).scalar() or 0
    usage = (await db.execute(select(UsageLog).where(UsageLog.user_id == current_user.id, UsageLog.date == today))).scalar_one_or_none()
    unread = (await db.execute(select(func.count()).where(Notification.user_id == current_user.id, Notification.is_read == False))).scalar() or 0
    return {"tasks": {"total_today": total_tasks, "completed": completed, "running": running, "failed": failed}, "memory_count": memory_count, "document_count": doc_count, "active_automations": auto_count, "today_cost_usd": float(usage.cost_usd) if usage else 0, "today_tokens": usage.token_count if usage else 0, "today_commands": usage.command_count if usage else 0, "unread_notifications": unread}

@router.get("/cost-history")
async def get_cost_history(days: int = Query(30, ge=1, le=90), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    start_date = date.today() - timedelta(days=days)
    result = await db.execute(select(UsageLog).where(UsageLog.user_id == current_user.id, UsageLog.date >= start_date).order_by(UsageLog.date.asc()))
    logs = result.scalars().all()
    return {"history": [{"date": l.date.isoformat(), "cost_usd": float(l.cost_usd), "token_count": l.token_count, "command_count": l.command_count} for l in logs]}
