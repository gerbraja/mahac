from pydantic import BaseModel, Field, validator
from typing import Optional, List
from decimal import Decimal, InvalidOperation


class RankUp(BaseModel):
    from_rank: str = Field(..., alias="from")
    to_rank: str = Field(..., alias="to")


class OneTimeBonus(BaseModel):
    amount: Decimal
    description: Optional[str] = None


class MatrixLevel(BaseModel):
    id: int
    amount: Decimal
    reentry_amount: Decimal
    next_matrix: Optional[int] = None
    monthly_limit: Optional[int] = None
    yearly_limit: Optional[int] = None
    rank_up: Optional[RankUp] = None
    one_time_bonus: Optional[OneTimeBonus] = None
    period: str = "month"

    @validator("amount", "reentry_amount", pre=True)
    def parse_decimal(cls, v):
        if isinstance(v, Decimal):
            return v
        try:
            return Decimal(str(v))
        except (InvalidOperation, ValueError):
            raise ValueError("amount and reentry_amount must be numeric or string representing decimal")


class MatrixPlan(BaseModel):
    plan_name: str
    plan_key: str
    currency: str
    qualification: dict = {}
    matrices: List[MatrixLevel] = []


class BinaryArrivalRule(BaseModel):
    levels: List[int]
    amount: Decimal


class BinaryPlan(BaseModel):
    plan_name: str
    plan_key: str
    currency: str
    registration_fields: List[str]
    preregistration: dict
    matrix: dict
    arrival_bonus: List[BinaryArrivalRule]


class UnilevelLevel(BaseModel):
    level: int
    percent: Decimal

    @validator("percent", pre=True)
    def parse_percent(cls, v):
        # allow percent as float (0.01) or string
        try:
            return Decimal(str(v))
        except Exception:
            raise ValueError("percent must be numeric or string representing decimal fraction, e.g. 0.01 for 1%")


class UnilevelPlan(BaseModel):
    plan_name: str
    plan_key: str
    description: Optional[str] = None
    currency: str
    levels: List[UnilevelLevel]
    qualification: Optional[dict] = {}
    caps: Optional[dict] = {}

