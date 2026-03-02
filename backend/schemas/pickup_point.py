from pydantic import BaseModel
from typing import Optional

class PickupPointBase(BaseModel):
    name: str
    address: str
    city: str
    country: str = "Colombia"
    active: bool = True

class PickupPointCreate(PickupPointBase):
    pass

class PickupPointUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    active: Optional[bool] = None

class PickupPointOut(PickupPointBase):
    id: int

    class Config:
        orm_mode = True
