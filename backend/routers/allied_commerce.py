from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import math
import requests

from backend.database.connection import get_db
from backend.database.models.allied_commerce import AlliedCommerce

router = APIRouter(
    prefix="/api/allied-commerce",
    tags=["allied-commerce"]
)

# Schemas
class AlliedCommerceBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class AlliedCommerceCreate(AlliedCommerceBase):
    pass

class AlliedCommerceResponse(AlliedCommerceBase):
    id: int
    latitude: Optional[float]
    longitude: Optional[float]
    distance_km: Optional[float] = None
    
    class Config:
        orm_mode = True

# Helper functions
def get_coordinates_from_address(address: str):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'limit': 1
        }
        headers = {
            'User-Agent': 'TuEmpresaInternacional/1.0 (contact@tei.com)'
        }
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None, None

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("/nearby", response_model=List[AlliedCommerceResponse])
def get_nearby_commerces(
    lat: float = Query(...), 
    lng: float = Query(...), 
    radius_km: float = Query(20.0),
    db: Session = Depends(get_db)
):
    """
    Get allied commerces within a given radius (default 20km).
    Calculated using Haversine formula on the backend.
    """
    # Get all commerces that have coordinates
    commerces = db.query(AlliedCommerce).filter(
        AlliedCommerce.latitude.isnot(None),
        AlliedCommerce.longitude.isnot(None)
    ).all()
    
    nearby = []
    for c in commerces:
        dist = haversine_distance(lat, lng, c.latitude, c.longitude)
        if dist <= radius_km:
            c_dict = c.__dict__.copy()
            c_dict['distance_km'] = round(dist, 2)
            nearby.append(c_dict)
            
    # Sort by distance
    nearby.sort(key=lambda x: x['distance_km'])
    
    return nearby

@router.post("/", response_model=AlliedCommerceResponse)
def create_commerce(commerce: AlliedCommerceCreate, db: Session = Depends(get_db)):
    """
    Create a new allied commerce. Automatically fetches coordinates using Geocoding.
    """
    # Geocoding
    full_address = f"{commerce.address}, {commerce.city or ''}, {commerce.country or ''}".strip(", ")
    lat, lng = get_coordinates_from_address(full_address)
    
    new_commerce = AlliedCommerce(
        name=commerce.name,
        description=commerce.description,
        address=commerce.address,
        city=commerce.city,
        country=commerce.country,
        phone=commerce.phone,
        category=commerce.category,
        image_url=commerce.image_url,
        latitude=lat,
        longitude=lng
    )
    
    db.add(new_commerce)
    db.commit()
    db.refresh(new_commerce)
    
    return new_commerce
