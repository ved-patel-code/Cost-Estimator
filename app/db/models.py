from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Numeric, and_
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    project_name = Column(String, nullable=False)
    project_address = Column(Text, nullable=True)
    company_name = Column(String, nullable=True)
    architect_info = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    project_date = Column(String, nullable=False)
    revision = Column(String, default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    categories = relationship(
        "Category", 
        back_populates="project", 
        cascade="all, delete-orphan",
        order_by="Category.created_at" # Sort Categories Oldest->Newest
    )
    items = relationship("Item", back_populates="project", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="categories")
    
    subcategories = relationship(
        "Subcategory", 
        back_populates="category", 
        cascade="all, delete-orphan",
        order_by="Subcategory.created_at" # Sort Subcategories Oldest->Newest
    )
    
    # FIX: Only fetch items where subcategory_id IS NULL (Direct Items)
    items = relationship(
        "Item", 
        primaryjoin="and_(Category.id==Item.category_id, Item.subcategory_id.is_(None))",
        back_populates="category", 
        cascade="all, delete-orphan",
        order_by="Item.created_at" # Sort Items Oldest->Newest
    )


class Subcategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    category = relationship("Category", back_populates="subcategories")
    
    items = relationship(
        "Item", 
        back_populates="subcategory", 
        cascade="all, delete-orphan",
        order_by="Item.created_at" # Sort Items Oldest->Newest
    )


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    
    # Indexes and FKs
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id", ondelete="CASCADE"), nullable=True, index=True)

    # Descriptive Fields
    tag_spec = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    location = Column(Text, nullable=True)
    product_info = Column(Text, nullable=True)
    manufacturer = Column(String, nullable=True)
    
    # Input Quantity Fields
    unit_of_measure = Column(String, nullable=True)
    material_qty = Column(Numeric(14, 2), nullable=False, default=0.00)
    
    # Input Percentage Fields
    waste_factor_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    attic_stock_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    tax_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    markup_material_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    markup_addons_percent = Column(Numeric(5, 2), nullable=False, default=0.00)

    # Input Unit Cost Fields
    unit_cost_material = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_cost_adhesive = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_cost_freight = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_cost_receiving = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_cost_delivery = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_cost_labor = Column(Numeric(10, 2), nullable=False, default=0.00)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="items")
    category = relationship("Category", back_populates="items")
    subcategory = relationship("Subcategory", back_populates="items")