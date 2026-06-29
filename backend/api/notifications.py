"""Notifications API - List, read, delete"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Notification
from dependencies import get_db, get_current_user

router = APIRouter()

@router.get("")
async def list_notifications(unread_only: bool = False, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only: query = query.where(Notification.is_read == False)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(Notification.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    result = await db.execute(query)
    notifs = result.scalars().all()
    unread = (await db.execute(select(func.count()).where(Notification.user_id == current_user.id, Notification.is_read == False))).scalar() or 0
    return {"notifications": [{"id": str(n.id), "title": n.title, "body": n.body, "type": n.type, "is_read": n.is_read, "metadata": n.metadata, "created_at": n.created_at.isoformat()} for n in notifs], "total": total, "unread_count": unread}

@router.post("/{notification_id}/read", status_code=204)
async def mark_read(notification_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    n = result.scalar_one_or_none()
    if not n: raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.add(n)

@router.post("/read-all", status_code=204)
async def mark_all_read(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False).values(is_read=True))

@router.get("/unread-count")
async def unread_count(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    count = (await db.execute(select(func.count()).where(Notification.user_id == current_user.id, Notification.is_read == False))).scalar() or 0
    return {"unread_count": count}
