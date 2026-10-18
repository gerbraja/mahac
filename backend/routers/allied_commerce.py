import os
import math
import requests
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database.connection import get_db
from backend.database.models.allied_commerce import AlliedCommerce

router = APIRouter(
    prefix="/allied-commerce",
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
    merchant_id: Optional[int] = None

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
def get_coordinates_from_address(address: str, city: Optional[str] = None, country: Optional[str] = "Colombia"):
    """
    Geocodes an address to (latitude, longitude).
    1. First uses Google Maps Geocoding API if key is available.
    2. Fallbacks to OpenStreetMap Nominatim with intelligent Colombian address normalization.
    """
    clean_addr = (address or "").strip()
    clean_city = (city or "").strip()
    clean_country = (country or "Colombia").strip()
    
    # 1. Google Maps Geocoding
    google_key = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyCnJUXHAWCpMu9asRym0Zr1QkWIpfBWeio")
    if google_key:
        try:
            full_query = f"{clean_addr}, {clean_city}, {clean_country}".strip(", ")
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"address": full_query, "key": google_key}
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "OK" and data.get("results"):
                    loc = data["results"][0]["geometry"]["location"]
                    return float(loc["lat"]), float(loc["lng"])
        except Exception as e:
            print(f"[GEOCODE] Google Geocoding error: {e}", flush=True)

    # 2. OpenStreetMap Nominatim Fallback
    headers = {'User-Agent': 'TuEmpresaInternacional/1.0 (admin@tuempresainternacional.com)'}
    
    candidates = [
        f"{clean_addr}, {clean_city}, {clean_country}".strip(", "),
        f"{clean_addr}, {clean_city}".strip(", "),
    ]
    # Address stripped of extra trailing words (e.g. neighborhood names)
    match = re.search(r'^(.*?(\d+\s*[a-zA-Z]?\s*(?:-\s*\d+|#\s*\d+[a-zA-Z]?\s*(?:-\s*\d+)?(?:\s*Sur|\s*Norte)?)))', clean_addr, re.IGNORECASE)
    if match:
        street_core = match.group(1).strip()
        candidates.append(f"{street_core}, {clean_city}, {clean_country}".strip(", "))
        candidates.append(f"{street_core}, {clean_city}".strip(", "))
        
    if clean_city:
        candidates.append(f"{clean_city}, {clean_country}".strip(", "))

    for q in candidates:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {'q': q, 'format': 'json', 'limit': 1}
            res = requests.get(url, params=params, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0:
                    return float(data[0]['lat']), float(data[0]['lon'])
        except Exception as e:
            print(f"[GEOCODE] Nominatim error query '{q}': {e}", flush=True)

    return None, None

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def sync_merchants_to_allied_commerces(db: Session):
    """
    Synchronizes active merchants from 'merchants' table into 'allied_commerces',
    automatically resolving geographic coordinates (lat, lng) if not present.
    """
    from backend.database.models.merchant import Merchant, MerchantStatus
    
    merchants = db.query(Merchant).filter(
        Merchant.status == MerchantStatus.active,
        Merchant.address.isnot(None)
    ).all()
    
    synced_count = 0
    results = []
    
    for m in merchants:
        if not m.address or len(m.address.strip()) < 3:
            continue
            
        existing = db.query(AlliedCommerce).filter(
            (AlliedCommerce.merchant_id == m.id) | 
            ((AlliedCommerce.name == m.name) & (AlliedCommerce.address == m.address))
        ).first()
        
        lat = None
        lng = None
        if existing and existing.latitude and existing.longitude:
            lat = existing.latitude
            lng = existing.longitude
        else:
            lat, lng = get_coordinates_from_address(m.address, m.city, m.country)
            
        desc = m.store_description or f"Comercio aliado {m.name} especializado en {m.category or 'productos'}."
        phone = m.customer_service_phone or m.phone or ""
        img = m.logo_url or m.banner_url
        
        if existing:
            existing.merchant_id = m.id
            existing.name = m.name
            existing.description = desc
            existing.address = m.address
            existing.city = m.city
            existing.country = m.country or "Colombia"
            existing.phone = phone
            existing.category = m.category or "products"
            if img:
                existing.image_url = img
            if lat is not None and lng is not None:
                existing.latitude = lat
                existing.longitude = lng
            synced_count += 1
            results.append({"id": m.id, "name": m.name, "action": "updated", "lat": existing.latitude, "lng": existing.longitude})
        else:
            new_ac = AlliedCommerce(
                merchant_id=m.id,
                name=m.name,
                description=desc,
                address=m.address,
                city=m.city,
                country=m.country or "Colombia",
                phone=phone,
                category=m.category or "products",
                image_url=img,
                latitude=lat,
                longitude=lng
            )
            db.add(new_ac)
            synced_count += 1
            results.append({"id": m.id, "name": m.name, "action": "created", "lat": lat, "lng": lng})
            
    db.commit()
    return {"total_merchants": len(merchants), "synced": synced_count, "results": results}

@router.get("/nearby", response_model=List[AlliedCommerceResponse])
def get_nearby_commerces(
    lat: float = Query(...), 
    lng: float = Query(...), 
    radius_km: float = Query(35.0),
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get allied commerces within a given radius (default 35km).
    Calculated using Haversine formula on the backend.
    """
    db_query = db.query(AlliedCommerce).filter(
        AlliedCommerce.latitude.isnot(None),
        AlliedCommerce.longitude.isnot(None)
    )
    
    if query:
        search_pattern = f"%{query}%"
        db_query = db_query.filter(
            (AlliedCommerce.name.ilike(search_pattern)) |
            (AlliedCommerce.description.ilike(search_pattern)) |
            (AlliedCommerce.category.ilike(search_pattern)) |
            (AlliedCommerce.address.ilike(search_pattern))
        )
    if category:
        db_query = db_query.filter(AlliedCommerce.category == category)
        
    commerces = db_query.all()
    
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

@router.post("/sync-merchants")
def trigger_sync_merchants(db: Session = Depends(get_db)):
    """
    Triggers automatic synchronization of active merchants to allied_commerces with geocoding.
    """
    return sync_merchants_to_allied_commerces(db)

@router.post("/", response_model=AlliedCommerceResponse)
def create_commerce(commerce: AlliedCommerceCreate, db: Session = Depends(get_db)):
    """
    Create a new allied commerce manually. Automatically fetches coordinates using Geocoding.
    """
    lat, lng = get_coordinates_from_address(commerce.address, commerce.city, commerce.country)
    
    new_commerce = AlliedCommerce(
        name=commerce.name,
        description=commerce.description,
        address=commerce.address,
        city=commerce.city,
        country=commerce.country,
        phone=commerce.phone,
        category=commerce.category,
        image_url=commerce.image_url,
        merchant_id=commerce.merchant_id,
        latitude=lat,
        longitude=lng
    )
    
    db.add(new_commerce)
    db.commit()
    db.refresh(new_commerce)
    
    return new_commerce
