"""Short-Term Memory - Redis based"""
import json
from typing import List, Dict
import redis.asyncio as aioredis
from config import settings

class ShortTermMemory:
    def __init__(self): self._redis = None
    async def _get_redis(self):
        if not self._redis: self._redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis
    async def add_message(self, session_id, role, content, metadata=None):
        r = await self._get_redis()
        await r.rpush(f"session:{session_id}:memory", json.dumps({"role": role, "content": content}))
        await r.expire(f"session:{session_id}:memory", 14400)
    async def get_messages(self, session_id, limit=20) -> List[Dict]:
        r = await self._get_redis()
        msgs = await r.lrange(f"session:{session_id}:memory", -limit, -1)
        return [json.loads(m) for m in msgs]
