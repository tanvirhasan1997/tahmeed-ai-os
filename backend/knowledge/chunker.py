"""Chunker - Split documents into chunks for embedding"""
from typing import List, Dict, Any

class Chunker:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        if not text or not text.strip(): return []
        if len(text) <= self.chunk_size:
            return [{"content": text.strip(), "chunk_index": 0}]
        chunks = []
        start = 0
        idx = 0
        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end].strip()
            if chunk:
                chunks.append({"content": chunk, "chunk_index": idx})
                idx += 1
            start = end - self.chunk_overlap
        return chunks

    def chunk_pages(self, pages: List[Dict]) -> List[Dict]:
        all_chunks = []
        idx = 0
        for page in pages:
            text = page.get("content", "")
            for chunk in self.chunk_text(text):
                chunk["page_number"] = page.get("page_number")
                chunk["chunk_index"] = idx
                all_chunks.append(chunk)
                idx += 1
        return all_chunks
