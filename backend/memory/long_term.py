"""Long-Term Memory - pgvector semantic search"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Memory

class LongTermMemory:
    def __init__(self, db: AsyncSession): self.db = db
    async def store(self, user_id, content, workspace_id=None, category=None):
        memory = Memory(user_id=user_id, workspace_id=workspace_id, content=content, category=category)
        self.db.add(memory)
        await self.db.flush()
        return memory
    async def search(self, user_id, query, workspace_id=None, limit=10):
        stmt = select(Memory).where(Memory.user_id == user_id).limit(limit)
        if workspace_id: stmt = stmt.where(Memory.workspace_id == workspace_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()
