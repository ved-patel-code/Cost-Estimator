from pydantic import BaseModel, Field
from datetime import datetime

# Shared properties
class SubcategoryBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the subcategory (e.g., 'Flooring')")

# Properties to receive on creation
class SubcategoryCreate(SubcategoryBase):
    pass

# Properties to receive on update
class SubcategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1)

# Properties to return to client
class SubcategoryResponse(SubcategoryBase):
    id: int
    category_id: int
    created_at: datetime

    class Config:
        from_attributes = True