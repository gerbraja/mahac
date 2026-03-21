from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from backend.database.connection import Base


class WithholdingTaxConfig(Base):
    """
    Configurable tax rates per country/city.
    - retefuente: national withholding (e.g. Colombia 6%)
    - reteica: municipal withholding (e.g. Bogotá 0.966%)
    """
    __tablename__ = "withholding_tax_configs"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(String(100), nullable=False)          # e.g. "Colombia"
    city = Column(String(100), nullable=True)              # NULL = applies to all cities in country
    tax_type = Column(String(20), nullable=False)          # "retefuente" | "reteica"
    percentage = Column(Float, nullable=False)             # e.g. 6.0, 0.7, 0.966
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WithholdingRecord(Base):
    """
    Stores every withholding deduction applied when releasing
    commissions from available_balance -> bank_balance.
    """
    __tablename__ = "withholding_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    fiscal_year = Column(Integer, nullable=False)          # e.g. 2026
    release_type = Column(String(30), nullable=False)      # "matrix" | "millionaire" | "general"

    gross_amount = Column(Float, nullable=False)           # Before any deductions
    retefuente_pct = Column(Float, default=0.0)
    retefuente_amount = Column(Float, default=0.0)
    reteica_pct = Column(Float, default=0.0)
    reteica_amount = Column(Float, default=0.0)
    total_withheld = Column(Float, default=0.0)            # retefuente + reteica
    net_amount = Column(Float, nullable=False)             # What goes to bank_balance

    created_at = Column(DateTime(timezone=True), server_default=func.now())
