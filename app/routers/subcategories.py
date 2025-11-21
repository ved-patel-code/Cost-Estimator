from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.db.models import User, Project, Category, Subcategory
from app.schemas.subcategory import SubcategoryCreate, SubcategoryUpdate, SubcategoryResponse
from app.core.deps import get_current_user

router = APIRouter(tags=["Subcategories"])

# -------------------------------------------------------------------
# 1. CREATE SUBCATEGORY
# Path: /categories/{category_id}/subcategories
# Description: Adds a subcategory under a specific category.
# -------------------------------------------------------------------
@router.post("/categories/{category_id}/subcategories", response_model=SubcategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_subcategory(
    category_id: int,
    subcategory_in: SubcategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Efficient Ownership Check (Join Category -> Project)
    # Ensure the target Category exists and belongs to the Current User
    query = (
        select(Category.id)
        .join(Project, Category.project_id == Project.id)
        .where(Category.id == category_id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    
    if not result.first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found or access denied"
        )
    
    # 2. Create Subcategory
    new_sub = Subcategory(
        category_id=category_id,
        name=subcategory_in.name
    )
    db.add(new_sub)
    await db.commit()
    await db.refresh(new_sub)
    
    return new_sub

# -------------------------------------------------------------------
# 2. UPDATE SUBCATEGORY
# Path: /subcategories/{id}
# Description: Renames a subcategory.
# -------------------------------------------------------------------
@router.put("/subcategories/{id}", response_model=SubcategoryResponse)
async def update_subcategory(
    id: int,
    sub_update: SubcategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Optimized Deep Join Query
    # Fetch Subcategory IF it links to Category -> Project -> User
    query = (
        select(Subcategory)
        .join(Category, Subcategory.category_id == Category.id)
        .join(Project, Category.project_id == Project.id)
        .where(Subcategory.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    subcategory = result.scalars().first()
    
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    # 2. Update
    subcategory.name = sub_update.name
    await db.commit()
    await db.refresh(subcategory)
    return subcategory

# -------------------------------------------------------------------
# 3. DELETE SUBCATEGORY
# Path: /subcategories/{id}
# Description: Deletes subcategory and cascades to its items.
# -------------------------------------------------------------------
@router.delete("/subcategories/{id}", status_code=status.HTTP_200_OK)
async def delete_subcategory(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Optimized Deep Join Query
    query = (
        select(Subcategory)
        .join(Category, Subcategory.category_id == Category.id)
        .join(Project, Category.project_id == Project.id)
        .where(Subcategory.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    subcategory = result.scalars().first()
    
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    # 2. Delete (Items under this will be deleted by DB Cascade)
    await db.delete(subcategory)
    await db.commit()
    
    return {"message": "Subcategory deleted successfully"}