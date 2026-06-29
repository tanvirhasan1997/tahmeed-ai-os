"""Excel/CSV Parser - pandas"""
import io
import pandas as pd

class ExcelParser:
    async def parse(self, content: bytes, filename: str = None) -> str:
        try:
            ext = filename.rsplit(".", 1)[-1].lower() if filename else "xlsx"
            df = pd.read_csv(io.BytesIO(content)) if ext == "csv" else pd.read_excel(io.BytesIO(content))
            parts = [f"Rows: {len(df)}, Columns: {len(df.columns)}", f"Columns: {', '.join(str(c) for c in df.columns)}", ""]
            if len(df) <= 100:
                parts.append(df.to_string(index=False))
            else:
                parts.append(df.head(50).to_string(index=False))
                parts.append(f"\n... ({len(df) - 50} more rows)")
            numeric = df.select_dtypes(include="number")
            if not numeric.empty:
                parts.append("\nStatistics:\n" + numeric.describe().to_string())
            return "\n".join(parts)
        except: return ""
