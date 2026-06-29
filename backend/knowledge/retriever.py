"""Retriever - pgvector semantic search over document chunks"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Chunk, Document
from knowledge.embedder import Embedder

class Retriever:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedder = Embedder()

    async def search(self, query: str, workspace_id: UUID, limit: int = 5, **kwargs) -> List[dict]:
        query_embedding = await self.embedder.embed_text(query)
        stmt = (
            select(Chunk, Chunk.embedding.cosine_distance(query_embedding).label("distance"))
            .where(Chunk.workspace_id == workspace_id, Chunk.embedding != None)
            .order_by("distance")
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        results = []
        for row in rows:
            chunk = row[0]
            distance = row[1]
            # Get document name
            doc_result = await self.db.execute(select(Document.filename).where(Document.id == chunk.document_id))
            doc_name = doc_result.scalar() or "Unknown"
            results.append({"chunk_id": str(chunk.id), "document_id": str(chunk.document_id), "document_name": doc_name, "content": chunk.content, "page_number": chunk.page_number, "chunk_index": chunk.chunk_index, "relevance_score": round(1 - distance, 4)})
        return results
