"""Memory API - CRUD + semantic search"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Memory
from dependencies import get_db, get_current_user

router = APIRouter()

class MemoryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    workspace_id: Optional[UUID] = None
    category: Optional[str] = None
    is_pinned: bool = False

class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None

class MemorySearch(BaseModel):
    query: str = Field(..., min_length=1)
    workspace_id: Optional[UUID] = None
    category: Optional[str] = None
    limit: int = 10

def mem_response(m):
    return {"id": str(m.id), "user_id": str(m.user_id), "workspace_id": str(m.workspace_id) if m.workspace_id else None, "content": m.content, "category": m.category, "source": m.source, "is_pinned": m.is_pinned, "created_at": m.created_at.isoformat(), "updated_at": m.updated_at.isoformat()}

@router.get("")
async def list_memories(workspace_id: Optional[UUID] = None, category: Optional[str] = None, pinned_only: bool = False, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Memory).where(Memory.user_id == current_user.id)
    if workspace_id: query = query.where(Memory.workspace_id == workspace_id)
    if category: query = query.where(Memory.category == category)
    if pinned_only: query = query.where(Memory.is_pinned == True)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(Memory.is_pinned.desc(), Memory.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    result = await db.execute(query)
    memories = result.scalars().all()
    return {"memories": [mem_response(m) for m in memories], "total": total}

@router.post("", status_code=201)
async def create_memory(req: MemoryCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    memory = Memory(user_id=current_user.id, workspace_id=req.workspace_id, content=req.content, category=req.category, source="manual", is_pinned=req.is_pinned)
    # Generate embedding if OpenAI key available
    try:
        from knowledge.embedder import Embedder
        embedder = Embedder()
        memory.embedding = await embedder.embed_text(req.content)
    except: pass
    db.add(memory)
    await db.flush()
    return mem_response(memory)

@router.patch("/{memory_id}")
async def update_memory(memory_id: UUID, req: MemoryUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id))
    m = result.scalar_one_or_none()
    if not m: raise HTTPException(404, "Memory not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(m, key, val)
    if req.content:
        try:
            from knowledge.embedder import Embedder
            m.embedding = await Embedder().embed_text(req.content)
        except: pass
    db.add(m)
    await db.flush()
    return mem_response(m)

@router.delete("/{memory_id}", status_code=204)
async def delete_memory(memory_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id))
    m = result.scalar_one_or_none()
    if not m: raise HTTPException(404, "Memory not found")
    await db.delete(m)

@router.post("/search")
async def search_memories(req: MemorySearch, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Semantic search across memories (falls back to text search if no embeddings)."""
    try:
        from knowledge.embedder import Embedder
        embedder = Embedder()
        query_embedding = await embedder.embed_text(req.query)
        stmt = select(Memory, Memory.embedding.cosine_distance(query_embedding).label("distance")).where(Memory.user_id == current_user.id, Memory.embedding != None)
        if req.workspace_id: stmt = stmt.where((Memory.workspace_id == req.workspace_id) | (Memory.workspace_id == None))
        if req.category: stmt = stmt.where(Memory.category == req.category)
        stmt = stmt.order_by("distance").limit(req.limit)
        result = await db.execute(stmt)
        rows = result.all()
        return {"memories": [{"id": str(row[0].id), "content": row[0].content, "category": row[0].category, "is_pinned": row[0].is_pinned, "relevance_score": round(1 - row[1], 4), "created_at": row[0].created_at.isoformat()} for row in rows], "total": len(rows)}
    except Exception:
        # Fallback: text search
        query = select(Memory).where(Memory.user_id == current_user.id, Memory.content.ilike(f"%{req.query}%")).limit(req.limit)
        result = await db.execute(query)
        memories = result.scalars().all()
        return {"memories": [mem_response(m) for m in memories], "total": len(memories)}

@router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    base = Memory.user_id == current_user.id
    total = (await db.execute(select(func.count()).where(base))).scalar() or 0
    pinned = (await db.execute(select(func.count()).where(base, Memory.is_pinned == True))).scalar() or 0
    user_level = (await db.execute(select(func.count()).where(base, Memory.workspace_id == None))).scalar() or 0
    return {"total_memories": total, "pinned": pinned, "user_level": user_level, "workspace_level": total - user_level}
