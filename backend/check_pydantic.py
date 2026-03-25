from typing import Optional
from pydantic import BaseModel

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    options: Optional[str] = None

# If we simulate FastAPI taking the JSON payload and validating it into the BaseModel:
payload = {
    "name": "CONJUNTO CASUAL PANTALON",
    "options": '{"Talla":["SM", "ML", "LXL"]}',
    "options_name": "Talla",
    "options_values": "SM, ML, LXL"
}

try:
    prod = ProductUpdate(**payload)
    print("Parsed dict:")
    print(prod.dict(exclude_unset=True))
except Exception as e:
    print(f"Error: {e}")
