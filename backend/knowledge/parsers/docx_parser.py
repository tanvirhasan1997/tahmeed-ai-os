"""DOCX Parser - python-docx"""
import io
from docx import Document as DocxDoc

class DocxParser:
    async def parse(self, content: bytes) -> str:
        try:
            doc = DocxDoc(io.BytesIO(content))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                    if row_text: paragraphs.append(row_text)
            return "\n\n".join(paragraphs)
        except: return ""
