import io
from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from urllib.parse import quote

from app.db.session import get_db
from app.db.models import User
from app.core.deps import get_current_user
from app.services.data_transformer import get_project_data_with_calculations
from app.services.pdf_generator import generate_pdf_in_memory
from app.services.excel_generator import generate_excel_in_memory

router = APIRouter(tags=["Reports"])

# Schema for Request Body (Configuration)
class ExportConfig(BaseModel):
    custom_filename: Optional[str] = None
    colors: Optional[Dict[str, str]] = None

# Helper to generate safe filenames
def get_filename(project_name: str, custom_name: Optional[str], extension: str) -> str:
    if custom_name and custom_name.strip():
        base_name = custom_name.strip()
    else:
        # Default: "Project Name_Estimate"
        base_name = f"{project_name}_Estimate"
    
    # Ensure strictly safe characters for headers (optional but good practice)
    # converting spaces to underscores looks cleaner in downloads
    clean_name = base_name.replace(" ", "_")
    return f"{clean_name}.{extension}"

# -------------------------------------------------------------------
# 1. EXPORT PDF
# Path: /projects/{id}/export/pdf
# -------------------------------------------------------------------
@router.post("/projects/{project_id}/export/pdf")
async def export_pdf(
    project_id: int,
    config: ExportConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch & Calculate Data (includes security check)
    data = await get_project_data_with_calculations(project_id, db, current_user.id)
    
    # 2. Generate PDF (Bytes)
    pdf_bytes = await generate_pdf_in_memory(data, config.model_dump())
    
    # 3. Prepare Filename
    filename = get_filename(data['project']['project_name'], config.custom_filename, "pdf")
    
    # 4. Stream Response
    # We use 'quote' to handle special characters in filenames for the Content-Disposition header
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=utf-8''{quote(filename)}"
        }
    )

# -------------------------------------------------------------------
# 2. EXPORT EXCEL
# Path: /projects/{id}/export/excel
# -------------------------------------------------------------------
@router.post("/projects/{project_id}/export/excel")
async def export_excel(
    project_id: int,
    config: ExportConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch & Calculate Data
    data = await get_project_data_with_calculations(project_id, db, current_user.id)
    
    # 2. Generate Excel (BytesIO Buffer)
    excel_buffer = generate_excel_in_memory(data, config.model_dump())
    
    # 3. Prepare Filename
    filename = get_filename(data['project']['project_name'], config.custom_filename, "xlsx")
    
    # 4. Stream Response
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=utf-8''{quote(filename)}"
        }
    )