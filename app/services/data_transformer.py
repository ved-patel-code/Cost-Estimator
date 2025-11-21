from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.db.models import Project, Category, Subcategory, Item
from app.core.calculations import calculate_item_totals, calculate_grand_totals

async def get_project_data_with_calculations(
    project_id: int, 
    db: AsyncSession, 
    user_id: int
) -> Dict[str, Any]:
    """
    Fetches the full project tree, runs calculations on every item,
    and formats the data for PDF/Excel generation.
    """
    
    # ---------------------------------------------------------
    # 1. Fetch The Tree (Optimized)
    # ---------------------------------------------------------
    # We use selectinload to fetch hierarchy in exactly 4 queries
    # Ordering is guaranteed by 'order_by' in models.py
    query = (
        select(Project)
        .where(Project.id == project_id, Project.user_id == user_id)
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
        # This function handles access control implicitly
        raise HTTPException(status_code=404, detail="Project not found")

    # ---------------------------------------------------------
    # 2. Prepare Data Structure
    # ---------------------------------------------------------
    transformed_data = {
        "project": {
            "company_name": project.company_name,
            "project_name": project.project_name,
            "project_address": project.project_address,
            "architect_info": project.architect_info,
            "project_date": project.project_date,
            "revision_counter": project.revision, # Mapping DB 'revision' to JSON 'revision_counter'
            "logo_url": project.logo_url
        },
        "categories": [],
        "totals": {}
    }

    all_processed_items = []
    global_item_counter = 1 # Continuous count from 1 to N

    # ---------------------------------------------------------
    # 3. Iterate & Calculate
    # ---------------------------------------------------------
    
    # Loop Categories (Sorted by Created At)
    for category in project.categories:
        cat_dict = {
            "name": category.name,
            "items": [],
            "subcategories": []
        }

        # A. Process Direct Items (First, as requested)
        for item in category.items:
            # Convert DB Model to Dict
            item_inputs = object_to_dict(item)
            
            # Run Math Logic
            calculated_item = calculate_item_totals(item_inputs)
            
            # Assign Item No
            calculated_item['item_no'] = global_item_counter
            global_item_counter += 1
            
            # Store
            cat_dict["items"].append(calculated_item)
            all_processed_items.append(calculated_item)

        # B. Process Subcategories (Second)
        for subcat in category.subcategories:
            subcat_dict = {
                "name": subcat.name,
                "items": []
            }
            
            for item in subcat.items:
                item_inputs = object_to_dict(item)
                calculated_item = calculate_item_totals(item_inputs)
                
                calculated_item['item_no'] = global_item_counter
                global_item_counter += 1
                
                subcat_dict["items"].append(calculated_item)
                all_processed_items.append(calculated_item)
            
            cat_dict["subcategories"].append(subcat_dict)

        transformed_data["categories"].append(cat_dict)

    # ---------------------------------------------------------
    # 4. Calculate Grand Totals
    # ---------------------------------------------------------
    grand_totals = calculate_grand_totals(all_processed_items)
    transformed_data["totals"] = grand_totals

    return transformed_data

def object_to_dict(obj) -> Dict[str, Any]:
    """
    Helper to convert SQLAlchemy model instance to a plain dictionary.
    Excludes internal SQLAlchemy state.
    """
    return {
        c.name: getattr(obj, c.name) 
        for c in obj.__table__.columns
    }