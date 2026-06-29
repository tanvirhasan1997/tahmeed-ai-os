"""Vault Manager - Upload, parse, chunk, embed documents"""
from uuid import UUID
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database.models import Document, Chunk
from knowledge.chunker import Chunker
from knowledge.embedder import Embedder
import httpx

class VaultManager:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chunker = Chunker()
        self.embedder = Embedder()

    async def upload_file(self, file: UploadFile, workspace_id: UUID, user_id: UUID, folder: str = "/") -> Document:
        content = await file.read()
        file_size = len(content)
        await file.seek(0)
        file_type = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "txt"

        # Upload to storage (Supabase or local fallback)
        file_url = await self._upload_storage(file, workspace_id, content)

        # Create document record
        document = Document(workspace_id=workspace_id, user_id=user_id, filename=file.filename or "unnamed", file_type=file_type, file_url=file_url, file_size=file_size, folder=folder, status="processing")
        self.db.add(document)
        await self.db.flush()

        # Process: parse → chunk → embed
        try:
            parsed_text = await self._parse(file_type, content, file.filename)
            if parsed_text:
                chunks_data = self.chunker.chunk_text(parsed_text) if isinstance(parsed_text, str) else self.chunker.chunk_pages(parsed_text)
                if chunks_data:
                    texts = [c["content"] for c in chunks_data]
                    embeddings = await self.embedder.embed_batch(texts)
                    for i, chunk_data in enumerate(chunks_data):
                        chunk = Chunk(document_id=document.id, workspace_id=workspace_id, content=chunk_data["content"], embedding=embeddings[i] if i < len(embeddings) else None, chunk_index=chunk_data.get("chunk_index", i), page_number=chunk_data.get("page_number"))
                        self.db.add(chunk)
                    document.chunk_count = len(chunks_data)
            document.status = "ready"
        except Exception as e:
            document.status = "failed"
            document.metadata = {"error": str(e)}

        self.db.add(document)
        await self.db.flush()
        return document

    async def _parse(self, file_type: str, content: bytes, filename: str = None):
        if file_type == "pdf":
            from knowledge.parsers.pdf_parser import PDFParser
            return await PDFParser().parse(content)
        elif file_type in ("docx", "doc"):
            from knowledge.parsers.docx_parser import DocxParser
            return await DocxParser().parse(content)
        elif file_type in ("xlsx", "xls", "csv"):
            from knowledge.parsers.excel_parser import ExcelParser
            return await ExcelParser().parse(content, filename)
        elif file_type in ("txt", "md"):
            return content.decode("utf-8", errors="ignore")
        else:
            return content.decode("utf-8", errors="ignore")

    async def _upload_storage(self, file: UploadFile, workspace_id: UUID, content: bytes) -> str:
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            try:
                bucket = settings.SUPABASE_STORAGE_BUCKET
                path = f"{workspace_id}/{file.filename}"
                async with httpx.AsyncClient() as client:
                    resp = await client.post(f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{path}", headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}", "Content-Type": file.content_type or "application/octet-stream"}, content=content)
                    if resp.status_code in (200, 201):
                        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
            except: pass
        return f"local://vault/{workspace_id}/{file.filename}"
