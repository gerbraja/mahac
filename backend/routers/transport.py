from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..database.connection import get_db
from ..database.models.user import User
from ..database.models.transport import Vehicle, Trip, VehicleStatus, TripStatus, DriverLegalAudit, DriverCredit, VehicleType
from ..schemas.transport import VehicleCreate, VehicleResponse, TripCreate, TripResponse, TripAcceptRequest, DriverStatusUpdate, VehicleAuditUpdate, TripCounterOfferRequest, PassengerAcceptOfferRequest, PassengerRejectOfferRequest
from ..utils.auth import get_current_user_object as get_current_user
import math

import firebase_admin
from firebase_admin import credentials, db as firebase_db
import logging

router = APIRouter(prefix="/transport", tags=["Transport"])
logger = logging.getLogger(__name__)

import os
# Initialize Firebase Admin if not already initialized
if not firebase_admin._apps:
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cert_path = os.path.join(base_dir, 'database', 'firebase-key.json')
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred, options={
            'databaseURL': 'https://tei-transport-493e7-default-rtdb.firebaseio.com'
        })
        logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin: {e}")

from sqlalchemy import text

@router.get("/emergency-migrate")
def emergency_migrate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    results = {}
    migrations = [
        ("rating_avg", "ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_avg FLOAT DEFAULT 5.0;"),
        ("rating_count", "ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;"),
        ("driver_rating", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_rating INTEGER;"),
        ("passenger_rating", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_rating INTEGER;"),
        ("driver_rating_comment", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_rating_comment VARCHAR(255);"),
        ("passenger_rating_comment", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_rating_comment VARCHAR(255);"),
        ("payment_method", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';"),
        ("driver_earnings", "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_earnings FLOAT;"),
        ("driver_credits_used", "ALTER TABLE driver_credits ADD COLUMN IF NOT EXISTS used_commission_cop FLOAT DEFAULT 0.0;"),
        ("driver_credits_deadline", "ALTER TABLE driver_credits ADD COLUMN IF NOT EXISTS deadline_started_at TIMESTAMP NULL;")
    ]
    for col, query in migrations:
        try:
            db.execute(text(query))
            db.commit()
            results[col] = "migrated"
        except Exception as e:
            db.rollback()
            try:
                clean_q = query.replace("IF NOT EXISTS ", "")
                db.execute(text(clean_q))
                db.commit()
                results[col] = "migrated_fallback"
            except Exception as e2:
                db.rollback()
                results[col] = f"handled: {str(e2)[:60]}"

    return {"status": "finished", "results": results}


# --- Vehicle Endpoints ---

@router.post("/vehicle", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def register_vehicle(payload: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Register a new vehicle to become a driver """
    existing_vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).first()
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="User already has a registered vehicle.")
        
    plate_exists = db.query(Vehicle).filter(Vehicle.license_plate == payload.license_plate).first()
    if plate_exists:
        raise HTTPException(status_code=400, detail="License plate already registered.")

    vehicle = Vehicle(
        user_id=current_user.id,
        type=payload.type,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        color=payload.color,
        license_plate=payload.license_plate,
        cargo_capacity_kg=payload.cargo_capacity_kg,
        selfie_url=payload.selfie_url,
        license_url=payload.license_url,
        property_card_url=payload.property_card_url,
        status=VehicleStatus.PENDING # Requires manual admin approval in MVP
    )
    
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.post("/vehicle/accept-terms", status_code=status.HTTP_201_CREATED)
def accept_driver_terms(
    request: Request,
    docs_declared_ok: bool,
    terms_accepted: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registra la aceptación legal del conductor en la tabla de auditoría.
    Debe llamarse ANTES de registrar el vehículo.
    Guarda: conductor_id, timestamp, ip_address, user_agent, checkboxes marcados.
    """
    if not docs_declared_ok or not terms_accepted:
        raise HTTPException(
            status_code=400,
            detail="El conductor debe aceptar ambas declaraciones obligatorias."
        )

    # Capturar IP real (considera proxies/Cloud Run)
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "unknown")
    user_agent = request.headers.get("User-Agent", "unknown")

    audit = DriverLegalAudit(
        conductor_id=current_user.id,
        terms_version_accepted="v1.0-2026",
        ip_address=ip_address,
        user_agent=user_agent,
        app_version="web-1.0",
        docs_declared_ok=docs_declared_ok,
        terms_accepted=terms_accepted,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return {
        "message": "Aceptación registrada exitosamente.",
        "audit_id": audit.id,
        "accepted_at": audit.accepted_at.isoformat(),
        "terms_version": audit.terms_version_accepted,
    }

@router.get("/vehicle/me", response_model=VehicleResponse)
def get_my_vehicle(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Get current user's registered vehicle """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return vehicle

@router.post("/vehicle/status")
def update_driver_status(payload: DriverStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Update driver online/offline status """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
        
    vehicle.is_active = payload.is_online
    db.commit()
    return {"message": "Status updated", "is_online": vehicle.is_active}


# --- Weather Condition Endpoint (Rain surge 1.30x) ---
@router.get("/weather-multiplier")
def get_weather_multiplier(lat: float, lon: float):
    """
    Checks active precipitation at the given coordinates using Open-Meteo API (or OpenWeatherMap if key is set).
    Returns rain active boolean and multiplier (1.30x if rain/precipitation detected, else 1.0x).
    """
    import urllib.request
    import json

    openweather_key = os.getenv("OPENWEATHER_API_KEY")
    is_raining = False
    details = ""

    if openweather_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={openweather_key}"
            req = urllib.request.Request(url, headers={'User-Agent': 'TEI-Transport/1.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode())
                # OpenWeather weather ids 200-531 indicate thunderstorm, drizzle, rain
                weather_ids = [w.get("id", 0) for w in data.get("weather", [])]
                is_raining = any(200 <= wid < 600 for wid in weather_ids) or "rain" in data
                details = data.get("weather", [{}])[0].get("description", "")
        except Exception as e:
            logger.warning(f"Error querying OpenWeatherMap: {e}")

    # Fallback / Direct open high-precision meteorological service if no OpenWeather key or error
    if not openweather_key or not is_raining:
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation,rain,showers,weather_code"
            req = urllib.request.Request(url, headers={'User-Agent': 'TEI-Transport/1.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode())
                curr = data.get("current", {})
                precip = float(curr.get("precipitation", 0) or 0)
                rain = float(curr.get("rain", 0) or 0)
                showers = float(curr.get("showers", 0) or 0)
                wcode = int(curr.get("weather_code", 0) or 0)
                # WMO Codes: 51-67 drizzle/rain, 80-82 rain showers, 95-99 thunderstorms
                wmo_rain = (51 <= wcode <= 67) or (80 <= wcode <= 82) or (95 <= wcode <= 99)
                if precip > 0.1 or rain > 0.1 or showers > 0.1 or wmo_rain:
                    is_raining = True
                    details = f"Precipitación activa detectada ({precip}mm)"
                else:
                    details = "Clima despejado / sin lluvia"
        except Exception as e:
            logger.warning(f"Error querying weather fallback: {e}")
            details = "Sin datos meteorológicos"

    multiplier = 1.30 if is_raining else 1.00
    return {
        "is_raining": is_raining,
        "multiplier": multiplier,
        "details": details,
        "lat": lat,
        "lon": lon
    }


# --- Passenger Balance & Escrow ---
@router.get("/passenger-balance")
def get_passenger_balance(current_user: User = Depends(get_current_user)):
    """ Returns current passenger available bank balance and loyalty bag balance in USD and COP """
    EXCHANGE_RATE = 4500.0
    banco_usd = float(current_user.verified_balance or 0.0)
    banco_cop = round(banco_usd * EXCHANGE_RATE)
    loyalty_usd = float(current_user.purchase_balance or 0.0)
    loyalty_cop = round(loyalty_usd * EXCHANGE_RATE)
    
    return {
        "available_balance_usd": round(banco_usd, 2),
        "available_balance_cop": banco_cop,
        "loyalty_balance_usd": round(loyalty_usd, 2),
        "loyalty_balance_cop": loyalty_cop,
        "detail": {
            "banco_tei": round(banco_usd, 2),
            "bolsa_fidelizacion_tei": round(loyalty_usd, 2),
            "caja_fuerte": round(float(current_user.bank_balance or 0.0), 2)
        },
        "is_kyc_verified": getattr(current_user, 'is_kyc_verified', False) or False,
        "user_id": current_user.id,
        "username": current_user.username,
        "name": current_user.name or current_user.username,
        "is_authenticated": True
    }


# --- Trip / Passenger Endpoints ---

@router.post("/trip", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def request_trip(payload: TripCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Passenger requests a new trip (Auction broadcast) """
    
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    user_name = current_user.username if hasattr(current_user, 'username') else current_user.get('username')
    
    unique_user_id = f"TEI-USER-{user_id}"
    
    method = (payload.payment_method or "cash").lower()
    EXCHANGE_RATE = 4500.0
    
    # Si paga con Saldo Banco TEI, validar saldo y retener en garantía (Escrow) de verified_balance
    if method == "tei_bank":
        fare_usd = payload.proposed_price / EXCHANGE_RATE
        banco_usd = float(current_user.verified_balance or 0.0)
        
        if banco_usd < fare_usd:
            banco_cop = round(banco_usd * EXCHANGE_RATE)
            raise HTTPException(
                status_code=400,
                detail=f"Saldo en Banco TEI insuficiente para pagar este viaje digitalmente. "
                       f"Tienes ${banco_cop:,.0f} COP (${banco_usd:.2f} USD) en Banco TEI y el viaje cuesta ${payload.proposed_price:,.0f} COP."
            )
            
        # Retención en garantía (Escrow) del Saldo Banco TEI
        current_user.verified_balance = round(banco_usd - fare_usd, 4)

    # Si paga con Bolsa de Fidelización TEI, validar saldo y retener en garantía (Escrow) de purchase_balance
    elif method == "loyalty_bag":
        fare_usd = payload.proposed_price / EXCHANGE_RATE
        loyalty_usd = float(current_user.purchase_balance or 0.0)
        
        if loyalty_usd < fare_usd:
            loyalty_cop = round(loyalty_usd * EXCHANGE_RATE)
            raise HTTPException(
                status_code=400,
                detail=f"Saldo en Bolsa de Fidelización TEI insuficiente para pagar este viaje. "
                       f"Tienes ${loyalty_cop:,.0f} COP (${loyalty_usd:.2f} USD) en tu Bolsa de Fidelización y el viaje cuesta ${payload.proposed_price:,.0f} COP."
            )
            
        # Retención en garantía (Escrow) de la Bolsa de Fidelización TEI
        current_user.purchase_balance = round(loyalty_usd - fare_usd, 4)
    
    trip = Trip(
        passenger_id=user_id,
        vehicle_type_requested=payload.vehicle_type_requested,
        origin_lat=payload.origin_lat,
        origin_lon=payload.origin_lon,
        origin_address=payload.origin_address,
        destination_lat=payload.destination_lat,
        destination_lon=payload.destination_lon,
        destination_address=payload.destination_address,
        distance_km=getattr(payload, 'distance_km', 0.0),
        proposed_price=payload.proposed_price,
        payment_method=method,
        status=TripStatus.SEARCHING
    )
    
    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    # Trigger Firebase event to notify drivers nearby
    try:
        ref = firebase_db.reference('trips/active')
        
        if trip.payment_method == "tei_bank":
            payment_label = "Digital TEI (Saldo Banco)"
        elif trip.payment_method == "loyalty_bag":
            payment_label = "Digital TEI (Bolsa Fidelización)"
        else:
            payment_label = "Efectivo"

        firebase_payload = {
            "id": trip.id,
            "passenger": f"{user_name} ({unique_user_id})" if user_name else unique_user_id,
            "passenger_id": unique_user_id,
            "passenger_phone": getattr(current_user, 'phone', '') or '',
            "origin": payload.origin_address,
            "destination": payload.destination_address,
            "price": payload.proposed_price,
            "payment_method": trip.payment_method,
            "payment_label": payment_label,
            "status": "searching",
            "distance_km": getattr(payload, 'distance_km', 0.0) or 0,
            "time_mins": 0,
            "lat": payload.origin_lat,
            "lng": payload.origin_lon,
            "dest_lat": payload.destination_lat,
            "dest_lng": payload.destination_lon,
            "vehicle_type": payload.vehicle_type_requested,
            "created_at": datetime.utcnow().isoformat()
        }
        
        ref.child(str(trip.id)).set(firebase_payload)
    except Exception as e:
        logger.error(f"Failed to push trip to Firebase: {e}")
    
    return trip


@router.get("/trip/current")
def get_current_trip(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the most recent active or recently completed (unrated) trip for the current user.
    Enables re-attachment when switching to WhatsApp or reloading the browser.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    
    # 1. Look for active trip as passenger
    trip = db.query(Trip).filter(
        Trip.passenger_id == user_id,
        Trip.status.in_([TripStatus.SEARCHING, TripStatus.ASSIGNED, TripStatus.IN_PROGRESS])
    ).order_by(Trip.created_at.desc()).first()
    
    # 2. Check for recently completed trip (last 30 min) to show rating screen
    recently_completed = False
    if not trip:
        threshold = datetime.utcnow() - timedelta(minutes=30)
        recent_trip = db.query(Trip).filter(
            Trip.passenger_id == user_id,
            Trip.status == TripStatus.COMPLETED,
            Trip.driver_rating.is_(None),
            Trip.completed_at >= threshold
        ).order_by(Trip.completed_at.desc()).first()
        
        if recent_trip:
            trip = recent_trip
            recently_completed = True
            
    if not trip:
        return {"active": False, "trip": None}
        
    driver_user = db.query(User).filter(User.id == trip.driver_id).first() if trip.driver_id else None
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == trip.driver_id).first() if trip.driver_id else None
    
    return {
        "active": True,
        "recently_completed": recently_completed,
        "trip": {
            "id": trip.id,
            "status": trip.status,
            "origin_address": trip.origin_address,
            "origin_lat": trip.origin_lat,
            "origin_lon": trip.origin_lon,
            "destination_address": trip.destination_address,
            "destination_lat": trip.destination_lat,
            "destination_lon": trip.destination_lon,
            "proposed_price": trip.proposed_price,
            "final_price": trip.final_price or trip.proposed_price,
            "payment_method": getattr(trip, 'payment_method', 'cash') or 'cash',
            "driver_earnings": getattr(trip, 'driver_earnings', None),
            "vehicle_type": trip.vehicle_type_requested,
            "driver_id": trip.driver_id,
            "driver_name": (driver_user.name or driver_user.username) if driver_user else "Conductor TEI",
            "driver_phone": driver_user.phone if driver_user else None,
            "vehicle_plate": vehicle.license_plate if vehicle else None,
            "vehicle_model": f"{vehicle.brand or ''} {vehicle.model or ''}".strip() if vehicle else None,
            "vehicle_color": vehicle.color if vehicle else None
        }
    }


# --- Trip / Driver Endpoints ---

@router.post("/trip/accept", response_model=TripResponse)
def accept_trip(payload: TripAcceptRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver accepts or counter-offers a trip """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user_id).first()
    if not vehicle or vehicle.status != VehicleStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Must have an approved vehicle to accept trips.")
        
    trip = db.query(Trip).filter(Trip.id == payload.trip_id).with_for_update().first() # Lock the row
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if trip.status != TripStatus.SEARCHING:
        raise HTTPException(status_code=400, detail="Trip is no longer available.")
        
    if trip.passenger_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own trip.")
        
    # Determine commission percentage:
    # Para Carga: 15% para trayectos urbanos (<= 35km) y 9% para trayectos intermunicipales (> 35km o intermunicipal).
    # Para otros vehículos (carro, moto, taxi): 15% estándar.
    is_cargo = trip.vehicle_type_requested in [
        VehicleType.CAMION, VehicleType.MOTO_CARGA, VehicleType.CARGA_LIVIANA,
        VehicleType.FURGON, VehicleType.CAMION_PESADO, 'camion', 'moto_carga',
        'carga_liviana', 'furgon', 'camion_pesado'
    ]
    dist_km = trip.distance_km or 0.0
    if is_cargo and dist_km > 35.0:
        commission_rate = 0.09 # 9% Intermunicipal para Carga
    else:
        commission_rate = 0.15 # 15% Urbano estándar

    trip.driver_id = current_user.id
    trip.status = TripStatus.ASSIGNED
    trip.final_price = payload.counter_offer if payload.counter_offer else trip.proposed_price
    trip.platform_fee = trip.final_price * commission_rate
    trip.driver_earnings = trip.final_price - trip.platform_fee
    
    EXCHANGE_RATE = 4500.0
    is_digital = (trip.payment_method in ["tei_bank", "loyalty_bag"])

    if is_digital:
        # En viaje digital con Saldo Banco TEI o Bolsa de Fidelización TEI:
        # El pasajero depositó inicialmente la tarifa propuesta en custodia (Escrow).
        # Si hubo una contraoferta aceptada con un valor diferente, ajustar la diferencia de custodia:
        if payload.counter_offer and payload.counter_offer != trip.proposed_price:
            passenger = db.query(User).filter(User.id == trip.passenger_id).first()
            if passenger:
                diff_cop = payload.counter_offer - trip.proposed_price
                diff_usd = diff_cop / EXCHANGE_RATE
                if trip.payment_method == "loyalty_bag":
                    current_passenger_usd = float(passenger.purchase_balance or 0.0)
                    if diff_cop > 0:
                        if current_passenger_usd < diff_usd:
                            raise HTTPException(
                                status_code=400,
                                detail="El pasajero no cuenta con saldo suficiente en su Bolsa de Fidelización TEI para cubrir esta contraoferta."
                            )
                        passenger.purchase_balance = round(current_passenger_usd - diff_usd, 4)
                    else:
                        passenger.purchase_balance = round(current_passenger_usd + abs(diff_usd), 4)
                else:
                    current_passenger_usd = float(passenger.verified_balance or 0.0)
                    if diff_cop > 0:
                        if current_passenger_usd < diff_usd:
                            raise HTTPException(
                                status_code=400,
                                detail="El pasajero no cuenta con saldo suficiente en Banco TEI para cubrir esta contraoferta."
                            )
                        passenger.verified_balance = round(current_passenger_usd - diff_usd, 4)
                    else:
                        passenger.verified_balance = round(current_passenger_usd + abs(diff_usd), 4)
        # El conductor NO paga comisión por adelantado de su saldo disponible.
        # Al finalizar el viaje, el sistema liquidará la tarifa reteniendo la comisión y transfiriendo
        # la ganancia neta directamente a la Billetera del Conductor.
    else:
        # En viaje en EFECTIVO:
        # El conductor recibe el 100% en efectivo de mano del pasajero, por lo que cubre la comisión de plataforma.
        fee_required_cop = trip.platform_fee
        fee_required_usd = fee_required_cop / EXCHANGE_RATE

        # 1. Verificar si el conductor tiene Cupo de Confianza activo
        active_driver_credit = db.query(DriverCredit).filter(
            DriverCredit.driver_id == current_user.id,
            DriverCredit.status == "active"
        ).first()

        # Si el cupo está en mora (Normalización Operativa Día 4+), no puede tomar viajes
        if active_driver_credit and active_driver_credit.deadline_started_at:
            diff_sec = (datetime.utcnow() - active_driver_credit.deadline_started_at).total_seconds()
            days_elapsed_cr = max(1, math.ceil(diff_sec / 86400))
            if days_elapsed_cr >= 4:
                db.rollback()
                raise HTTPException(
                    status_code=403,
                    detail=f"Tu cuenta presenta un cupo operativo en Normalización Operativa (Día {days_elapsed_cr}). Por favor liquida tu cupo pendiente para reactivar el radar."
                )

        if active_driver_credit:
            # Descontar del cupo de respaldo
            active_driver_credit.used_commission_cop = (active_driver_credit.used_commission_cop or 0.0) + fee_required_cop
            remaining_cupo = max(0.0, active_driver_credit.principal_cop - active_driver_credit.used_commission_cop)
            
            # Si el saldo disponible del cupo queda en <= $5.000 COP, arranca el reloj de 3 días
            if remaining_cupo <= 5000.0 and not active_driver_credit.deadline_started_at:
                active_driver_credit.deadline_started_at = datetime.utcnow()

            driver_earnings_cop = trip.final_price - trip.platform_fee
            driver_earnings_usd = driver_earnings_cop / EXCHANGE_RATE
            current_user.total_earnings = (current_user.total_earnings or 0) + driver_earnings_usd
            current_user.monthly_earnings = (current_user.monthly_earnings or 0) + driver_earnings_usd
        else:
            # 2. Si no tiene cupo activo, descuenta de su saldo disponible en Billetera (+ crédito por antigüedad si aplica)
            dias_antiguedad = (datetime.utcnow() - current_user.created_at).days
            limite_credito = 0.0
            if dias_antiguedad >= 30:
                limite_credito = (current_user.total_earnings or 0.0) * 0.70
                
            saldo_total_poder_adquisitivo = (current_user.available_balance or 0.0) + limite_credito
            
            if saldo_total_poder_adquisitivo < fee_required_usd:
                db.rollback()
                raise HTTPException(
                    status_code=402, 
                    detail=f"Saldo insuficiente para comisiones. Comisión requerida: ${fee_required_cop:,.0f} COP. "
                           f"Activa tu Cupo de Respaldo de $38.000 COP o recarga vía Wompi/Banco TEI."
                )
                
            current_user.available_balance = (current_user.available_balance or 0.0) - fee_required_usd
            driver_earnings_cop = trip.final_price - trip.platform_fee
            driver_earnings_usd = driver_earnings_cop / EXCHANGE_RATE
            current_user.total_earnings = (current_user.total_earnings or 0) + driver_earnings_usd
            current_user.monthly_earnings = (current_user.monthly_earnings or 0) + driver_earnings_usd
    
    db.commit()
    db.refresh(trip)
    
    # --- ACTUALIZAR FIREBASE ---
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).first()
        driver_phone = current_user.phone or getattr(current_user, 'whatsapp', '') or ''
        
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        # Update the status so the passenger and other drivers know it's accepted
        ref.update({
            "status": "accepted",
            "driver_id": current_user.id,
            "driver_name": current_user.name or current_user.username or "Conductor TEI",
            "driver_phone": driver_phone,
            "vehicle_plate": vehicle.license_plate if vehicle else "",
            "vehicle_model": f"{vehicle.brand or ''} {vehicle.model or ''}".strip() if vehicle else "",
            "vehicle_color": vehicle.color if vehicle else "",
            "vehicle_type": vehicle.type if vehicle else "carro",
            "final_price": trip.final_price,
            "payment_method": trip.payment_method or "cash",
            "driver_earnings": trip.driver_earnings
        })
        ref.child("offers").delete()
    except Exception as e:
        logger.error(f"Failed to update trip {trip.id} in Firebase: {e}")
        
    return trip


@router.post("/trip/counter-offer")
def make_counter_offer(payload: TripCounterOfferRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver submits an auction counter-offer for the passenger to accept or reject """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user_id).first()
    if not vehicle or vehicle.status != VehicleStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Debes tener un vehículo aprobado para ofertar.")
        
    trip = db.query(Trip).filter(Trip.id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado.")
        
    if trip.status != TripStatus.SEARCHING:
        raise HTTPException(status_code=400, detail="El viaje ya no está disponible.")
        
    if trip.passenger_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes ofertar en tu propio viaje.")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="El valor de la contraoferta debe ser mayor a 0.")

    EXCHANGE_RATE = 4500.0
    if trip.payment_method in ["tei_bank", "loyalty_bag"] and payload.amount > trip.proposed_price:
        passenger = db.query(User).filter(User.id == trip.passenger_id).first()
        diff_usd = (payload.amount - trip.proposed_price) / EXCHANGE_RATE
        if trip.payment_method == "loyalty_bag":
            if float(passenger.purchase_balance or 0.0) < diff_usd:
                raise HTTPException(
                    status_code=400,
                    detail="El pasajero no cuenta con saldo adicional suficiente en su Bolsa de Fidelización TEI para cubrir esta contraoferta."
                )
        else:
            if float(passenger.verified_balance or 0.0) < diff_usd:
                raise HTTPException(
                    status_code=400,
                    detail="El pasajero no cuenta con saldo adicional suficiente en Banco TEI para cubrir esta contraoferta."
                )

    driver_name = current_user.name or current_user.username or "Conductor TEI"
    driver_phone = current_user.phone or getattr(current_user, 'whatsapp', '') or ''
    rating_val = round(float(getattr(current_user, 'rating_avg', 5.0) or 5.0), 1)

    offer_data = {
        "driver_id": current_user.id,
        "driver_name": driver_name,
        "driver_phone": driver_phone,
        "rating": rating_val,
        "vehicle_type": vehicle.type or "carro",
        "vehicle_brand": vehicle.brand or "",
        "vehicle_model": vehicle.model or "",
        "vehicle_color": vehicle.color or "",
        "vehicle_plate": vehicle.license_plate or "",
        "price": payload.amount,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}/offers/{current_user.id}')
        ref.set(offer_data)
    except Exception as e:
        logger.error(f"Error guardando contraoferta en Firebase: {e}")
        raise HTTPException(status_code=500, detail="No se pudo publicar la oferta en el radar.")

    return {"message": "Contraoferta enviada al pasajero", "offer": offer_data}


@router.post("/trip/{trip_id}/withdraw-offer")
def withdraw_offer(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver withdraws their pending counter-offer """
    try:
        ref = firebase_db.reference(f'trips/active/{trip_id}/offers/{current_user.id}')
        ref.delete()
    except Exception as e:
        logger.error(f"Error retirando oferta en Firebase: {e}")
    return {"message": "Contraoferta retirada exitosamente"}


@router.post("/trip/passenger-accept-offer")
def passenger_accept_offer(payload: PassengerAcceptOfferRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Passenger accepts a driver's counter-offer from the auction """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    trip = db.query(Trip).filter(Trip.id == payload.trip_id).with_for_update().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado.")

    if trip.passenger_id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado para aceptar ofertas en este viaje.")

    if trip.status != TripStatus.SEARCHING:
        raise HTTPException(status_code=400, detail="El viaje ya no está disponible.")

    driver = db.query(User).filter(User.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Conductor no encontrado.")

    vehicle = db.query(Vehicle).filter(Vehicle.user_id == driver.id).first()
    if not vehicle or vehicle.status != VehicleStatus.APPROVED:
        raise HTTPException(status_code=400, detail="El vehículo del conductor no está aprobado.")

    is_cargo = trip.vehicle_type_requested in [
        VehicleType.CAMION, VehicleType.MOTO_CARGA, VehicleType.CARGA_LIVIANA,
        VehicleType.FURGON, VehicleType.CAMION_PESADO, 'camion', 'moto_carga',
        'carga_liviana', 'furgon', 'camion_pesado'
    ]
    dist_km = trip.distance_km or 0.0
    commission_rate = 0.09 if (is_cargo and dist_km > 35.0) else 0.15

    trip.driver_id = driver.id
    trip.status = TripStatus.ASSIGNED
    trip.final_price = payload.price
    trip.platform_fee = trip.final_price * commission_rate
    trip.driver_earnings = trip.final_price - trip.platform_fee

    EXCHANGE_RATE = 4500.0
    is_digital = (trip.payment_method in ["tei_bank", "loyalty_bag"])

    if is_digital:
        price_diff = payload.price - trip.proposed_price
        if trip.payment_method == "loyalty_bag":
            if price_diff > 0:
                diff_usd = price_diff / EXCHANGE_RATE
                if float(current_user.purchase_balance or 0.0) < diff_usd:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail="Saldo insuficiente en Bolsa de Fidelización TEI para cubrir el valor de esta contraoferta."
                    )
                current_user.purchase_balance = round(float(current_user.purchase_balance or 0.0) - diff_usd, 4)
            elif price_diff < 0:
                diff_usd = abs(price_diff) / EXCHANGE_RATE
                current_user.purchase_balance = round(float(current_user.purchase_balance or 0.0) + diff_usd, 4)
        else:
            if price_diff > 0:
                diff_usd = price_diff / EXCHANGE_RATE
                if float(current_user.verified_balance or 0.0) < diff_usd:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail="Saldo insuficiente en Banco TEI para cubrir el valor de esta contraoferta."
                    )
                current_user.verified_balance = round(float(current_user.verified_balance or 0.0) - diff_usd, 4)
            elif price_diff < 0:
                diff_usd = abs(price_diff) / EXCHANGE_RATE
                current_user.verified_balance = round(float(current_user.verified_balance or 0.0) + diff_usd, 4)
    else:
        fee_required_cop = trip.platform_fee
        fee_required_usd = fee_required_cop / EXCHANGE_RATE

        # 1. Verificar si el conductor tiene Cupo de Confianza activo
        active_driver_credit = db.query(DriverCredit).filter(
            DriverCredit.driver_id == driver.id,
            DriverCredit.status == "active"
        ).first()

        # Si el cupo está en mora (Normalización Operativa Día 4+), no puede tomar viajes
        if active_driver_credit and active_driver_credit.deadline_started_at:
            diff_sec = (datetime.utcnow() - active_driver_credit.deadline_started_at).total_seconds()
            days_elapsed_cr = max(1, math.ceil(diff_sec / 86400))
            if days_elapsed_cr >= 4:
                db.rollback()
                raise HTTPException(
                    status_code=403,
                    detail=f"El conductor presenta un cupo operativo en Normalización Operativa (Día {days_elapsed_cr}). No puede tomar viajes hasta liquidar."
                )

        if active_driver_credit:
            # Descontar del cupo de respaldo
            active_driver_credit.used_commission_cop = (active_driver_credit.used_commission_cop or 0.0) + fee_required_cop
            remaining_cupo = max(0.0, active_driver_credit.principal_cop - active_driver_credit.used_commission_cop)
            
            # Si el saldo disponible del cupo queda en <= $5.000 COP, arranca el reloj de 3 días
            if remaining_cupo <= 5000.0 and not active_driver_credit.deadline_started_at:
                active_driver_credit.deadline_started_at = datetime.utcnow()

            driver_earnings_cop = trip.final_price - trip.platform_fee
            driver_earnings_usd = driver_earnings_cop / EXCHANGE_RATE
            driver.total_earnings = (driver.total_earnings or 0.0) + driver_earnings_usd
            driver.monthly_earnings = (driver.monthly_earnings or 0.0) + driver_earnings_usd
        else:
            dias_antiguedad = (datetime.utcnow() - driver.created_at).days
            limite_credito = 0.0
            if dias_antiguedad >= 30:
                limite_credito = (driver.total_earnings or 0.0) * 0.70

            saldo_total_poder_adquisitivo = (driver.available_balance or 0.0) + limite_credito

            if saldo_total_poder_adquisitivo < fee_required_usd:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="El conductor no cuenta con saldo disponible suficiente para la comisión de este viaje en efectivo."
                )

            driver.available_balance = (driver.available_balance or 0.0) - fee_required_usd
            driver_earnings_usd = trip.driver_earnings / EXCHANGE_RATE
            driver.total_earnings = (driver.total_earnings or 0.0) + driver_earnings_usd
            driver.monthly_earnings = (driver.monthly_earnings or 0.0) + driver_earnings_usd

    db.commit()
    db.refresh(trip)

    # Actualizar Firebase
    try:
        driver_phone = driver.phone or getattr(driver, 'whatsapp', '') or ''
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({
            "status": "accepted",
            "driver_id": driver.id,
            "driver_name": driver.name or driver.username or "Conductor TEI",
            "driver_phone": driver_phone,
            "vehicle_plate": vehicle.license_plate if vehicle else "",
            "vehicle_model": f"{vehicle.brand or ''} {vehicle.model or ''}".strip() if vehicle else "",
            "vehicle_color": vehicle.color if vehicle else "",
            "vehicle_type": vehicle.type if vehicle else "carro",
            "final_price": trip.final_price,
            "payment_method": trip.payment_method or "cash",
            "driver_earnings": trip.driver_earnings
        })
        ref.child("offers").delete()
    except Exception as e:
        logger.error(f"Error actualizando Firebase al aceptar contraoferta: {e}")

    return {
        "message": "Oferta aceptada y viaje iniciado exitosamente",
        "trip_id": trip.id,
        "driver_id": driver.id,
        "final_price": trip.final_price
    }


@router.post("/trip/passenger-reject-offer")
def passenger_reject_offer(payload: PassengerRejectOfferRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Passenger rejects a driver's counter-offer """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    trip = db.query(Trip).filter(Trip.id == payload.trip_id).first()
    if not trip or trip.passenger_id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado.")

    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}/offers/{payload.driver_id}')
        ref.update({"status": "rejected"})
    except Exception as e:
        logger.error(f"Error rechazando oferta en Firebase: {e}")

    return {"message": "Contraoferta rechazada"}


@router.post("/trip/{trip_id}/start", status_code=status.HTTP_200_OK)
def start_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver starts the trip (passenger on board) """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    if trip.status != TripStatus.ASSIGNED:
        raise HTTPException(status_code=400, detail="Trip must be assigned to start.")
        
    trip.status = TripStatus.IN_PROGRESS
    db.commit()
    
    # Update Firebase
    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({"status": "in_progress"})
    except Exception as e:
        logger.error(f"Failed to update Firebase for start: {e}")
        
    return {"message": "Trip started successfully"}



@router.post("/trip/{trip_id}/finish", status_code=status.HTTP_200_OK)
def finish_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver finishes the trip and triggers financial settlement + 91.5% MLM distribution (50% Caja Fuerte / 50% Bolsa Fidelizacion TEI) """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to finish this trip.")
        
    if trip.status != TripStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Trip is not in progress.")
        
    is_cargo = trip.vehicle_type_requested in [
        VehicleType.CAMION, VehicleType.MOTO_CARGA, VehicleType.CARGA_LIVIANA,
        VehicleType.FURGON, VehicleType.CAMION_PESADO, 'camion', 'moto_carga',
        'carga_liviana', 'furgon', 'camion_pesado'
    ]
    dist_km = trip.distance_km or 0.0
    commission_rate = 0.09 if (is_cargo and dist_km > 35.0) else 0.15
    
    final_price = trip.final_price or trip.proposed_price or 0.0
    platform_fee = final_price * commission_rate
    driver_net_earnings = final_price - platform_fee
    
    trip.final_price = final_price
    trip.platform_fee = platform_fee
    trip.driver_earnings = driver_net_earnings
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()
    
    driver = db.query(User).filter(User.id == trip.driver_id).first()
    passenger = db.query(User).filter(User.id == trip.passenger_id).first()
    EXCHANGE_RATE = 4500.0
    
    settlement = {}
    is_digital = (trip.payment_method in ["tei_bank", "loyalty_bag"])

    # Distribuir el 91.5% de la comisión de plataforma en todos los planes de compensación:
    # 50% a Caja Fuerte (bank_balance) y 50% a Bolsa de Fidelización TEI (purchase_balance)
    try:
        from backend.database.models.physical_transaction import PhysicalTransaction
        from backend.mlm.services.physical_commission_service import distribute_physical_commissions
        virtual_tx = PhysicalTransaction(
            user_id=trip.passenger_id,
            merchant_id=None,
            sale_amount=final_price,
            commission_margin=round(commission_rate * 100, 2),
            commission_amount=platform_fee,
            status='completed'
        )
        db.add(virtual_tx)
        db.flush()
        distribute_physical_commissions(db, virtual_tx, driver_id=trip.driver_id)
    except Exception as mlm_err:
        logger.warning(f"[TRANSPORT MLM ERROR] En viaje {trip.id}: {mlm_err}")

    if is_digital:
        # Acreditación de Ganancia Neta a la Billetera del Conductor (tanto Banco TEI como Bolsa Fidelización TEI son efectivo disponible para el taxista/conductor)
        prev_driver_usd = driver.available_balance or 0.0
        prev_driver_cop = round(prev_driver_usd * EXCHANGE_RATE)
        
        net_usd = driver_net_earnings / EXCHANGE_RATE
        driver.available_balance = prev_driver_usd + net_usd
        driver.total_earnings = (driver.total_earnings or 0.0) + net_usd
        driver.monthly_earnings = (driver.monthly_earnings or 0.0) + net_usd
        
        new_driver_usd = driver.available_balance
        new_driver_cop = round(new_driver_usd * EXCHANGE_RATE)
            
        settlement = {
            "trip_id": trip.id,
            "payment_method": trip.payment_method,
            "is_digital": True,
            "total_fare": final_price,
            "platform_fee_percent": int(commission_rate * 100),
            "platform_fee": platform_fee,
            "driver_net_earnings": driver_net_earnings,
            "previous_balance_cop": prev_driver_cop,
            "new_balance_cop": new_driver_cop,
            "passenger_name": (passenger.name or passenger.username) if passenger else "Pasajero TEI",
            "passenger_id": trip.passenger_id,
            "timestamp": int(datetime.utcnow().timestamp()),
            "timestamp_iso": datetime.utcnow().isoformat()
        }
    else:
        # Liquidación para viaje en efectivo
        settlement = {
            "trip_id": trip.id,
            "payment_method": "cash",
            "is_digital": False,
            "total_fare": final_price,
            "platform_fee_percent": int(commission_rate * 100),
            "platform_fee": platform_fee,
            "driver_net_earnings": driver_net_earnings,
            "cash_to_collect": final_price,
            "passenger_name": (passenger.name or passenger.username) if passenger else "Pasajero TEI",
            "passenger_id": trip.passenger_id,
            "timestamp": int(datetime.utcnow().timestamp()),
            "timestamp_iso": datetime.utcnow().isoformat()
        }
    
    db.commit()
    
    # Actualizar Firebase
    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({
            "status": "completed",
            "settlement": settlement
        })
        
        # Notificación y Banner persistente para el Conductor (mínimo 20 minutos)
        if trip.driver_id:
            driver_settle_ref = firebase_db.reference(f'drivers/recent_settlements/{trip.driver_id}')
            driver_settle_ref.set(settlement)
    except Exception as e:
        logger.error(f"Failed to update Firebase on trip finish: {e}")
        
    return {"message": "Trip finished successfully", "settlement": settlement}


@router.post("/trip/{trip_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Passenger or Driver cancels the trip. Refunds escrow to passenger (if tei_bank or loyalty_bag) or commission to driver (if cash). """
    trip = db.query(Trip).filter(Trip.id == trip_id).with_for_update().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if current_user.id not in [trip.passenger_id, trip.driver_id]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    if trip.status in [TripStatus.COMPLETED, TripStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Trip is already finished or cancelled.")
        
    was_assigned = (trip.status == TripStatus.ASSIGNED)
    driver_id = trip.driver_id
    platform_fee_cop = trip.platform_fee
    EXCHANGE_RATE = 4500.0
    
    trip.status = TripStatus.CANCELLED
    
    # 1. Reembolso al Pasajero si pagó con Saldo Banco TEI o Bolsa de Fidelización TEI
    if trip.payment_method == "tei_bank":
        passenger = db.query(User).filter(User.id == trip.passenger_id).first()
        if passenger:
            fare_usd = (trip.final_price or trip.proposed_price or 0.0) / EXCHANGE_RATE
            passenger.verified_balance = round((passenger.verified_balance or 0.0) + fare_usd, 4)
    elif trip.payment_method == "loyalty_bag":
        passenger = db.query(User).filter(User.id == trip.passenger_id).first()
        if passenger:
            fare_usd = (trip.final_price or trip.proposed_price or 0.0) / EXCHANGE_RATE
            passenger.purchase_balance = round((passenger.purchase_balance or 0.0) + fare_usd, 4)
            
    # 2. Reembolso al Conductor si era viaje en efectivo y se le había debitado la comisión
    elif was_assigned and driver_id and platform_fee_cop:
        driver = db.query(User).filter(User.id == driver_id).first()
        if driver:
            fee_usd = platform_fee_cop / EXCHANGE_RATE
            driver.available_balance += fee_usd
            driver_earnings_cop = trip.final_price - trip.platform_fee
            driver_earnings_usd = driver_earnings_cop / EXCHANGE_RATE
            driver.total_earnings = max(0, (driver.total_earnings or 0) - driver_earnings_usd)
            driver.monthly_earnings = max(0, (driver.monthly_earnings or 0) - driver_earnings_usd)
            
    db.commit()
            
    # Update Firebase
    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({"status": "cancelled"})
    except Exception as e:
        logger.error(f"Failed to update Firebase: {e}")
        
    return {"message": "Trip cancelled and escrow refunded"}

from pydantic import BaseModel
from typing import Optional

class RateRequest(BaseModel):
    stars: int
    comment: Optional[str] = None

class PassengerRateRequest(BaseModel):
    stars: int
    comment: Optional[str] = None

@router.post("/trip/{trip_id}/rate", status_code=status.HTTP_200_OK)
def rate_trip(trip_id: int, payload: RateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Passenger rates the driver (1-7 stars) """
    if payload.stars < 1 or payload.stars > 7:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 7")
        
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or trip.passenger_id != current_user.id:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    if trip.status != TripStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Only completed trips can be rated.")
        
    trip.driver_rating = payload.stars
    trip.driver_rating_comment = payload.comment

    driver = db.query(User).filter(User.id == trip.driver_id).first()
    if driver:
        current_count = driver.rating_count or 0
        current_avg = driver.rating_avg or 5.0
        
        # Calculate new average
        new_total = (current_avg * current_count) + payload.stars
        new_count = current_count + 1
        driver.rating_avg = round(new_total / new_count, 2)
        driver.rating_count = new_count
        
    db.commit()

    # Update Firebase trip node
    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({"driver_rated": True, "driver_rating": payload.stars})
    except Exception:
        pass
        
    return {"message": "Calificación enviada exitosamente"}


@router.post("/trip/{trip_id}/rate-passenger", status_code=status.HTTP_200_OK)
def rate_passenger(trip_id: int, payload: PassengerRateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Driver rates the passenger (1-5 stars) """
    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado.")
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="No eres el conductor de este viaje.")
        
    if trip.status != TripStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Solo se pueden calificar viajes completados.")
        
    trip.passenger_rating = payload.stars
    trip.passenger_rating_comment = payload.comment

    passenger = db.query(User).filter(User.id == trip.passenger_id).first()
    if passenger:
        current_count = passenger.rating_count or 0
        current_avg = passenger.rating_avg or 5.0
        
        new_total = (current_avg * current_count) + payload.stars
        new_count = current_count + 1
        passenger.rating_avg = round(new_total / new_count, 2)
        passenger.rating_count = new_count

    db.commit()

    try:
        ref = firebase_db.reference(f'trips/active/{trip.id}')
        ref.update({"passenger_rated": True, "passenger_rating": payload.stars})
    except Exception:
        pass

    return {"message": "Calificación del pasajero registrada exitosamente"}


@router.get("/trips/history")
def get_trip_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Returns past completed and cancelled trips with digital receipt details for passenger or driver """
    user_id = current_user.id
    trips = db.query(Trip).filter(
        (Trip.passenger_id == user_id) | (Trip.driver_id == user_id),
        Trip.status.in_([TripStatus.COMPLETED, TripStatus.CANCELLED])
    ).order_by(Trip.created_at.desc()).limit(50).all()
    
    result = []
    for t in trips:
        is_driver = (t.driver_id == user_id)
        v_plate = ""
        v_model = ""
        if t.driver and t.driver.vehicle:
            v = t.driver.vehicle[0] if isinstance(t.driver.vehicle, list) else t.driver.vehicle
            v_plate = v.license_plate or ""
            v_model = f"{v.brand or ''} {v.model or ''} ({v.color or ''})".strip()
            
        final_amt = t.final_price or t.proposed_price or 0.0
        fee_amt = t.platform_fee or 0.0
        net_amt = max(0.0, final_amt - fee_amt) if is_driver else final_amt

        result.append({
            "id": t.id,
            "role": "conductor" if is_driver else "pasajero",
            "status": t.status,
            "vehicle_type": t.vehicle_type_requested,
            "origin_address": t.origin_address or "Origen no especificado",
            "destination_address": t.destination_address or "Destino no especificado",
            "distance_km": round(t.distance_km, 1) if t.distance_km else 0.0,
            "final_price": final_amt,
            "platform_fee": fee_amt,
            "net_earnings": net_amt,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
            "completed_at": t.completed_at.strftime("%Y-%m-%d %H:%M") if t.completed_at else "",
            "passenger_name": t.passenger.name if t.passenger else "Pasajero TEI",
            "passenger_phone": t.passenger.phone if t.passenger else None,
            "driver_name": t.driver.name if t.driver else "Conductor TEI",
            "driver_phone": t.driver.phone if t.driver else None,
            "vehicle_plate": v_plate,
            "vehicle_model": v_model,
            "driver_rating": getattr(t, 'driver_rating', None),
            "passenger_rating": getattr(t, 'passenger_rating', None),
            "driver_rating_comment": getattr(t, 'driver_rating_comment', None),
            "passenger_rating_comment": getattr(t, 'passenger_rating_comment', None)
        })
        
    return {"trips": result}



# --- Driver Wallet & Recharge Endpoints ---

@router.get("/driver-wallet")
def get_driver_wallet_info(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Returns current driver wallet balance (in USD and COP), active credit line, and recent movements """
    EXCHANGE_RATE = 4500.0
    
    # 1. Escala de Confianza (+ $4.500 COP por ciclo pagado a tiempo, tope $77.000 COP)
    paid_credits_count = db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.status == "paid"
    ).count()
    bonus_cupo_cop = paid_credits_count * 4500.0
    cupo_confianza_cop = min(77000.0, 38000.0 + bonus_cupo_cop)

    # Línea de Crédito Respaldada por Caja Fuerte (70%) o Escala de Confianza
    caja_balance_usd = current_user.bank_balance or 0.0
    caja_balance_cop = round(caja_balance_usd * EXCHANGE_RATE)
    caja_70_cop = round(caja_balance_cop * 0.70)
    
    banco_balance_usd = current_user.verified_balance or 0.0
    banco_balance_cop = round(banco_balance_usd * EXCHANGE_RATE)

    available_usd = current_user.available_balance or 0.0
    available_cop = round(available_usd * EXCHANGE_RATE)
    total_earnings_usd = current_user.total_earnings or 0.0
    total_earnings_cop = round(total_earnings_usd * EXCHANGE_RATE)
    dias_antiguedad = (datetime.utcnow() - current_user.created_at).days
    
    # Límite máximo de cupo operativo = mayor entre confianza y 70% Caja Fuerte (Tope seguro: $77.000 COP)
    limite_credito_cop = min(77000.0, max(cupo_confianza_cop, caja_70_cop))
    limite_credito_usd = round(limite_credito_cop / EXCHANGE_RATE, 2)

    # 2. Verificar Cupo Operativo Activo del Conductor
    active_credit = db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.status == "active"
    ).order_by(DriverCredit.created_at.desc()).first()

    active_credit_info = None
    credito_usado_cop = 0
    total_due_cop = 0.0
    admin_fee_cop = 450.0
    overdue_fee_cop = 0.0
    days_elapsed = 0
    if active_credit:
        now = datetime.utcnow()
        used_commission_cop = active_credit.used_commission_cop or 0.0
        remaining_balance_cop = max(0.0, active_credit.principal_cop - used_commission_cop)
        
        is_clock_running = active_credit.deadline_started_at is not None
        days_remaining = 3
        is_overdue = False
        period_status = "Cupo Disponible y Protegido (Sin plazo activo)"

        if is_clock_running:
            diff_sec = (now - active_credit.deadline_started_at).total_seconds()
            days_elapsed = max(1, math.ceil(diff_sec / 86400)) # Mínimo 1 día
            
            if days_elapsed <= 3:
                overdue_fee_cop = 0.0
                is_overdue = False
                period_status = "Plazo Oportuno Activo (Días 1-3)"
                days_remaining = 3 - days_elapsed
            else:
                overdue_fee_cop = 2000.0
                is_overdue = True
                period_status = "Normalización Operativa (Día 4+)"
                days_remaining = 0
        elif remaining_balance_cop <= 5000.0:
            active_credit.deadline_started_at = now
            db.commit()
            is_clock_running = True
            days_elapsed = 1
            days_remaining = 2
            period_status = "Plazo Oportuno Activo (Días 1-3)"
            
        total_due_cop = max(0.0, used_commission_cop + overdue_fee_cop)
        credito_usado_cop = used_commission_cop
        
        active_credit_info = {
            "id": active_credit.id,
            "credit_type": active_credit.credit_type,
            "principal_cop": active_credit.principal_cop,
            "used_commission_cop": used_commission_cop,
            "remaining_balance_cop": remaining_balance_cop,
            "is_clock_running": is_clock_running,
            "deadline_started_at": active_credit.deadline_started_at.strftime("%Y-%m-%d %H:%M") if active_credit.deadline_started_at else None,
            "days_elapsed": days_elapsed,
            "admin_fee_cop": admin_fee_cop,
            "overdue_fee_cop": overdue_fee_cop,
            "is_overdue": is_overdue,
            "period_status": period_status,
            "days_remaining": days_remaining,
            "total_due_cop": total_due_cop,
            "is_low_balance": remaining_balance_cop <= 5000.0,
            "created_at": active_credit.created_at.strftime("%Y-%m-%d %H:%M")
        }

    # Cupo disponible
    credito_disponible_cop = (active_credit.principal_cop - active_credit.used_commission_cop) if active_credit else limite_credito_cop

    # 3. Préstamo de Activación de Bienvenida ($38.000 COP)
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).first()
    vehicle_approved = bool(vehicle and vehicle.status == VehicleStatus.APPROVED)
    activation_loan_used = bool(db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.credit_type == "activation"
    ).first())
    can_take_activation_loan = (not activation_loan_used) and vehicle_approved and (not bool(active_credit))

    # 4. Historial de movimientos recientes del conductor (últimos viajes finalizados o cancelados)
    recent_trips = db.query(Trip).filter(
        Trip.driver_id == current_user.id
    ).order_by(Trip.created_at.desc()).limit(20).all()
    
    movements = []
    for t in recent_trips:
        if t.status == TripStatus.COMPLETED:
            if t.payment_method == "tei_bank":
                net_earn = t.driver_earnings or ((t.final_price or 0.0) - (t.platform_fee or 0.0))
                movements.append({
                    "id": f"dig_{t.id}",
                    "type": "digital_fare",
                    "title": f"Pago Digital TEI - Ganancia Viaje #{t.id}",
                    "date": t.completed_at.strftime("%Y-%m-%d %H:%M") if t.completed_at else t.created_at.strftime("%Y-%m-%d %H:%M"),
                    "amount_cop": +net_earn,
                    "earnings_cop": net_earn,
                    "is_credit": True
                })
            else:
                movements.append({
                    "id": f"com_{t.id}",
                    "type": "commission",
                    "title": f"Comisión TEI (Efectivo) - Viaje #{t.id}",
                    "date": t.completed_at.strftime("%Y-%m-%d %H:%M") if t.completed_at else t.created_at.strftime("%Y-%m-%d %H:%M"),
                    "amount_cop": -(t.platform_fee or 0.0),
                    "earnings_cop": (t.final_price or 0.0) - (t.platform_fee or 0.0),
                    "is_credit": False
                })
        elif t.status == TripStatus.CANCELLED and t.payment_method != "tei_bank":
            movements.append({
                "id": f"ref_{t.id}",
                "type": "refund",
                "title": f"Devolución Comisión - Viaje Cancelado #{t.id}",
                "date": t.updated_at.strftime("%Y-%m-%d %H:%M") if t.updated_at else t.created_at.strftime("%Y-%m-%d %H:%M"),
                "amount_cop": +(t.platform_fee or 0.0),
                "is_credit": True
            })
            
    # Movimientos de recarga Wompi e Internas
    user_id = current_user.id
    all_recharges_tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.provider.in_(["wompi", "internal_banco", "internal_credit"])
    ).order_by(PaymentTransaction.created_at.desc()).all()

    user_recharges = []
    for tx_item in all_recharges_tx:
        meta = tx_item.metadata_json or {}
        if isinstance(meta, dict) and meta.get("user_id") == user_id:
            user_recharges.append(tx_item)

    approved_recharges = [r for r in user_recharges if str(r.status).lower() == "approved"]
    has_activation_or_approved = (len(approved_recharges) > 0 or activation_loan_used)
    is_first_recharge = not has_activation_or_approved

    # Regla: Si tiene crédito activo, la recarga mínima debe cubrir la deuda total + 1 Dólar TEI ($4.500 COP)
    if active_credit:
        min_recharge_cop = total_due_cop + 4500.0
    else:
        min_recharge_cop = 38000.0 if is_first_recharge else 10000.0

    for r in user_recharges[:10]:
        if str(r.status).lower() == "approved":
            prov_label = "Banco TEI" if r.provider == "internal_banco" else ("Crédito/Adelanto" if r.provider == "internal_credit" else "Wompi")
            movements.append({
                "id": f"rec_{r.id}",
                "type": "recharge",
                "title": f"Recarga {prov_label} Aprobada",
                "date": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
                "amount_cop": r.amount,
                "is_credit": True
            })

    # Movimientos de créditos del conductor
    user_credits = db.query(DriverCredit).filter(DriverCredit.driver_id == current_user.id).order_by(DriverCredit.created_at.desc()).limit(10).all()
    for c in user_credits:
        c_title = "Préstamo de Activación ($38.000 COP)" if c.credit_type == "activation" else "Línea de Crédito Caja Fuerte"
        movements.append({
            "id": f"crd_{c.id}",
            "type": "credit_disbursement",
            "title": f"Desembolso: {c_title}",
            "date": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "",
            "amount_cop": c.principal_cop,
            "is_credit": True
        })
        if c.status == "paid" and c.paid_at:
            movements.append({
                "id": f"crd_pay_{c.id}",
                "type": "credit_payment",
                "title": f"Pago Crédito ({c.paid_via or 'billetera'})",
                "date": c.paid_at.strftime("%Y-%m-%d %H:%M") if c.paid_at else "",
                "amount_cop": -(c.total_paid_cop or c.principal_cop),
                "is_credit": False
            })

    # Movimientos de retiros bancarios del conductor
    pending_withdrawals_count = 0
    try:
        from ..database.models.withdrawal import WithdrawalRequest
        user_withdrawals = db.query(WithdrawalRequest).filter(
            WithdrawalRequest.user_id == current_user.id,
            WithdrawalRequest.source_type == "driver_wallet"
        ).order_by(WithdrawalRequest.created_at.desc()).limit(10).all()
        
        for w in user_withdrawals:
            status_txt = "Pendiente" if w.status == "pending" else ("Pagado" if w.status in ["approved", "paid"] else "Rechazado")
            if w.status == "pending":
                pending_withdrawals_count += 1
            movements.append({
                "id": f"wd_{w.id}",
                "withdrawal_id": w.id,
                "type": "withdrawal",
                "title": f"Retiro a Banco ({status_txt})",
                "date": w.created_at.strftime("%Y-%m-%d %H:%M") if w.created_at else "",
                "amount_cop": -(round(w.amount * EXCHANGE_RATE)),
                "is_credit": False,
                "status": w.status,
                "can_cancel": (w.status == "pending")
            })
    except Exception as w_err:
        logger.warning(f"Error querying driver withdrawals: {w_err}")

    # Información de Seguridad y Cuenta Bancaria Verificada (KYC)
    from ..database.models.compliance_record import ComplianceRecord
    comp_record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()

    is_kyc_verified = bool(current_user.is_kyc_verified or (comp_record and comp_record.status == "approved"))
    has_transaction_pin = bool(current_user.transaction_pin)

    verified_bank_name = ""
    verified_account_type = "Ahorros"
    verified_account_number = ""
    verified_account_holder = current_user.name or ""
    verified_document_id = current_user.document_id or ""

    if comp_record:
        verified_bank_name = comp_record.bank_name or comp_record.input_bank_name or ""
        verified_account_type = comp_record.bank_account_type or comp_record.input_bank_account_type or "Ahorros"
        verified_account_number = comp_record.bank_account_number or comp_record.input_bank_account_number or ""
        if comp_record.input_full_name_cedula:
            verified_account_holder = comp_record.input_full_name_cedula
        if comp_record.input_document_id_rut:
            verified_document_id = comp_record.input_document_id_rut

    # Ordenar movimientos recientes
    return {
        "user_id": current_user.id,
        "available_balance_usd": available_usd,
        "available_balance_cop": available_cop,
        "banco_balance_usd": banco_balance_usd,
        "banco_balance_cop": banco_balance_cop,
        "caja_balance_usd": caja_balance_usd,
        "caja_balance_cop": caja_balance_cop,
        "cupo_base_cop": 38000.0,
        "cupo_max_cop": 77000.0,
        "paid_credits_count": paid_credits_count,
        "bonus_cupo_cop": bonus_cupo_cop,
        "credit_limit_usd": limite_credito_usd,
        "credit_limit_cop": limite_credito_cop,
        "credit_used_cop": credito_usado_cop,
        "credit_available_cop": credito_disponible_cop,
        "admin_fee_cop": 450.0,
        "overdue_fee_cop": 2000.0,
        "fee_structure_label": "Tarifa de Gestión: $450 COP fijos · Días 1 a 3 Plazo Oportuno · Día 4+ Cargo Normalización $2.000 COP",
        "radar_restricted": bool(active_credit and days_elapsed >= 4),
        "can_take_activation_loan": can_take_activation_loan,
        "activation_loan_used": activation_loan_used,
        "vehicle_approved": vehicle_approved,
        "active_credit": active_credit_info,
        "total_earnings_usd": total_earnings_usd,
        "total_earnings_cop": total_earnings_cop,
        "dias_antiguedad": dias_antiguedad,
        "is_first_recharge": is_first_recharge,
        "min_recharge_cop": min_recharge_cop,
        "is_kyc_verified": is_kyc_verified,
        "has_transaction_pin": has_transaction_pin,
        "is_pin_locked": bool(current_user.pin_locked_until and current_user.pin_locked_until > datetime.utcnow()),
        "pin_locked_hours": max(1, math.ceil((current_user.pin_locked_until - datetime.utcnow()).total_seconds() / 3600)) if (current_user.pin_locked_until and current_user.pin_locked_until > datetime.utcnow()) else 0,
        "pin_failed_attempts": current_user.pin_failed_attempts or 0,
        "verified_bank_name": verified_bank_name,
        "verified_account_type": verified_account_type,
        "verified_account_number": verified_account_number,
        "verified_account_holder": verified_account_holder,
        "verified_document_id": verified_document_id,
        "pending_withdrawals_count": pending_withdrawals_count,
        "movements": movements[:15]
    }


from pydantic import BaseModel
import os
import hashlib
from urllib.parse import urlencode
from ..database.models.payment_transaction import PaymentTransaction

class RechargeRequest(BaseModel):
    amount_cop: float

class InternalRechargeRequest(BaseModel):
    amount_cop: float
    source: str  # Solo "banco"

class CreditRequest(BaseModel):
    credit_type: str  # "activation" o "vault_backed"
    amount_cop: float = 38000.0

class PayCreditRequest(BaseModel):
    payment_method: str = "wallet_balance"  # "wallet_balance" o "tei_bank"

@router.post("/driver-credit/request")
def request_driver_credit(
    payload: CreditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Desembolsa un microcrédito al conductor:
    1. 'activation': Préstamo de Bienvenida ($38.000 COP) para conductores nuevos con vehículo aprobado.
    2. 'vault_backed': Adelanto respaldado por hasta el 70% de Caja Fuerte.
    
    Tasa: 0.09% diario (mínimo 1 día). ¡Los primeros 3 días Gratis!
    """
    EXCHANGE_RATE = 4500.0

    # Verificar si ya tiene crédito activo pendiente
    existing_active = db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.status == "active"
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail=f"Ya tienes un crédito activo por ${existing_active.principal_cop:,.0f} COP pendiente de pago."
        )

    if payload.credit_type == "activation":
        vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).first()
        if not vehicle or vehicle.status != VehicleStatus.APPROVED:
            raise HTTPException(
                status_code=400,
                detail="Tu vehículo y documentos deben estar APROBADOS por auditoría para recibir el Préstamo de Bienvenida."
            )
        already_used = db.query(DriverCredit).filter(
            DriverCredit.driver_id == current_user.id,
            DriverCredit.credit_type == "activation"
        ).first()
        if already_used:
            raise HTTPException(
                status_code=400,
                detail="Ya utilizaste el beneficio de Préstamo de Activación de Bienvenida."
            )
        amount_cop = 38000.0
        amount_usd = round(amount_cop / EXCHANGE_RATE, 4)

    elif payload.credit_type == "vault_backed":
        caja_cop = round((current_user.bank_balance or 0.0) * EXCHANGE_RATE)
        paid_credits_count = db.query(DriverCredit).filter(
            DriverCredit.driver_id == current_user.id,
            DriverCredit.status == "paid"
        ).count()
        bonus_cupo_cop = paid_credits_count * 4500.0
        cupo_confianza_cop = min(77000.0, 38000.0 + bonus_cupo_cop)
        caja_70_cop = round(caja_cop * 0.70)
        max_credit_cop = min(77000.0, max(cupo_confianza_cop, caja_70_cop))

        if max_credit_cop < 10000:
            raise HTTPException(
                status_code=400,
                detail=f"Tu cupo disponible es de ${max_credit_cop:,.0f} COP. El monto mínimo es $10.000 COP."
            )
        if payload.amount_cop > max_credit_cop or payload.amount_cop < 10000:
            raise HTTPException(
                status_code=400,
                detail=f"El monto debe estar entre $10.000 COP y tu cupo máximo disponible de ${max_credit_cop:,.0f} COP (Tope máximo de seguridad: $77.000 COP)."
            )
        amount_cop = float(payload.amount_cop)
        amount_usd = round(amount_cop / EXCHANGE_RATE, 4)

    else:
        raise HTTPException(status_code=400, detail="Tipo de crédito inválido. Usa 'activation' o 'vault_backed'.")

    ADMIN_FEE_COP = 450.0
    ADMIN_FEE_USD = round(ADMIN_FEE_COP / EXCHANGE_RATE, 4)

    # Cobro de la Tarifa Fija de Gestión ($450 COP) inmediatamente al activar:
    user_wallet_cop = round((current_user.available_balance or 0.0) * EXCHANGE_RATE)
    user_bank_cop = round((current_user.verified_balance or 0.0) * EXCHANGE_RATE)

    fee_debited_source = "cupo"
    if user_wallet_cop >= ADMIN_FEE_COP:
        current_user.available_balance = max(0.0, round((current_user.available_balance or 0.0) - ADMIN_FEE_USD, 4))
        fee_debited_source = "billetera"
    elif user_bank_cop >= ADMIN_FEE_COP:
        current_user.verified_balance = max(0.0, round((current_user.verified_balance or 0.0) - ADMIN_FEE_USD, 4))
        fee_debited_source = "banco"
    else:
        fee_debited_source = "cupo_directo"

    init_used_cop = ADMIN_FEE_COP if fee_debited_source == "cupo_directo" else 0.0

    credit = DriverCredit(
        driver_id=current_user.id,
        credit_type=payload.credit_type,
        principal_cop=amount_cop,
        principal_usd=amount_usd,
        admin_fee_cop=ADMIN_FEE_COP,
        overdue_fee_cop=0.0,
        interest_rate_daily=0.0,
        free_days=3,
        status="active",
        used_commission_cop=init_used_cop,
        deadline_started_at=None  # Inicia solo cuando el saldo de cupo queda en <= $5.000 COP
    )
    db.add(credit)

    # Registrar transacción interna para que el radar lo tome como cuenta activada
    tx = PaymentTransaction(
        amount=amount_cop,
        currency="COP",
        status="approved",
        provider="internal_credit",
        metadata_json={
            "user_id": current_user.id,
            "credit_type": payload.credit_type,
            "amount_usd": amount_usd,
            "admin_fee_cop": ADMIN_FEE_COP,
            "admin_fee_debited_from": fee_debited_source
        },
        order_id=None
    )
    db.add(tx)
    db.commit()
    db.refresh(credit)
    db.refresh(current_user)

    available_initial_cop = amount_cop - init_used_cop

    return {
        "message": f"¡Cupo de Respaldo de ${amount_cop:,.0f} COP activado exitosamente!",
        "credit_id": credit.id,
        "amount_cop": amount_cop,
        "amount_usd": amount_usd,
        "admin_fee_cop": ADMIN_FEE_COP,
        "admin_fee_deducted_from": fee_debited_source,
        "available_credit_cop": available_initial_cop,
        "fee_info": f"Tarifa de Gestión de $450 COP descontada ({fee_debited_source}). El plazo de 3 días se activará cuando tu saldo de cupo llegue a $5.000 COP o menos."
    }

@router.post("/driver-credit/pay")
def pay_driver_credit(
    payload: PayCreditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite liquidar el cupo activo restaurándolo al 100%:
    1. 'wallet_balance': Saldo disponible en Billetera de viajes.
    2. 'tei_bank': Saldo disponible en Banco TEI.
    """
    EXCHANGE_RATE = 4500.0
    active_credit = db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.status == "active"
    ).first()
    if not active_credit:
        raise HTTPException(status_code=400, detail="No tienes ningún cupo activo pendiente de pago.")

    now = datetime.utcnow()
    used_commission_cop = active_credit.used_commission_cop or 0.0
    days_elapsed = 0
    overdue_fee_cop = 0.0

    if active_credit.deadline_started_at:
        diff_sec = (now - active_credit.deadline_started_at).total_seconds()
        days_elapsed = max(1, math.ceil(diff_sec / 86400))
        if days_elapsed >= 4:
            overdue_fee_cop = 2000.0

    # Total a pagar para reponer y restaurar el cupo
    total_due_cop = max(0.0, used_commission_cop + overdue_fee_cop)
    total_due_usd = round(total_due_cop / EXCHANGE_RATE, 4)

    if total_due_cop > 0:
        if payload.payment_method == "wallet_balance":
            current_bal_cop = round((current_user.available_balance or 0.0) * EXCHANGE_RATE)
            if current_bal_cop < total_due_cop:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente en Billetera (${current_bal_cop:,.0f} COP). Se requieren ${total_due_cop:,.0f} COP para restaurar tu cupo."
                )
            current_user.available_balance = round(current_user.available_balance - total_due_usd, 4)

        elif payload.payment_method == "tei_bank":
            banco_bal_cop = round((current_user.verified_balance or 0.0) * EXCHANGE_RATE)
            if banco_bal_cop < total_due_cop:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente en Banco TEI (${banco_bal_cop:,.0f} COP). Se requieren ${total_due_cop:,.0f} COP."
                )
            current_user.verified_balance = round(current_user.verified_balance - total_due_usd, 4)

        else:
            raise HTTPException(status_code=400, detail="Método de pago no soportado. Usa 'wallet_balance' o 'tei_bank'.")

    active_credit.status = "paid"
    active_credit.paid_at = now
    active_credit.days_elapsed = days_elapsed
    active_credit.overdue_fee_cop = overdue_fee_cop
    active_credit.interest_cop = overdue_fee_cop
    active_credit.total_paid_cop = total_due_cop
    active_credit.paid_via = payload.payment_method

    db.commit()
    db.refresh(current_user)

    paid_count = db.query(DriverCredit).filter(
        DriverCredit.driver_id == current_user.id,
        DriverCredit.status == "paid"
    ).count()
    new_limit_cop = min(77000.0, 38000.0 + (paid_count * 4500.0))

    return {
        "message": f"¡Cupo liquidado y restaurado exitosamente! Total cubierto: ${total_due_cop:,.0f} COP{', Normalización: $2.000 COP' if overdue_fee_cop > 0 else ''}. Tu nuevo cupo de confianza es de ${new_limit_cop:,.0f} COP.",
        "total_paid_cop": total_due_cop,
        "overdue_fee_cop": overdue_fee_cop,
        "days_elapsed": days_elapsed,
        "new_trust_limit_cop": new_limit_cop,
        "paid_credits_count": paid_count
    }

@router.post("/driver-wallet/recharge-internal")
def recharge_wallet_internal(
    payload: InternalRechargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite al conductor recargar su Billetera de Conductor usando su saldo en:
    1. Saldo Banco TEI (verified_balance)
    (Caja Fuerte solo opera como Línea de Crédito / Respaldo para preservar la retención tributaria).
    """
    EXCHANGE_RATE = 4500.0
    user_id = current_user.id

    if payload.source == "caja_fuerte":
        raise HTTPException(
            status_code=400,
            detail="El saldo de Caja Fuerte no permite recargas directas por retención de impuestos. Utiliza la opción de 'Línea de Crédito' (hasta el 70%) respaldada por tu Caja Fuerte."
        )

    # 1. Determinar si hay crédito activo pendiente
    active_credit = db.query(DriverCredit).filter(
        DriverCredit.driver_id == user_id,
        DriverCredit.status == "active"
    ).first()

    now = datetime.utcnow()
    total_due_cop = 0.0
    interest_cop = 0.0
    days_elapsed = 0

    now = datetime.utcnow()
    total_due_cop = 0.0
    days_elapsed = 0
    admin_fee_cop = 450.0
    overdue_fee_cop = 0.0

    if active_credit:
        diff_sec = (now - active_credit.created_at).total_seconds()
        days_elapsed = max(1, math.ceil(diff_sec / 86400))
        overdue_fee_cop = 2000.0 if days_elapsed >= 4 else 0.0
        total_due_cop = active_credit.principal_cop + admin_fee_cop + overdue_fee_cop
        min_required = total_due_cop + 4500.0  # Deuda total + 1 Dólar TEI ($4.500 COP)
    else:
        all_recharges_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.provider.in_(["wompi", "internal_banco", "internal_credit"])
        ).all()
        user_approved = [
            r for r in all_recharges_tx 
            if r.metadata_json and isinstance(r.metadata_json, dict) and r.metadata_json.get("user_id") == user_id and str(r.status).lower() == "approved"
        ]
        has_activation_loan = bool(db.query(DriverCredit).filter(
            DriverCredit.driver_id == user_id,
            DriverCredit.credit_type == "activation"
        ).first())
        is_first_recharge = (len(user_approved) == 0 and not has_activation_loan)
        min_required = 38000.0 if is_first_recharge else 10000.0

    if payload.amount_cop < min_required:
        if active_credit:
            raise HTTPException(
                status_code=400,
                detail=f"Tienes un saldo pendiente por ${total_due_cop:,.0f} COP (incluye tarifa de gestión{' y normalización' if overdue_fee_cop > 0 else ''}). Para recargar debes cubrir la deuda más 1 Dólar TEI ($4.500 COP) para saldo activo. Recarga mínima requerida: ${min_required:,.0f} COP."
            )
        elif is_first_recharge:
            raise HTTPException(
                status_code=400, 
                detail="La primera recarga obligatoria para operar como conductor en TEI RIDE debe ser de mínimo $38.000 COP."
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"El monto mínimo de recarga es de ${min_required:,.0f} COP."
            )

    amount_usd = round(payload.amount_cop / EXCHANGE_RATE, 4)

    # 2. Validar fondos en Banco TEI
    if payload.source == "banco":
        banco_usd = current_user.verified_balance or 0.0
        if banco_usd < amount_usd:
            banco_cop = round(banco_usd * EXCHANGE_RATE)
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente en Banco TEI. Tienes ${banco_cop:,.0f} COP (${banco_usd:.2f} USD) disponibles."
            )
        current_user.verified_balance = round(banco_usd - amount_usd, 4)
        
        # Liquidar deuda activa primero si existe; el excedente queda como saldo activo
        if active_credit:
            active_credit.status = "paid"
            active_credit.paid_at = now
            active_credit.days_elapsed = days_elapsed
            active_credit.admin_fee_cop = admin_fee_cop
            active_credit.overdue_fee_cop = overdue_fee_cop
            active_credit.interest_cop = admin_fee_cop + overdue_fee_cop
            active_credit.total_paid_cop = total_due_cop
            active_credit.paid_via = "recharge_banco"
            
            excedente_cop = payload.amount_cop - total_due_cop
            excedente_usd = round(excedente_cop / EXCHANGE_RATE, 4)
            current_user.available_balance = round((current_user.available_balance or 0.0) + excedente_usd, 4)
            success_msg = f"¡Recarga exitosa! Se liquidó tu saldo pendiente de ${total_due_cop:,.0f} COP y te quedó un excedente activo de ${excedente_cop:,.0f} COP (${excedente_usd:.2f} USD)."
        else:
            current_user.available_balance = round((current_user.available_balance or 0.0) + amount_usd, 4)
            success_msg = f"¡Recarga exitosa! Se transfirieron ${payload.amount_cop:,.0f} COP desde tu Banco TEI a tu Billetera de Conductor."
            
        provider_name = "internal_banco"
        source_label = "Banco TEI"
    else:
        raise HTTPException(
            status_code=400,
            detail="Origen de fondos inválido. Selecciona 'banco'."
        )

    # 3. Registrar transacción contable de recarga aprobada
    tx = PaymentTransaction(
        amount=payload.amount_cop,
        currency="COP",
        status="approved",
        provider=provider_name,
        metadata_json={
            "user_id": current_user.id,
            "source": payload.source,
            "amount_usd": amount_usd,
            "type": "internal_recharge",
            "paid_credit": bool(active_credit)
        },
        order_id=None
    )
    db.add(tx)
    db.commit()
    db.refresh(current_user)

    return {
        "message": success_msg,
        "amount_cop": payload.amount_cop,
        "amount_usd": amount_usd,
        "source": payload.source,
        "paid_credit": bool(active_credit),
        "new_available_balance_cop": round((current_user.available_balance or 0.0) * EXCHANGE_RATE),
        "new_available_balance_usd": current_user.available_balance,
        "new_banco_balance_cop": round((current_user.verified_balance or 0.0) * EXCHANGE_RATE),
        "new_caja_balance_cop": round((current_user.bank_balance or 0.0) * EXCHANGE_RATE),
        "is_first_recharge": False
    }

@router.post("/recharge", response_model=dict)
def recharge_wallet(payload: RechargeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Generate a Wompi checkout URL to recharge the driver's wallet. First recharge minimum is $38.000 COP. """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    
    # Check if driver has active debt
    active_credit = db.query(DriverCredit).filter(
        DriverCredit.driver_id == user_id,
        DriverCredit.status == "active"
    ).first()

    if active_credit:
        now = datetime.utcnow()
        diff_sec = (now - active_credit.created_at).total_seconds()
        days_elapsed = max(1, math.ceil(diff_sec / 86400))
        admin_fee_cop = 450.0
        overdue_fee_cop = 2000.0 if days_elapsed >= 4 else 0.0
        total_due_cop = active_credit.principal_cop + admin_fee_cop + overdue_fee_cop
        min_required = total_due_cop + 4500.0  # Deuda total + 1 Dólar TEI
    else:
        all_recharges_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.provider.in_(["wompi", "internal_banco", "internal_credit"])
        ).all()
        user_approved = [
            r for r in all_recharges_tx 
            if r.metadata_json and isinstance(r.metadata_json, dict) and r.metadata_json.get("user_id") == user_id and str(r.status).lower() == "approved"
        ]
        has_activation_loan = bool(db.query(DriverCredit).filter(
            DriverCredit.driver_id == user_id,
            DriverCredit.credit_type == "activation"
        ).first())
        is_first_recharge = (len(user_approved) == 0 and not has_activation_loan)
        min_required = 38000.0 if is_first_recharge else 10000.0

    if payload.amount_cop < min_required:
        if active_credit:
            raise HTTPException(
                status_code=400,
                detail=f"Tienes un crédito activo por ${total_due_cop:,.0f} COP. Para recargar debes cubrir la deuda más 1 Dólar TEI ($4.500 COP) para saldo activo. Recarga mínima requerida: ${min_required:,.0f} COP."
            )
        elif is_first_recharge:
            raise HTTPException(
                status_code=400, 
                detail="La primera recarga obligatoria para operar como conductor en TEI RIDE debe ser de mínimo $38.000 COP."
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"El monto mínimo de recarga es de ${min_required:,.0f} COP."
            )
        
    amount_in_cents = int(payload.amount_cop * 100)
    # Prefix TRRECH (Transport Recharge) to distinguish in Wompi webhook
    reference = f"TRRECH_{user_id}_{int(datetime.utcnow().timestamp())}"
    
    # Register transaction as pending
    tx = PaymentTransaction(
        amount=payload.amount_cop,
        currency="COP",
        status="pending",
        provider="wompi",
        metadata_json={"user_id": current_user.id, "reference": reference},
        order_id=None 
    )
    db.add(tx)
    db.commit()
    
    # Generate Wompi Signature
    public_key = os.getenv("WOMPI_PUBLIC_KEY", "pub_prod_7RZSGU1HYfnPDH2Lt9g1pxHDnbp7NFg1")
    integrity_secret = os.getenv("WOMPI_INTEGRITY_SECRET", "prod_integrity_4RNpPb0yVueGb91inYpwxhbwVDOxdmq7")
    
    signature_string = f"{reference}{amount_in_cents}COP{integrity_secret}"
    signature = hashlib.sha256(signature_string.encode('utf-8')).hexdigest()
    
    redirect_url = os.getenv("FRONTEND_URL", "https://tuempresainternacional.com") + "/transport/driver/wallet"
    
    params = {
        "public-key": public_key,
        "currency": "COP",
        "amount-in-cents": amount_in_cents,
        "reference": reference,
        "signature:integrity": signature,
        "redirect-url": redirect_url
    }
    
    checkout_url = f"https://checkout.wompi.co/p/?{urlencode(params)}"
    
    return {
        "checkout_url": checkout_url,
        "reference": reference,
        "amount_cop": payload.amount_cop,
        "public_key": public_key,
        "signature": signature
    }


class DriverWithdrawRequest(BaseModel):
    amount_cop: float
    pin: str
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    account_number: Optional[str] = None
    account_holder: Optional[str] = None
    document_id: Optional[str] = None

@router.post("/driver-wallet/withdraw")
def withdraw_driver_wallet(
    payload: DriverWithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite al conductor retirar sus ganancias en cualquier momento hacia su cuenta bancaria o Nequi/Daviplata.
    SEGURIDAD BANCARIA REQUERIDA:
    1. Verificación de identidad y antecedentes aprobada (KYC Aprobado).
    2. Segunda Clave de Retiros (PIN de seguridad) configurada y validada con hash.
    3. Destino restringido exclusivamente a la cuenta bancaria certificada del titular.
    """
    EXCHANGE_RATE = 4500.0
    MIN_WITHDRAW_COP = 49500.0  # $11.00 USD ($49.500 COP)

    # 1. Validación Obligatoria de KYC
    from ..database.models.compliance_record import ComplianceRecord
    comp_record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
    is_kyc_verified = bool(current_user.is_kyc_verified or (comp_record and comp_record.status == "approved"))
    if not is_kyc_verified:
        raise HTTPException(
            status_code=403,
            detail="Verificación KYC Requerida: Debes tener tu verificación de identidad y documentos aprobada para poder retirar fondos a cuentas bancarias."
        )

    # 2. Validación de Bloqueo por Intentos Fallidos de Segunda Clave (Máximo 3 intentos / 24 Horas)
    now_utc = datetime.utcnow()
    pin_locked_until = getattr(current_user, "pin_locked_until", None)
    if pin_locked_until and pin_locked_until > now_utc:
        remaining_seconds = (pin_locked_until - now_utc).total_seconds()
        remaining_hours = max(1, math.ceil(remaining_seconds / 3600))
        remaining_mins = max(1, math.ceil(remaining_seconds / 60))
        time_msg = f"{remaining_hours} hora(s)" if remaining_hours > 1 else f"{remaining_mins} minuto(s)"
        raise HTTPException(
            status_code=403,
            detail=f"Seguridad Activada: Tu función de retiros ha sido bloqueada temporalmente por registrar 3 intentos fallidos con tu Segunda Clave. Podrás intentar nuevamente en {time_msg}."
        )

    # Si el tiempo de bloqueo ya expiró, restablecer contador de intentos
    if pin_locked_until and pin_locked_until <= now_utc:
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    if not current_user.transaction_pin:
        raise HTTPException(
            status_code=400,
            detail="Debes configurar tu Segunda Clave de Retiros (PIN de seguridad) en la sección 'Seguridad' antes de poder retirar fondos."
        )
    if not payload.pin or not payload.pin.strip():
        raise HTTPException(
            status_code=400,
            detail="La Segunda Clave de Retiros es obligatoria para autorizar la transacción."
        )

    from .auth import pwd_context
    if not pwd_context.verify(payload.pin.strip(), current_user.transaction_pin):
        failed_count = (getattr(current_user, "pin_failed_attempts", 0) or 0) + 1
        current_user.pin_failed_attempts = failed_count
        if failed_count >= 3:
            current_user.pin_locked_until = now_utc + timedelta(hours=24)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Has superado el límite de 3 intentos fallidos con tu Segunda Clave. Por seguridad de tu cuenta, los retiros han sido bloqueados temporalmente por 24 horas."
            )
        else:
            attempts_left = 3 - failed_count
            db.commit()
            raise HTTPException(
                status_code=401,
                detail=f"Segunda Clave de Retiros incorrecta. Te queda(n) {attempts_left} intento(s) antes de que la función de retiros sea bloqueada por 24 horas."
            )

    # Si la clave fue correcta, reiniciar contador de fallos
    if getattr(current_user, "pin_failed_attempts", 0):
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    # 3. Validación de Cuenta Bancaria Registrada y Certificada en KYC
    kyc_bank = (comp_record.bank_name or comp_record.input_bank_name) if comp_record else None
    kyc_acc_num = (comp_record.bank_account_number or comp_record.input_bank_account_number) if comp_record else None
    kyc_acc_type = (comp_record.bank_account_type or comp_record.input_bank_account_type) if comp_record else "Ahorros"
    kyc_holder = comp_record.input_full_name_cedula if (comp_record and comp_record.input_full_name_cedula) else current_user.name
    kyc_doc = comp_record.input_document_id_rut if (comp_record and comp_record.input_document_id_rut) else current_user.document_id

    if not kyc_acc_num:
        raise HTTPException(
            status_code=400,
            detail="No tienes una cuenta bancaria o billetera registrada y certificada en tu expediente KYC. Por favor actualiza tu certificación bancaria en tu perfil."
        )

    # Blindaje contra robo de fondos: solo se puede transferir a la cuenta bancaria del titular verificada en KYC
    if payload.account_number and payload.account_number.strip() != kyc_acc_num.strip():
        raise HTTPException(
            status_code=400,
            detail="Por seguridad de tu dinero, los retiros únicamente pueden realizarse hacia la cuenta bancaria certificada y verificada en tu expediente KYC."
        )

    final_bank = kyc_bank or payload.bank_name or "Banco Certificado"
    final_acc_type = kyc_acc_type or payload.account_type or "Ahorros"
    final_acc_num = kyc_acc_num
    final_holder = kyc_holder or payload.account_holder or current_user.name
    final_doc = kyc_doc or payload.document_id or current_user.document_id

    # 4. Validación de Monto y Tarifa de Uso del Sistema Escalonada
    if payload.amount_cop < MIN_WITHDRAW_COP:
        raise HTTPException(
            status_code=400,
            detail=f"El monto mínimo de retiro a Banco Personal es de ${MIN_WITHDRAW_COP:,.0f} COP ($11.00 USD)."
        )

    if payload.amount_cop > 2000000:
        fee_usd = 2.20
    elif payload.amount_cop > 1200000:
        fee_usd = 1.10
    elif payload.amount_cop > 200000:
        fee_usd = 0.50
    else:
        fee_usd = 0.0
    fee_cop = round(fee_usd * EXCHANGE_RATE)
        
    withdraw_usd = payload.amount_cop / EXCHANGE_RATE
    current_balance_usd = current_user.available_balance or 0.0
    current_balance_cop = round(current_balance_usd * EXCHANGE_RATE)
    
    if current_balance_cop < payload.amount_cop:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente para retirar. Saldo disponible: ${current_balance_cop:,.0f} COP (${current_balance_usd:.2f} USD)."
        )

    # Si tiene saldo suficiente para cubrir monto + tarifa, se descuenta monto + tarifa.
    # Si ingresó el 100% de su saldo disponible, se descuenta la tarifa del monto retirado.
    if current_balance_cop >= (payload.amount_cop + fee_cop):
        actual_deduct_usd = (payload.amount_cop + fee_cop) / EXCHANGE_RATE
        final_withdraw_cop = payload.amount_cop
        final_withdraw_usd = withdraw_usd
    else:
        actual_deduct_usd = current_balance_usd
        final_withdraw_cop = current_balance_cop - fee_cop
        final_withdraw_usd = final_withdraw_cop / EXCHANGE_RATE
        if final_withdraw_cop < MIN_WITHDRAW_COP:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente para cubrir el monto de retiro (${payload.amount_cop:,.0f} COP) más la tarifa de uso del sistema (+${fee_cop:,.0f} COP / ${fee_usd:.2f} USD)."
            )
        
    # Descontar del saldo disponible
    current_user.available_balance = max(0.0, round(current_balance_usd - actual_deduct_usd, 4))
    
    import json
    from ..database.models.withdrawal import WithdrawalRequest
    
    payment_details = {
        "bank_name": final_bank,
        "account_type": final_acc_type,
        "account_number": final_acc_num,
        "account_holder": final_holder,
        "document_id": final_doc,
        "amount_cop": final_withdraw_cop,
        "amount_usd": final_withdraw_usd,
        "system_fee_cop": fee_cop,
        "system_fee_usd": fee_usd,
        "kyc_verified": True,
        "pin_verified": True,
        "requested_at": datetime.utcnow().isoformat()
    }
    
    withdrawal = WithdrawalRequest(
        user_id=current_user.id,
        amount=final_withdraw_usd,
        source_type="driver_wallet",
        status="pending",
        payment_info=json.dumps(payment_details)
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    
    fee_note = f" (Tarifa de uso del sistema: +${fee_cop:,.0f} COP / ${fee_usd:.2f} USD)" if fee_cop > 0 else ""
    return {
        "message": f"Solicitud de retiro por ${final_withdraw_cop:,.0f} COP registrada exitosamente y autenticada con tu Segunda Clave{fee_note}. Entra en proceso de validación con un plazo de hasta 24 horas para hacerse efectiva en tu cuenta bancaria.",
        "withdrawal_id": withdrawal.id,
        "amount_cop": final_withdraw_cop,
        "amount_usd": final_withdraw_usd,
        "system_fee_cop": fee_cop,
        "system_fee_usd": fee_usd,
        "remaining_balance_cop": round(current_user.available_balance * EXCHANGE_RATE),
        "status": "pending",
        "processing_time": "Hasta 24 horas"
    }

@router.post("/driver-wallet/withdraw/{withdrawal_id}/cancel")
def cancel_driver_withdrawal(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite al conductor cancelar una solicitud de retiro que se encuentre en estado pendiente
    y reintegrar inmediatamente el saldo a su billetera.
    """
    from ..database.models.withdrawal import WithdrawalRequest
    req = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.id == withdrawal_id,
        WithdrawalRequest.user_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud de retiro no encontrada.")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar solicitudes de retiro en estado pendiente.")

    EXCHANGE_RATE = 4500.0
    refund_usd = req.amount or 0.0
    current_user.available_balance = (current_user.available_balance or 0.0) + refund_usd
    req.status = "cancelled"
    req.rejection_reason = "Cancelado por el conductor / Reintegro de saldo"
    req.processed_at = datetime.utcnow()
    db.commit()

    return {
        "message": f"Solicitud cancelada. Se han reintegrado ${round(refund_usd * EXCHANGE_RATE):,.0f} COP a tu saldo disponible.",
        "remaining_balance_cop": round(current_user.available_balance * EXCHANGE_RATE)
    }

@router.post("/driver-wallet/revert-unverified-withdrawal")
def revert_unverified_withdrawal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite al usuario revertir y reintegrar inmediatamente su retiro de prueba o cualquier retiro
    que haya quedado pendiente sin validación de Segunda Clave.
    """
    from ..database.models.withdrawal import WithdrawalRequest
    EXCHANGE_RATE = 4500.0
    pending_w = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.user_id == current_user.id,
        WithdrawalRequest.source_type == "driver_wallet",
        WithdrawalRequest.status == "pending"
    ).order_by(WithdrawalRequest.id.desc()).first()

    if not pending_w:
        return {"message": "No tienes retiros pendientes por reintegrar.", "reverted": False}

    refund_usd = pending_w.amount or 0.0
    current_user.available_balance = (current_user.available_balance or 0.0) + refund_usd
    pending_w.status = "cancelled"
    pending_w.rejection_reason = "Reversado por solicitud del conductor (Prueba sin Segunda Clave)"
    pending_w.processed_at = datetime.utcnow()
    db.commit()

    return {
        "message": f"Se han reintegrado con éxito ${round(refund_usd * EXCHANGE_RATE):,.0f} COP a tu saldo de billetera.",
        "reverted": True,
        "remaining_balance_cop": round(current_user.available_balance * EXCHANGE_RATE)
    }

# --- Admin Endpoints ---
@router.get("/admin/vehicles", status_code=status.HTTP_200_OK)
def get_pending_vehicles(
    status_filter: str = "pending",
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """ Get vehicles for admin KYC approval with complete driver and vehicle data """
    query = db.query(Vehicle)
    if status_filter != "all":
        query = query.filter(Vehicle.status == status_filter)
        
    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    
    results = []
    for v in vehicles:
        owner = v.owner
        legal = db.query(DriverLegalAudit).filter(DriverLegalAudit.conductor_id == v.user_id).order_by(DriverLegalAudit.accepted_at.desc()).first()
        
        driver_name = ""
        if owner:
            if owner.first_name or owner.last_name:
                driver_name = f"{owner.first_name or ''} {owner.last_name or ''}".strip()
            if not driver_name:
                driver_name = owner.name or owner.username or f"Usuario #{owner.id}"

        results.append({
            "id": v.id,
            "brand": v.brand,
            "model": v.model,
            "type": v.type,
            "plate": v.license_plate,
            "color": v.color,
            "year": v.year,
            "cargo_capacity_kg": v.cargo_capacity_kg,
            "status": v.status,
            "driver_id": v.user_id,
            "driver_name": driver_name,
            "driver_email": owner.email if owner else "",
            "driver_phone": owner.phone if owner else "",
            "driver_document": (owner.document_id or "") if owner else "",
            "driver_document_type": (owner.document_type or "CC") if owner else "CC",
            "driver_city": (owner.city or "") if owner else "",
            "created_at": v.created_at.isoformat() if v.created_at else None,
            # Documentos subidos por el conductor
            "selfie_url": v.selfie_url,
            "license_url": v.license_url,
            "property_card_url": v.property_card_url,
            # Capturas tomadas por el validador
            "police_record_capture_url": v.police_record_capture_url,
            "procuraduria_capture_url": v.procuraduria_capture_url,
            "runt_capture_url": v.runt_capture_url,
            "verifier_notes": v.verifier_notes,
            "verified_at": v.verified_at.isoformat() if v.verified_at else None,
            # Auditoría legal
            "terms_accepted": legal.terms_accepted if legal else False,
            "docs_declared_ok": legal.docs_declared_ok if legal else False,
            "legal_accepted_at": legal.accepted_at.isoformat() if legal and legal.accepted_at else None
        })
        
    return results

@router.get("/admin/drivers", status_code=status.HTTP_200_OK)
def get_approved_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Get all approved drivers with full profile and verification audit documents """
    vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.APPROVED).order_by(Vehicle.created_at.desc()).all()
    
    results = []
    for v in vehicles:
        owner = v.owner
        driver_name = ""
        if owner:
            if owner.first_name or owner.last_name:
                driver_name = f"{owner.first_name or ''} {owner.last_name or ''}".strip()
            if not driver_name:
                driver_name = owner.name or owner.username or f"Usuario #{owner.id}"

        results.append({
            "id": v.id,
            "driver_name": driver_name,
            "driver_phone": owner.phone if owner else "",
            "driver_email": owner.email if owner else "",
            "driver_document": (owner.document_id or "") if owner else "",
            "driver_document_type": (owner.document_type or "CC") if owner else "CC",
            "driver_city": (owner.city or "") if owner else "",
            "brand": v.brand,
            "model": v.model,
            "year": v.year,
            "type": v.type,
            "plate": v.license_plate,
            "color": v.color,
            "cargo_capacity_kg": v.cargo_capacity_kg,
            "driver_id": v.user_id,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            # Documentos conductor
            "selfie_url": v.selfie_url,
            "license_url": v.license_url,
            "property_card_url": v.property_card_url,
            # Capturas de auditoría
            "police_record_capture_url": v.police_record_capture_url,
            "procuraduria_capture_url": v.procuraduria_capture_url,
            "runt_capture_url": v.runt_capture_url,
            "verifier_notes": v.verifier_notes,
            "verified_at": v.verified_at.isoformat() if v.verified_at else None
        })
        
    return results

@router.post("/admin/vehicle/{vehicle_id}/approve", status_code=status.HTTP_200_OK)
def approve_vehicle(vehicle_id: int, action: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Approve or reject a vehicle """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if action == "approve":
        vehicle.status = VehicleStatus.APPROVED
    elif action == "reject":
        vehicle.status = VehicleStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    vehicle.verified_by_user_id = current_user.id
    vehicle.verified_at = datetime.utcnow()
    db.commit()
    return {"message": f"Vehículo {action} con éxito", "status": vehicle.status}

@router.post("/admin/vehicle/{vehicle_id}/verify-audit", status_code=status.HTTP_200_OK)
def save_vehicle_audit(
    vehicle_id: int, 
    payload: VehicleAuditUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """ Guarda las capturas oficiales de validación (Policía, Procuraduría, RUNT) y notas de auditoría """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
    if payload.police_record_capture_url is not None:
        vehicle.police_record_capture_url = payload.police_record_capture_url
    if payload.procuraduria_capture_url is not None:
        vehicle.procuraduria_capture_url = payload.procuraduria_capture_url
    if payload.runt_capture_url is not None:
        vehicle.runt_capture_url = payload.runt_capture_url
    if payload.verifier_notes is not None:
        vehicle.verifier_notes = payload.verifier_notes

    vehicle.verified_by_user_id = current_user.id
    vehicle.verified_at = datetime.utcnow()

    if payload.action == "approve":
        vehicle.status = VehicleStatus.APPROVED
    elif payload.action == "reject":
        vehicle.status = VehicleStatus.REJECTED

    db.commit()
    return {
        "message": "Auditoría de validación guardada exitosamente",
        "status": vehicle.status,
        "verified_at": vehicle.verified_at.isoformat()
    }
