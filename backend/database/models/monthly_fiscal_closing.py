from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from backend.database.connection import Base


class MonthlyFiscalClosing(Base):
    """
    Registro de Cierre Fiscal Mensual y Facturación Electrónica Consolidada (Siigo -> DIAN)
    tanto para Conductores TEI RIDE como para Negocios Aliados (Comercios Aliados).
    Ejecutado automáticamente el último día de cada mes a las 23:00 horas (Hora Colombia).
    """
    __tablename__ = "monthly_fiscal_closings"

    id = Column(Integer, primary_key=True, index=True)
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    period_key = Column(String(16), nullable=False, index=True)  # Ej: "2026-10"

    entity_type = Column(String(32), nullable=False, index=True)  # "driver" o "merchant"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True, index=True)
    entity_name = Column(String(200), nullable=True)
    document_id = Column(String(64), nullable=True)
    city = Column(String(100), nullable=True, default="Bogotá")

    # Paso 1: Recaudo Bruto y Pasarela Wompi (2.65% + $700 COP por transacción)
    movements_count = Column(Integer, default=0)
    gateway_tx_count = Column(Integer, default=1)
    gross_collected_cop = Column(Float, default=0.0)
    wompi_fee_cop = Column(Float, default=0.0)
    net_after_gateway_cop = Column(Float, default=0.0)

    # Paso 2: Distribución a la Red de Vendedores / Comunidad de Consumidores (91.5%)
    # (50% Caja Fuerte / 50% Bolsa Fidelización TEI)
    network_91_5_cop = Column(Float, default=0.0)
    vault_50_cop = Column(Float, default=0.0)
    loyalty_bag_50_cop = Column(Float, default=0.0)

    # Paso 3: Ganancia Bruta Real de TEI (8.5% del remanente tras pasarela)
    tei_gross_8_5_cop = Column(Float, default=0.0)

    # Paso 4: Impuestos Corporativos sobre el 8.5% (IVA 19% DIAN + ICA Distrital 9.66x1000)
    tei_taxable_base_cop = Column(Float, default=0.0)
    iva_19_cop = Column(Float, default=0.0)
    ica_bogota_cop = Column(Float, default=0.0)

    # Paso 5: Impuesto de Renta DIAN (35%) y Utilidad Neta Final en Chequera TEI
    profit_before_tax_cop = Column(Float, default=0.0)
    income_tax_35_cop = Column(Float, default=0.0)
    net_profit_tei_cop = Column(Float, default=0.0)

    # Facturación Electrónica Siigo / DIAN
    legal_observations = Column(Text, nullable=True)
    siigo_status = Column(String(32), default="pending")  # "pending", "emitida", "simulada", "error"
    siigo_invoice_id = Column(String(100), nullable=True)
    cufe = Column(String(200), nullable=True)
    siigo_pdf_url = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
