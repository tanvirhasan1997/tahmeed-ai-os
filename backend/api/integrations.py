"""Integrations API - OAuth2 tool connections"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Integration
from dependencies import get_db, get_current_user

router = APIRouter()

SUPPORTED_TOOLS = ["github", "gmail", "drive", "notion", "slack"]

@router.get("")
async def list_integrations(workspace_id: UUID = Query(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Integration).where(Integration.workspace_id == workspace_id, Integration.user_id == current_user.id))
    integrations = result.scalars().all()
    return {"integrations": [{"id": str(i.id), "tool_name": i.tool_name, "is_active": i.is_active, "config": i.config, "created_at": i.created_at.isoformat()} for i in integrations]}

@router.get("/available")
async def available_tools():
    return {"tools": [{"name": "github", "label": "GitHub", "description": "Code repos, issues, PRs"}, {"name": "gmail", "label": "Gmail", "description": "Email read, send, search"}, {"name": "drive", "label": "Google Drive", "description": "File storage"}, {"name": "notion", "label": "Notion", "description": "Notes, databases"}, {"name": "slack", "label": "Slack", "description": "Team messaging"}]}

@router.delete("/{integration_id}", status_code=204)
async def disconnect(integration_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Integration).where(Integration.id == integration_id, Integration.user_id == current_user.id))
    i = result.scalar_one_or_none()
    if not i: raise HTTPException(404, "Integration not found")
    await db.delete(i)
