from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import User, Project, Category, Subcategory
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.core.deps import get_current_user
from app.services.file_storage import LocalFileManager
from app.schemas.project_tree import ProjectTree 

router = APIRouter(prefix="/projects", tags=["Projects"])

# -------------------------------------------------------------------
# 1. LIST PROJECTS (Fast Summary)
# Optimization: Fetches only project fields, no relations.
# -------------------------------------------------------------------
@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

# -------------------------------------------------------------------
# 2. CREATE PROJECT
# -------------------------------------------------------------------
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        **project_in.model_dump(),
        user_id=current_user.id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

# -------------------------------------------------------------------
# 3. GET ONE PROJECT (The Tree Loader)
# Optimization: Uses selectinload to fetch the whole tree in 4 queries.
# -------------------------------------------------------------------
@router.get("/{id}", response_model=ProjectTree) # <--- Return Type is now the Tree
async def get_project(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Efficient Query:
    # 1. Fetch Project
    # 2. Eagerly load Categories (Sorted by models.py default)
    # 3. Inside Categories, load Direct Items (Sorted by models.py default)
    # 4. Inside Categories, load Subcategories (Sorted by models.py default)
    # 5. Inside Subcategories, load Items (Sorted by models.py default)
    
    query = (
        select(Project)
        .where(Project.id == id, Project.user_id == current_user.id)
        .options(
            selectinload(Project.categories).options(
                selectinload(Category.items),         # Direct Items
                selectinload(Category.subcategories).options(
                    selectinload(Subcategory.items)   # Subcategory Items
                )
            )
        )
    )
    
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return project

# -------------------------------------------------------------------
# 4. UPDATE PROJECT
# Optimization: Only updates sent fields.
# -------------------------------------------------------------------
@router.put("/{id}", response_model=ProjectResponse)
async def update_project(
    id: int,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check Ownership
    query = select(Project).where(Project.id == id, Project.user_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 2. Apply Updates
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    await db.commit()
    await db.refresh(project)
    return project

# -------------------------------------------------------------------
# 5. DELETE PROJECT
# Optimization: Cascade delete in DB handles children automatically.
# -------------------------------------------------------------------
@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_project(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check Ownership
    query = select(Project).where(Project.id == id, Project.user_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 2. Delete (Cascade handles items/categories)
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

# -------------------------------------------------------------------
# 6. UPLOAD LOGO
# -------------------------------------------------------------------
@router.post("/{id}/logo", status_code=status.HTTP_200_OK)
async def upload_logo(
    id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check Ownership
    query = select(Project).where(Project.id == id, Project.user_id == current_user.id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 2. Save File
    file_path = await LocalFileManager.save_file(file)
    
    # 3. Update DB with path
    # Remove old logo if exists to save space
    if project.logo_url:
        LocalFileManager.delete_file(project.logo_url)
        
    project.logo_url = file_path
    await db.commit()
    
    return {"logo_url": file_path}