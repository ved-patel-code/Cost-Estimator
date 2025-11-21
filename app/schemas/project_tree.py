from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.item import ItemResponse
from app.schemas.project import ProjectResponse

# 1. Subcategory with its Items
class SubcategoryTree(BaseModel):
    id: int
    name: str
    created_at: datetime
    items: List[ItemResponse] = []

    class Config:
        from_attributes = True

# 2. Category with its Items AND Subcategories
class CategoryTree(BaseModel):
    id: int
    name: str
    created_at: datetime
    items: List[ItemResponse] = []       # Direct Items
    subcategories: List[SubcategoryTree] = [] # Subcategories

    class Config:
        from_attributes = True

# 3. The Full Project Tree
class ProjectTree(ProjectResponse):
    categories: List[CategoryTree] = []

    class Config:
        from_attributes = True