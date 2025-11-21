from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, Project, Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.deps import get_current_user

# We separate the routes:
# 1. Project-dependent routes (Creation)
# 2. ID-dependent routes (Update/Delete)
router = APIRouter(tags=["Categories"])

# -------------------------------------------------------------------
# 1. CREATE CATEGORY
# Path: /projects/{project_id}/categories
# -------------------------------------------------------------------
@router.post("/projects/{project_id}/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    project_id: int,
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Efficiently verify Project existence + Ownership
    # We only fetch the ID to save bandwidth
    query = select(Project.id).where(Project.id == project_id, Project.user_id == current_user.id)
    result = await db.execute(query)
    
    if not result.first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Project not found or access denied"
        )
    
    # 2. Create Category
    new_category = Category(
        project_id=project_id,
        name=category_in.name
    )
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return new_category

# -------------------------------------------------------------------
# 2. UPDATE CATEGORY
# Path: /categories/{id}
# -------------------------------------------------------------------
@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(
    id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Optimized JOIN Query
    # Fetch Category IF AND ONLY IF it links to a Project owned by Current User
    query = (
        select(Category)
        .join(Project, Category.project_id == Project.id)
        .where(Category.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # 2. Update
    category.name = category_update.name
    await db.commit()
    await db.refresh(category)
    return category

# -------------------------------------------------------------------
# 3. DELETE CATEGORY
# Path: /categories/{id}
# -------------------------------------------------------------------
@router.delete("/categories/{id}", status_code=status.HTTP_200_OK)
async def delete_category(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Optimized JOIN Query
    query = (
        select(Category)
        .join(Project, Category.project_id == Project.id)
        .where(Category.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # 2. Delete (Cascade will handle subcategories/items automatically)
    await db.delete(category)
    await db.commit()
    
    return {"message": "Category deleted successfully"}