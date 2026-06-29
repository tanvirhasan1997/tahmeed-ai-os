"""Automations API - CRUD + runs"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Automation
from dependencies import get_db, get_current_user

router = APIRouter()

class AutomationCreate(BaseModel):
    workspace_id: UUID
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    trigger_type: str
    trigger_config: dict
    action_config: dict

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_config: Optional[dict] = None
    action_config: Optional[dict] = None
    is_active: Optional[bool] = None

def auto_response(a):
    return {"id": str(a.id), "workspace_id": str(a.workspace_id), "name": a.name, "description": a.description, "trigger_type": a.trigger_type, "trigger_config": a.trigger_config, "action_config": a.action_config, "is_active": a.is_active, "run_count": a.run_count, "last_run_at": a.last_run_at.isoformat() if a.last_run_at else None, "next_run_at": a.next_run_at.isoformat() if a.next_run_at else None, "created_at": a.created_at.isoformat()}

@router.get("")
async def list_automations(workspace_id: UUID = Query(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.workspace_id == workspace_id, Automation.user_id == current_user.id).order_by(Automation.created_at.desc()))
    autos = result.scalars().all()
    return {"automations": [auto_response(a) for a in autos], "total": len(autos)}

@router.post("", status_code=201)
async def create_automation(req: AutomationCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    auto = Automation(workspace_id=req.workspace_id, user_id=current_user.id, name=req.name, description=req.description, trigger_type=req.trigger_type, trigger_config=req.trigger_config, action_config=req.action_config)
    db.add(auto)
    await db.flush()
    return auto_response(auto)

@router.patch("/{automation_id}")
async def update_automation(automation_id: UUID, req: AutomationUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.id == automation_id, Automation.user_id == current_user.id))
    a = result.scalar_one_or_none()
    if not a: raise HTTPException(404, "Automation not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(a, key, val)
    db.add(a)
    await db.flush()
    return auto_response(a)

@router.delete("/{automation_id}", status_code=204)
async def delete_automation(automation_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.id == automation_id, Automation.user_id == current_user.id))
    a = result.scalar_one_or_none()
    if not a: raise HTTPException(404, "Automation not found")
    await db.delete(a)

@router.get("/templates")
async def get_templates():
    return {"templates": [
        {"id": "daily_briefing", "name": "Daily Task Briefing", "trigger_type": "schedule", "trigger_config": {"cron": "0 9 * * *"}, "action_config": {"type": "run_agent", "agent_name": "content", "command": "Generate my daily task briefing"}},
        {"id": "weekly_report", "name": "Weekly Report", "trigger_type": "schedule", "trigger_config": {"cron": "0 18 * * 5"}, "action_config": {"type": "run_agent", "agent_name": "data", "command": "Generate weekly performance report"}},
        {"id": "security_scan", "name": "Weekly Security Scan", "trigger_type": "schedule", "trigger_config": {"cron": "0 8 * * 1"}, "action_config": {"type": "run_agent", "agent_name": "security", "command": "Check for common vulnerabilities based on OWASP Top 10"}},
    ]}
