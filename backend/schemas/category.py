from pydantic import BaseModel
from typing import List, Optional


class SubcategoryBase(BaseModel):
    name: str


class SubcategoryCreate(SubcategoryBase):
    pass


class Subcategory(SubcategoryBase):
    id: int

    class Config:
        orm_mode = True


class CategoryBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    subcategories: List[SubcategoryCreate] = []


class Category(CategoryBase):
    id: int
    subcategories: List[Subcategory] = []

    class Config:
        orm_mode = True
