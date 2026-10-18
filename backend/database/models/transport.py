from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..connection import Base

class VehicleType(str, enum.Enum):
    MOTO = "moto"
    CARRO = "carro"
    TAXI = "taxi"
    CAMION = "camion" # For legacy, though we add specific ones below
    MOTO_CARGA = "moto_carga"
    CARGA_LIVIANA = "carga_liviana"
    FURGON = "furgon"
    CAMION_PESADO = "camion_pesado"

class VehicleStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class TripStatus(str, enum.Enum):
    SEARCHING = "searching"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True) # One user has one vehicle (for now)
    
    type = Column(String(50), default=VehicleType.CARRO) # moto, carro, camion
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    color = Column(String(50), nullable=True)
    license_plate = Column(String(20), unique=True, index=True)
    
    # Optional fields for cargo
    cargo_capacity_kg = Column(Float, nullable=True)

    # Documentos subidos por el conductor
    selfie_url = Column(String(512), nullable=True)
    license_url = Column(String(512), nullable=True)
    property_card_url = Column(String(512), nullable=True)

    # Capturas de auditoría tomadas por el validador (Policía, Procuraduría, RUNT)
    police_record_capture_url = Column(String(512), nullable=True)
    procuraduria_capture_url = Column(String(512), nullable=True)
    runt_capture_url = Column(String(512), nullable=True)
    verifier_notes = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Status and validation
    status = Column(String(50), default=VehicleStatus.PENDING)
    is_active = Column(Boolean, default=False) # True when driver is online accepting trips
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", foreign_keys=[user_id], backref="vehicle")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    
    passenger_id = Column(Integer, ForeignKey("users.id"), index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Request details
    vehicle_type_requested = Column(String(50), default=VehicleType.CARRO)
    
    # Geography (Simplified for MVP, lat/lon stored as float)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    origin_address = Column(String(255), nullable=True)
    
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    destination_address = Column(String(255), nullable=True)
    
    distance_km = Column(Float, nullable=True)
    
    # Financials
    proposed_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=True)
    platform_fee = Column(Float, nullable=True) # The 15% commission
    driver_earnings = Column(Float, nullable=True) # Ganancia neta para el conductor
    payment_method = Column(String(50), default="cash") # "cash" (Efectivo) o "tei_bank" (Saldo Banco TEI)
    
    status = Column(String(50), default=TripStatus.SEARCHING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Ratings and Feedback
    driver_rating = Column(Integer, nullable=True) # Calificación al conductor (1-7 estrellas)
    passenger_rating = Column(Integer, nullable=True) # Calificación al pasajero (1-5 estrellas)
    driver_rating_comment = Column(String(255), nullable=True)
    passenger_rating_comment = Column(String(255), nullable=True)

    # Relationships
    passenger = relationship("User", foreign_keys=[passenger_id], backref="trips_as_passenger")
    driver = relationship("User", foreign_keys=[driver_id], backref="trips_as_driver")


class DriverLegalAudit(Base):
    """
    Registro de auditoría legal: prueba fehaciente de aceptación de Términos y Condiciones.
    Se guarda una fila por cada registro de conductor con metadatos de sesión para defensa legal.
    """
    __tablename__ = "driver_legal_audit"

    id = Column(Integer, primary_key=True, index=True)
    conductor_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    # Versión del documento legal aceptado (ej. "v1.0-2026")
    terms_version_accepted = Column(String(50), default="v1.0-2026", nullable=False)

    # Metadata de sesión para prueba fehaciente
    ip_address = Column(String(64), nullable=True)   # IP del cliente al momento de aceptar
    user_agent = Column(String(512), nullable=True)  # Navegador / dispositivo
    app_version = Column(String(50), default="web-1.0", nullable=False)

    # Declaraciones juradas marcadas (booleanos de cada checkbox)
    docs_declared_ok = Column(Boolean, default=False, nullable=False)   # Licencia/SOAT/RTM vigentes
    terms_accepted = Column(Boolean, default=False, nullable=False)     # T&C y Política de Datos

    # Timestamp preciso (milisegundos resolucion a nivel DB)
    accepted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    conductor = relationship("User", foreign_keys=[conductor_id], backref="legal_audit")


class DriverCredit(Base):
    """
    Registro del Cupo de Liquidez Operativa TEI para conductores.
    Modalidades:
    1. 'activation': Cupo de Bienvenida ($38.000 COP) para activación de radar.
    2. 'vault_backed': Cupo respaldado por Caja Fuerte o Escala de Confianza (hasta $77.000 COP).
    
    Estructura de Tarifas Operativas Fijas (Cero Intereses - Blindaje Legal):
    - Tarifa Fija de Gestión Operativa: $450 COP fijos por evento.
    - Plazo oportuno: 3 días corridos (0 a 72 horas). Total a pagar: Cupo + $450 COP.
    - Día 4 en adelante (73h+): Cargo Único de Normalización Operativa de $2.000 COP. Total a pagar: Cupo + $450 + $2.000 COP.
    - Escala de Confianza: +$4.500 COP por ciclo pagado a tiempo hasta tope de $77.000 COP.
    """
    __tablename__ = "driver_credits"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    credit_type = Column(String(50), default="activation") # "activation" o "vault_backed"
    
    principal_cop = Column(Float, nullable=False)
    principal_usd = Column(Float, nullable=False)
    
    admin_fee_cop = Column(Float, default=450.0) # Tarifa fija por gestión y activación ($450 COP)
    overdue_fee_cop = Column(Float, default=0.0) # Cargo único por normalización operativa ($2.000 COP si pasa al día 4)
    free_days = Column(Integer, default=3) # Plazo oportuno de 3 días (72h)
    
    interest_rate_daily = Column(Float, default=0.0) # 0% - Cero interés financiero
    
    status = Column(String(50), default="active") # "active", "paid"
    
    # Consumo operativo del cupo para comisiones TEI
    used_commission_cop = Column(Float, default=0.0) # Total debitado por comisiones de viajes en efectivo
    deadline_started_at = Column(DateTime, nullable=True) # Se activa cuando el saldo disponible del cupo queda en <= $5.000 COP

    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    days_elapsed = Column(Integer, default=0)
    interest_cop = Column(Float, default=0.0) # Suma de tarifas (admin_fee + overdue_fee)
    total_paid_cop = Column(Float, default=0.0)
    paid_via = Column(String(50), nullable=True) # "wallet_balance", "tei_bank", "wompi", "recharge_banco", "digital_trip"
    
    driver = relationship("User", foreign_keys=[driver_id], backref="driver_credits")

