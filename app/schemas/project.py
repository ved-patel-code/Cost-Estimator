from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Base Schema (Shared properties)
class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=1, description="Name of the project")
    project_address: Optional[str] = None
    company_name: Optional[str] = None
    architect_info: Optional[str] = None
    project_date: str = Field(..., description="Date string like YYYY-MM-DD")
    revision: str = "1"

# Schema for Creation (What the client sends)
class ProjectCreate(ProjectBase):
    pass

# Schema for Updates (Everything is optional)
class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=1)
    project_address: Optional[str] = None
    company_name: Optional[str] = None
    architect_info: Optional[str] = None
    project_date: Optional[str] = None
    revision: Optional[str] = None

# Schema for Response (What we send back)
class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True