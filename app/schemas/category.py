from pydantic import BaseModel, Field
from datetime import datetime

# Shared properties
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the category (e.g., 'APARTMENT FLOOR')")

# Properties to receive on creation
class CategoryCreate(CategoryBase):
    pass

# Properties to receive on update
class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1)

# Properties to return to client
class CategoryResponse(CategoryBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True