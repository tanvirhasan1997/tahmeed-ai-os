"""Embedder - OpenAI text-embedding-3-small"""
from typing import List
from openai import AsyncOpenAI
from config import settings

class Embedder:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_EMBEDDING_MODEL

    async def embed_text(self, text: str) -> List[float]:
        try:
            response = await self.client.embeddings.create(model=self.model, input=text)
            return response.data[0].embedding
        except Exception:
            return [0.0] * 1536

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts: return []
        try:
            response = await self.client.embeddings.create(model=self.model, input=texts)
            return [d.embedding for d in response.data]
        except Exception:
            return [[0.0] * 1536 for _ in texts]
