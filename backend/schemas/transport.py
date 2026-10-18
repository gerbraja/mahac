from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- Vehicle Schemas ---
class VehicleCreate(BaseModel):
    type: str # moto, carro, camion
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: str
    cargo_capacity_kg: Optional[float] = None
    selfie_url: Optional[str] = None
    license_url: Optional[str] = None
    property_card_url: Optional[str] = None

class VehicleResponse(VehicleCreate):
    id: int
    user_id: int
    status: str
    is_active: bool
    created_at: datetime
    police_record_capture_url: Optional[str] = None
    procuraduria_capture_url: Optional[str] = None
    runt_capture_url: Optional[str] = None
    verifier_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

# --- Trip Schemas ---
class TripCreate(BaseModel):
    vehicle_type_requested: str
    origin_lat: float
    origin_lon: float
    origin_address: Optional[str] = None
    destination_lat: float
    destination_lon: float
    destination_address: Optional[str] = None
    distance_km: Optional[float] = None
    proposed_price: float
    payment_method: Optional[str] = "cash" # "cash" o "tei_bank"

class TripResponse(TripCreate):
    id: int
    passenger_id: int
    driver_id: Optional[int]
    distance_km: Optional[float]
    final_price: Optional[float]
    platform_fee: Optional[float]
    driver_earnings: Optional[float] = None
    payment_method: Optional[str] = "cash"
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True

# --- Auction Schemas ---
class TripAcceptRequest(BaseModel):
    trip_id: int
    counter_offer: Optional[float] = None # Si es nulo, acepta el proposed_price

class DriverStatusUpdate(BaseModel):
    is_online: bool

class TripCounterOfferRequest(BaseModel):
    trip_id: int
    amount: float

class PassengerAcceptOfferRequest(BaseModel):
    trip_id: int
    driver_id: int
    price: float

class PassengerRejectOfferRequest(BaseModel):
    trip_id: int
    driver_id: int

class VehicleAuditUpdate(BaseModel):
    police_record_capture_url: Optional[str] = None
    procuraduria_capture_url: Optional[str] = None
    runt_capture_url: Optional[str] = None
    verifier_notes: Optional[str] = None
    action: Optional[str] = None # 'approve', 'reject', or None
