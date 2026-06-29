"""Cost Tracker - Track API usage per user per day"""
from datetime import date
from decimal import Decimal
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import UsageLog

class CostTracker:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_usage(self, user_id: UUID, tokens: int = 0, cost_usd: float = 0.0, workspace_id: UUID = None):
        today = date.today()
        result = await self.db.execute(select(UsageLog).where(UsageLog.user_id == user_id, UsageLog.date == today))
        usage = result.scalar_one_or_none()
        if usage:
            usage.token_count = (usage.token_count or 0) + tokens
            usage.cost_usd = (usage.cost_usd or Decimal("0")) + Decimal(str(cost_usd))
            usage.command_count = (usage.command_count or 0) + 1
        else:
            usage = UsageLog(user_id=user_id, workspace_id=workspace_id, date=today, command_count=1, token_count=tokens, cost_usd=Decimal(str(cost_usd)))
        self.db.add(usage)
