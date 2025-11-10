from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import yaml
from ..database.connection import get_db
from ..database.models.category import Category, Subcategory
from ..schemas.category import CategoryCreate, Category as CategorySchema

# Router uses a short prefix; main app will mount it under /api/categories
router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter((Category.name == payload.name) | (Category.code == payload.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    cat = Category(code=payload.code, name=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)

    for sub in payload.subcategories:
        s = Subcategory(name=sub.name, category_id=cat.id)
        db.add(s)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/{category_id}", response_model=CategorySchema)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat
