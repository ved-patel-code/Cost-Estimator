from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.db.models import User, Project, Category, Subcategory, Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.core.deps import get_current_user

router = APIRouter(tags=["Items"])

# -------------------------------------------------------------------
# 1. CREATE ITEM
# Path: /projects/{project_id}/items
# -------------------------------------------------------------------
@router.post("/projects/{project_id}/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    project_id: int,
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation Check (Fast)
    # We need to ensure:
    #   a) Project belongs to User
    #   b) Category belongs to Project
    #   c) Subcategory (if provided) belongs to Category
    
    # Check A & B: Does Category exist inside this Project owned by this User?
    query = (
        select(Category.id)
        .join(Project, Category.project_id == Project.id)
        .where(Category.id == item_in.category_id, Project.id == project_id, Project.user_id == current_user.id)
    )
    cat_check = await db.execute(query)
    if not cat_check.first():
        raise HTTPException(
            status_code=404, 
            detail="Category not found within this project or access denied"
        )

    # Check C: If subcategory is provided, does it belong to this Category?
    if item_in.subcategory_id:
        sub_query = select(Subcategory.id).where(
            Subcategory.id == item_in.subcategory_id, 
            Subcategory.category_id == item_in.category_id
        )
        sub_check = await db.execute(sub_query)
        if not sub_check.first():
            raise HTTPException(status_code=400, detail="Invalid Subcategory ID for this Category")

    # 2. Create Item
    new_item = Item(
        **item_in.model_dump(),
        project_id=project_id # Enforce project context
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    return new_item

# -------------------------------------------------------------------
# 2. UPDATE ITEM
# Path: /items/{id}
# -------------------------------------------------------------------
@router.put("/items/{id}", response_model=ItemResponse)
async def update_item(
    id: int,
    item_update: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Ownership Check via Join
    # Item -> Project -> User
    query = (
        select(Item)
        .join(Project, Item.project_id == Project.id)
        .where(Item.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # 2. Apply Updates
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

# -------------------------------------------------------------------
# 3. DELETE ITEM
# Path: /items/{id}
# -------------------------------------------------------------------
@router.delete("/items/{id}", status_code=status.HTTP_200_OK)
async def delete_item(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Ownership Check
    query = (
        select(Item)
        .join(Project, Item.project_id == Project.id)
        .where(Item.id == id, Project.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # 2. Delete
    await db.delete(item)
    await db.commit()
    
    return {"message": "Item deleted successfully"}