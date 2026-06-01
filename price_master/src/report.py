import io
import pandas as pd


def export_raw(df: pd.DataFrame, output_path: str):
    """Export raw lines to an Excel workbook with a RAW_LINES sheet."""
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='RAW_LINES', index=False)


def export_raw_bytes(df: pd.DataFrame) -> bytes:
    """Return raw lines as Excel bytes for browser download."""
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='RAW_LINES', index=False)
    return buf.getvalue()
