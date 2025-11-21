from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

# Base properties containing all the input fields
class ItemBase(BaseModel):
    tag_spec: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    product_info: Optional[str] = None
    manufacturer: Optional[str] = None
    
    unit_of_measure: Optional[str] = None
    material_qty: Decimal = Field(default=0.00, max_digits=14, decimal_places=2)
    
    # Percentages
    waste_factor_percent: Decimal = Field(default=0.00, max_digits=5, decimal_places=2)
    attic_stock_percent: Decimal = Field(default=0.00, max_digits=5, decimal_places=2)
    tax_percent: Decimal = Field(default=0.00, max_digits=5, decimal_places=2)
    markup_material_percent: Decimal = Field(default=0.00, max_digits=5, decimal_places=2)
    markup_addons_percent: Decimal = Field(default=0.00, max_digits=5, decimal_places=2)
    
    # Unit Costs
    unit_cost_material: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)
    unit_cost_adhesive: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)
    unit_cost_freight: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)
    unit_cost_receiving: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)
    unit_cost_delivery: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)
    unit_cost_labor: Decimal = Field(default=0.00, max_digits=10, decimal_places=2)

# Properties to receive on Create
class ItemCreate(ItemBase):
    category_id: int
    subcategory_id: Optional[int] = None

# Properties to receive on Update (Everything optional)
class ItemUpdate(ItemBase):
    pass

# Properties to return to client
class ItemResponse(ItemBase):
    id: int
    project_id: int
    category_id: int
    subcategory_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True