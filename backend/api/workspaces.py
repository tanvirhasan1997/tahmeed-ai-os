"""Workspaces API - Full CRUD with agent config"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Workspace, Session, Document, Memory, Automation
from dependencies import get_db, get_current_user

router = APIRouter()

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    industry: Optional[str] = None
    agent_config: dict = {}
    is_default: bool = False

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    agent_config: Optional[dict] = None

class AgentConfigUpdate(BaseModel):
    agent_name: str
    config: dict

def ws_response(w):
    return {"id": str(w.id), "user_id": str(w.user_id), "name": w.name, "description": w.description, "industry": w.industry, "agent_config": w.agent_config or {}, "is_default": w.is_default, "created_at": w.created_at.isoformat(), "updated_at": w.updated_at.isoformat()}

@router.get("")
async def list_workspaces(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.user_id == current_user.id).order_by(Workspace.is_default.desc(), Workspace.created_at.desc()))
    workspaces = result.scalars().all()
    return {"workspaces": [ws_response(w) for w in workspaces], "total": len(workspaces)}

@router.post("", status_code=201)
async def create_workspace(req: WorkspaceCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    workspace = Workspace(user_id=current_user.id, name=req.name, description=req.description, industry=req.industry, agent_config=req.agent_config, is_default=req.is_default)
    db.add(workspace)
    await db.flush()
    return ws_response(workspace)

@router.get("/{workspace_id}")
async def get_workspace(workspace_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    w = result.scalar_one_or_none()
    if not w: raise HTTPException(404, "Workspace not found")
    return ws_response(w)

@router.patch("/{workspace_id}")
async def update_workspace(workspace_id: UUID, req: WorkspaceUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    w = result.scalar_one_or_none()
    if not w: raise HTTPException(404, "Workspace not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(w, key, val)
    w.updated_at = datetime.utcnow()
    db.add(w)
    await db.flush()
    return ws_response(w)

@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(workspace_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    w = result.scalar_one_or_none()
    if not w: raise HTTPException(404, "Workspace not found")
    if w.is_default: raise HTTPException(400, "Cannot delete default workspace")
    await db.delete(w)

@router.put("/{workspace_id}/agent-config")
async def update_agent_config(workspace_id: UUID, req: AgentConfigUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    w = result.scalar_one_or_none()
    if not w: raise HTTPException(404, "Workspace not found")
    config = w.agent_config or {}
    config[req.agent_name] = req.config
    w.agent_config = config
    w.updated_at = datetime.utcnow()
    db.add(w)
    await db.flush()
    return ws_response(w)

@router.get("/{workspace_id}/summary")
async def get_summary(workspace_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    w = result.scalar_one_or_none()
    if not w: raise HTTPException(404, "Workspace not found")
    sessions = (await db.execute(select(func.count()).where(Session.workspace_id == workspace_id))).scalar() or 0
    docs = (await db.execute(select(func.count()).where(Document.workspace_id == workspace_id))).scalar() or 0
    mems = (await db.execute(select(func.count()).where(Memory.workspace_id == workspace_id))).scalar() or 0
    autos = (await db.execute(select(func.count()).where(Automation.workspace_id == workspace_id))).scalar() or 0
    return {"id": str(w.id), "name": w.name, "industry": w.industry, "session_count": sessions, "document_count": docs, "memory_count": mems, "automation_count": autos}
