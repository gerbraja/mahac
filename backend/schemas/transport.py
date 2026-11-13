import re
from pydantic import BaseModel, validator
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

    @validator('brand')
    def validate_brand(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 14:
                raise ValueError("La marca no puede superar 14 caracteres.")
            if not re.match(r"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.\-]+$", v):
                raise ValueError("La marca solo puede contener letras, números y espacios estándar.")
        return v

    @validator('model')
    def validate_model(cls, v):
        if v is not None:
            v = str(v).strip()
            if not re.match(r"^\d{4}$", v):
                raise ValueError("El modelo debe ser exactamente el año del vehículo en 4 números (ej. 2024).")
            year_val = int(v)
            current_max_year = datetime.now().year + 1
            if year_val < 1990 or year_val > current_max_year:
                raise ValueError(f"El año del modelo debe estar entre 1990 y {current_max_year}.")
        return v

    @validator('color')
    def validate_color(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 12:
                raise ValueError("El color no puede superar 12 caracteres.")
            if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$", v):
                raise ValueError("El color solo puede contener letras y espacios.")
        return v

    @validator('license_plate')
    def validate_plate(cls, v):
        v = (v or "").strip().upper().replace(" ", "").replace("-", "")
        if not re.match(r"^[A-Z0-9]{5,7}$", v):
            raise ValueError("Placa inválida. Debe tener entre 5 y 7 caracteres alfanuméricos (ej. ABC123 o ABC12D).")
        return v

    @validator('year')
    def validate_year(cls, v):
        if v is not None:
            current_max_year = datetime.now().year + 1
            if v < 1990 or v > current_max_year:
                raise ValueError(f"El año debe estar entre 1990 y {current_max_year}.")
        return v

class VehicleResponse(BaseModel):
    id: int
    user_id: int
    type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: str
    cargo_capacity_kg: Optional[float] = None
    selfie_url: Optional[str] = None
    license_url: Optional[str] = None
    property_card_url: Optional[str] = None
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
