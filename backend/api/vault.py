"""Knowledge Vault API - Upload, list, delete, search"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, Document, Chunk
from dependencies import get_db, get_current_user

router = APIRouter()

class VaultSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    workspace_id: UUID
    limit: int = Field(default=5, ge=1, le=20)

def doc_response(d):
    return {"id": str(d.id), "workspace_id": str(d.workspace_id), "filename": d.filename, "file_type": d.file_type, "file_url": d.file_url, "file_size": d.file_size, "folder": d.folder, "status": d.status, "chunk_count": d.chunk_count, "metadata": d.metadata or {}, "created_at": d.created_at.isoformat()}

@router.post("/upload", status_code=201)
async def upload_document(workspace_id: UUID = Query(...), folder: str = Query(default="/"), file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Upload and process a document."""
    from knowledge.vault_manager import VaultManager
    manager = VaultManager(db)
    document = await manager.upload_file(file=file, workspace_id=workspace_id, user_id=current_user.id, folder=folder)
    return doc_response(document)

@router.get("")
async def list_documents(workspace_id: UUID = Query(...), folder: Optional[str] = None, file_type: Optional[str] = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Document).where(Document.workspace_id == workspace_id, Document.user_id == current_user.id)
    if folder: query = query.where(Document.folder == folder)
    if file_type: query = query.where(Document.file_type == file_type)
    query = query.order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()
    return {"documents": [doc_response(d) for d in docs], "total": len(docs)}

@router.get("/{document_id}")
async def get_document(document_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    d = result.scalar_one_or_none()
    if not d: raise HTTPException(404, "Document not found")
    return doc_response(d)

@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    d = result.scalar_one_or_none()
    if not d: raise HTTPException(404, "Document not found")
    await db.delete(d)

@router.post("/search")
async def search_vault(req: VaultSearchRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Semantic search across knowledge vault."""
    try:
        from knowledge.retriever import Retriever
        retriever = Retriever(db)
        results = await retriever.search(query=req.query, workspace_id=req.workspace_id, limit=req.limit)
        return {"query": req.query, "results": results, "total_results": len(results)}
    except Exception as e:
        # Fallback text search
        result = await db.execute(select(Chunk).where(Chunk.workspace_id == req.workspace_id, Chunk.content.ilike(f"%{req.query}%")).limit(req.limit))
        chunks = result.scalars().all()
        return {"query": req.query, "results": [{"chunk_id": str(c.id), "content": c.content, "chunk_index": c.chunk_index} for c in chunks], "total_results": len(chunks)}

@router.get("/stats/{workspace_id}")
async def get_vault_stats(workspace_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total_docs = (await db.execute(select(func.count()).where(Document.workspace_id == workspace_id))).scalar() or 0
    total_chunks = (await db.execute(select(func.count()).where(Chunk.workspace_id == workspace_id))).scalar() or 0
    total_size = (await db.execute(select(func.sum(Document.file_size)).where(Document.workspace_id == workspace_id))).scalar() or 0
    processing = (await db.execute(select(func.count()).where(Document.workspace_id == workspace_id, Document.status == "processing"))).scalar() or 0
    ready = (await db.execute(select(func.count()).where(Document.workspace_id == workspace_id, Document.status == "ready"))).scalar() or 0
    return {"total_documents": total_docs, "total_chunks": total_chunks, "total_size_bytes": total_size, "processing": processing, "ready": ready}
