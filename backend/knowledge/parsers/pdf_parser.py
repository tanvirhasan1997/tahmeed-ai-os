"""PDF Parser - PyMuPDF"""
from typing import List, Dict
import fitz

class PDFParser:
    async def parse(self, content: bytes) -> List[Dict]:
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            pages = []
            for i in range(len(doc)):
                text = doc.load_page(i).get_text("text")
                if text.strip():
                    pages.append({"page_number": i + 1, "content": text.strip()})
            doc.close()
            return pages
        except: return []
