"""Command API - Full pipeline: user command → Router AI → Agent dispatch → response"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Workspace, Session, Message, Task
from dependencies import get_db, get_current_user
from core.router_ai import RouterAI
from core.dispatcher import Dispatcher

router = APIRouter()

class CommandRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    workspace_id: UUID
    session_id: Optional[UUID] = None
    attachments: List[dict] = []

class FeedbackRequest(BaseModel):
    message_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@router.post("")
async def execute_command(req: CommandRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Execute a command through the full AI pipeline."""
    # 1. Verify workspace access
    result = await db.execute(select(Workspace).where(Workspace.id == req.workspace_id, Workspace.user_id == current_user.id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(403, "Access denied to workspace")

    # 2. Get or create session
    if req.session_id:
        result = await db.execute(select(Session).where(Session.id == req.session_id, Session.workspace_id == req.workspace_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(404, "Session not found")
    else:
        session = Session(workspace_id=req.workspace_id, user_id=current_user.id, title=req.content[:100], status="active")
        db.add(session)
        await db.flush()

    # 3. Save user message
    user_msg = Message(session_id=session.id, role="user", content=req.content, content_type="text", metadata={"attachments": req.attachments} if req.attachments else {})
    db.add(user_msg)
    await db.flush()

    # 4. Route through Router AI
    router_ai = RouterAI()
    routing = await router_ai.route(req.content, workspace=workspace, user=current_user)

    # 5. Dispatch to agent(s)
    dispatcher = Dispatcher()
    result = await dispatcher.dispatch(routing_result=routing, workspace=workspace, user=current_user, session_id=session.id, db=db)

    # 6. Save assistant response
    assistant_msg = Message(
        session_id=session.id,
        role="assistant",
        content=result.get("content", "Task completed."),
        content_type=result.get("content_type", "text"),
        agent_name=result.get("agent_name"),
        metadata=result.get("metadata", {}),
    )
    db.add(assistant_msg)
    await db.flush()

    return {
        "session_id": str(session.id),
        "message_id": str(assistant_msg.id),
        "content": assistant_msg.content,
        "content_type": assistant_msg.content_type,
        "agent_name": assistant_msg.agent_name,
        "task_id": str(result.get("task_id")) if result.get("task_id") else None,
        "metadata": assistant_msg.metadata,
        "created_at": assistant_msg.created_at.isoformat(),
    }

@router.post("/feedback", status_code=204)
async def submit_feedback(req: FeedbackRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Submit feedback on a response."""
    result = await db.execute(select(Message).where(Message.id == req.message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(404, "Message not found")
    metadata = msg.metadata or {}
    metadata["feedback"] = {"rating": req.rating, "comment": req.comment, "user_id": str(current_user.id), "at": datetime.utcnow().isoformat()}
    msg.metadata = metadata
    db.add(msg)

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get all messages in a session."""
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Session not found")
    result = await db.execute(select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc()))
    messages = result.scalars().all()
    return {"session_id": str(session_id), "messages": [{"id": str(m.id), "role": m.role, "content": m.content, "content_type": m.content_type, "agent_name": m.agent_name, "metadata": m.metadata, "created_at": m.created_at.isoformat()} for m in messages]}

@router.get("/sessions")
async def list_sessions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List user sessions."""
    result = await db.execute(select(Session).where(Session.user_id == current_user.id).order_by(Session.updated_at.desc()).limit(50))
    sessions = result.scalars().all()
    return {"sessions": [{"id": str(s.id), "workspace_id": str(s.workspace_id), "title": s.title, "status": s.status, "created_at": s.created_at.isoformat(), "updated_at": s.updated_at.isoformat()} for s in sessions]}
