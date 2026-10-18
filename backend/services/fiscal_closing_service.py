"""
fiscal_closing_service.py — Motor de Cierre Fiscal Mensual y Facturación Consolidada Siigo -> DIAN
Aplica el Modelo Financiero en Cascada (5 Pasos) idénticamente para:
  1. Conductores TEI RIDE (Todo lo que el conductor paga a TEI RIDE en el mes por comisiones y cupos)
  2. Negocios Aliados / Comercios Aliados (Todo lo que el negocio aliado liquida a TEI en el mes por comisiones)

Se ejecuta automáticamente el último día de cada mes a las 23:00 horas (Hora Colombia)
y también puede previsualizarse o ejecutarse desde el Panel Administrativo.
"""
import calendar
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.database.models.user import User
from backend.database.models.transport import Trip, TripStatus, DriverCredit
from backend.database.models.merchant import Merchant
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.database.models.merchant_credit import MerchantCredit
from backend.database.models.monthly_fiscal_closing import MonthlyFiscalClosing
from backend.services.siigo_service import emit_consolidated_monthly_invoice

logger = logging.getLogger(__name__)

WOMPI_RATE_PCT = 0.0265       # 2.65% tarifa real pasarela Wompi
WOMPI_FIXED_COP = 700.0       # + $700 COP por transacción de pasarela
NETWORK_SHARE_PCT = 0.915     # 91.5% Comunidad de Consumidores (50% Caja Fuerte / 50% Bolsa Fidelización TEI)
TEI_GROSS_SHARE_PCT = 0.085   # 8.5% Ganancia Bruta Real de TEI
IVA_RATE = 0.19               # 19% IVA DIAN sobre la base gravable del 8.5%
ICA_BOGOTA_RATE = 0.00966     # 9.66 x 1000 (0.966%) ICA Distrital Bogotá sobre base sin IVA
RENTA_DIAN_RATE = 0.35        # 35% Provisión Impuesto de Renta DIAN


def calculate_5_step_cascade(
    gross_collected_cop: float,
    movements_count: int = 1,
    gateway_tx_count: int = 1,
    wompi_pct: float = WOMPI_RATE_PCT,
    wompi_fixed_cop: float = WOMPI_FIXED_COP
) -> Dict[str, float]:
    """
    Calcula con exactitud matemática los 5 pasos del modelo de Mandato y Recaudo para Terceros:
      Paso 1: Recaudo Bruto (-) Comisión Real Pasarela Wompi (2.65% + $700 COP * N_tx) = Remanente Neto
      Paso 2: Distribución a la Red de Vendedores (91.5% del Remanente):
              - 50% a Caja Fuerte (bank_balance)
              - 50% a Bolsa de Fidelización TEI (purchase_balance)
      Paso 3: Ganancia Bruta Real de TEI (8.5% del Remanente)
      Paso 4: Impuestos Corporativos sobre el 8.5% (Base Gravable = 8.5% / 1.19, IVA 19%, ICA 9.66x1000)
      Paso 5: Utilidad Antes de Renta, Provisión Renta DIAN (35%) y Utilidad Neta Final en Chequera TEI
    """
    gross = round(max(0.0, float(gross_collected_cop or 0.0)), 2)
    if gross <= 0:
        return {
            "movements_count": 0,
            "gateway_tx_count": 0,
            "gross_collected_cop": 0.0,
            "wompi_fee_cop": 0.0,
            "net_after_gateway_cop": 0.0,
            "network_91_5_cop": 0.0,
            "vault_50_cop": 0.0,
            "loyalty_bag_50_cop": 0.0,
            "tei_gross_8_5_cop": 0.0,
            "tei_taxable_base_cop": 0.0,
            "iva_19_cop": 0.0,
            "ica_bogota_cop": 0.0,
            "profit_before_tax_cop": 0.0,
            "income_tax_35_cop": 0.0,
            "net_profit_tei_cop": 0.0,
        }

    tx_cnt = max(1, int(gateway_tx_count or 1))
    wompi_fee = round((gross * wompi_pct) + (wompi_fixed_cop * tx_cnt), 2)
    if wompi_fee >= gross:
        wompi_fee = round(gross * wompi_pct, 2)

    net_after_gateway = round(gross - wompi_fee, 2)
    network_91_5 = round(net_after_gateway * NETWORK_SHARE_PCT, 2)
    vault_50 = round(network_91_5 * 0.50, 2)
    loyalty_50 = round(network_91_5 - vault_50, 2)

    tei_gross_8_5 = round(net_after_gateway - network_91_5, 2)
    tei_taxable_base = round(tei_gross_8_5 / (1.0 + IVA_RATE), 2)
    iva_19 = round(tei_gross_8_5 - tei_taxable_base, 2)
    ica_bogota = round(tei_taxable_base * ICA_BOGOTA_RATE, 2)

    profit_before_tax = round(tei_taxable_base - ica_bogota, 2)
    income_tax_35 = round(max(0.0, profit_before_tax * RENTA_DIAN_RATE), 2)
    net_profit_tei = round(profit_before_tax - income_tax_35, 2)

    return {
        "movements_count": int(movements_count or 1),
        "gateway_tx_count": tx_cnt,
        "gross_collected_cop": gross,
        "wompi_fee_cop": wompi_fee,
        "net_after_gateway_cop": net_after_gateway,
        "network_91_5_cop": network_91_5,
        "vault_50_cop": vault_50,
        "loyalty_bag_50_cop": loyalty_50,
        "tei_gross_8_5_cop": tei_gross_8_5,
        "tei_taxable_base_cop": tei_taxable_base,
        "iva_19_cop": iva_19,
        "ica_bogota_cop": ica_bogota,
        "profit_before_tax_cop": profit_before_tax,
        "income_tax_35_cop": income_tax_35,
        "net_profit_tei_cop": net_profit_tei,
    }


def _get_month_bounds(year: int, month: int):
    last_day = calendar.monthrange(year, month)[1]
    start_dt = datetime(year, month, 1, 0, 0, 0)
    end_dt = datetime(year, month, last_day, 23, 59, 59)
    period_key = f"{year:04d}-{month:02d}"
    return start_dt, end_dt, period_key


def collect_monthly_entities(db: Session, year: int, month: int) -> Dict[str, Any]:
    """
    Agrupa todos los movimientos de:
      1. Conductores TEI RIDE en el mes (Viajes completados + recargos/cupos liquidados en el mes)
      2. Negocios Aliados en el mes (Comisiones de ventas físicas/virtuales + recargos/cupos liquidados)
    """
    start_dt, end_dt, period_key = _get_month_bounds(year, month)

    # ── 1. CONDUCTORES TEI RIDE ──
    completed_trips = db.query(Trip).filter(
        Trip.status == TripStatus.COMPLETED,
        Trip.driver_id.isnot(None),
        Trip.created_at >= start_dt,
        Trip.created_at <= end_dt
    ).all()

    driver_credits = db.query(DriverCredit).filter(
        DriverCredit.created_at >= start_dt,
        DriverCredit.created_at <= end_dt
    ).all()

    driver_map: Dict[int, Dict[str, Any]] = {}
    for t in completed_trips:
        d_id = t.driver_id
        if d_id not in driver_map:
            driver_map[d_id] = {"gross_cop": 0.0, "movements": 0, "gateway_tx": 0}
        fee_cop = float(t.platform_fee or 0.0)
        if fee_cop <= 0 and (t.final_price or t.proposed_price):
            fee_cop = float((t.final_price or t.proposed_price) * 0.15)
        driver_map[d_id]["gross_cop"] += fee_cop
        driver_map[d_id]["movements"] += 1

    for dc in driver_credits:
        d_id = dc.driver_id
        if d_id not in driver_map:
            driver_map[d_id] = {"gross_cop": 0.0, "movements": 0, "gateway_tx": 0}
        # Recargos administrativos ($450) y normalización ($2.000) pagados en el mes
        surcharge_cop = float(dc.admin_fee_cop or 0.0) + float(dc.overdue_fee_cop or 0.0)
        if surcharge_cop > 0:
            driver_map[d_id]["gross_cop"] += surcharge_cop
            driver_map[d_id]["movements"] += 1
            driver_map[d_id]["gateway_tx"] += 1

    drivers_rows: List[Dict[str, Any]] = []
    for d_id, info in driver_map.items():
        if info["gross_cop"] <= 0:
            continue
        user = db.query(User).filter(User.id == d_id).first()
        tx_cnt = max(1, info["gateway_tx"] if info["gateway_tx"] > 0 else 1)
        cascade = calculate_5_step_cascade(
            gross_collected_cop=info["gross_cop"],
            movements_count=info["movements"],
            gateway_tx_count=tx_cnt
        )
        drivers_rows.append({
            "entity_type": "driver",
            "user_id": d_id,
            "merchant_id": None,
            "entity_name": (user.name or user.username) if user else f"Conductor #{d_id}",
            "document_id": (user.document_id or "SIN-DOC") if user else "SIN-DOC",
            "city": (user.city or "Bogotá") if user else "Bogotá",
            **cascade
        })

    # ── 2. NEGOCIOS ALIADOS (COMERCIOS ALIADOS) ──
    phys_txs = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id.isnot(None),
        PhysicalTransaction.created_at >= start_dt,
        PhysicalTransaction.created_at <= end_dt
    ).all()

    merch_credits = db.query(MerchantCredit).filter(
        MerchantCredit.created_at >= start_dt,
        MerchantCredit.created_at <= end_dt
    ).all()

    merchant_map: Dict[int, Dict[str, Any]] = {}
    for ptx in phys_txs:
        m_id = ptx.merchant_id
        if m_id not in merchant_map:
            merchant_map[m_id] = {"gross_cop": 0.0, "movements": 0, "gateway_tx": 0}
        merchant_map[m_id]["gross_cop"] += float(ptx.commission_amount or 0.0)
        merchant_map[m_id]["movements"] += 1

    for mc in merch_credits:
        m_id = mc.merchant_id
        if m_id not in merchant_map:
            merchant_map[m_id] = {"gross_cop": 0.0, "movements": 0, "gateway_tx": 0}
        surcharge_cop = float(mc.admin_fee_cop or 0.0) + float(mc.overdue_fee_cop or 0.0)
        if surcharge_cop > 0:
            merchant_map[m_id]["gross_cop"] += surcharge_cop
            merchant_map[m_id]["movements"] += 1
            merchant_map[m_id]["gateway_tx"] += 1

    merchants_rows: List[Dict[str, Any]] = []
    for m_id, info in merchant_map.items():
        if info["gross_cop"] <= 0:
            continue
        merchant = db.query(Merchant).filter(Merchant.id == m_id).first()
        tx_cnt = max(1, info["gateway_tx"] if info["gateway_tx"] > 0 else 1)
        cascade = calculate_5_step_cascade(
            gross_collected_cop=info["gross_cop"],
            movements_count=info["movements"],
            gateway_tx_count=tx_cnt
        )
        merchants_rows.append({
            "entity_type": "merchant",
            "user_id": merchant.user_id if merchant else None,
            "merchant_id": m_id,
            "entity_name": merchant.name if merchant else f"Comercio Aliado #{m_id}",
            "document_id": (merchant.document_id or "SIN-NIT") if merchant else "SIN-NIT",
            "city": (merchant.city or "Bogotá") if merchant else "Bogotá",
            **cascade
        })

    all_rows = drivers_rows + merchants_rows

    def _sum_field(rows: List[Dict[str, Any]], key: str) -> float:
        return round(sum(float(r.get(key, 0.0) or 0.0) for r in rows), 2)

    totals = {
        "period_key": period_key,
        "year": year,
        "month": month,
        "drivers_count": len(drivers_rows),
        "merchants_count": len(merchants_rows),
        "total_invoices_count": len(all_rows),
        "total_movements_count": int(sum(r["movements_count"] for r in all_rows)),
        "gross_collected_cop": _sum_field(all_rows, "gross_collected_cop"),
        "wompi_fee_cop": _sum_field(all_rows, "wompi_fee_cop"),
        "net_after_gateway_cop": _sum_field(all_rows, "net_after_gateway_cop"),
        "network_91_5_cop": _sum_field(all_rows, "network_91_5_cop"),
        "vault_50_cop": _sum_field(all_rows, "vault_50_cop"),
        "loyalty_bag_50_cop": _sum_field(all_rows, "loyalty_bag_50_cop"),
        "tei_gross_8_5_cop": _sum_field(all_rows, "tei_gross_8_5_cop"),
        "tei_taxable_base_cop": _sum_field(all_rows, "tei_taxable_base_cop"),
        # Gran Total Entidades del Estado:
        "dian_iva_19_cop": _sum_field(all_rows, "iva_19_cop"),
        "hacienda_ica_bogota_cop": _sum_field(all_rows, "ica_bogota_cop"),
        "profit_before_tax_cop": _sum_field(all_rows, "profit_before_tax_cop"),
        "dian_income_tax_35_cop": _sum_field(all_rows, "income_tax_35_cop"),
        "total_dian_cop": round(_sum_field(all_rows, "iva_19_cop") + _sum_field(all_rows, "income_tax_35_cop"), 2),
        "total_state_entities_cop": round(
            _sum_field(all_rows, "iva_19_cop")
            + _sum_field(all_rows, "ica_bogota_cop")
            + _sum_field(all_rows, "income_tax_35_cop"),
            2
        ),
        "net_profit_tei_cop": _sum_field(all_rows, "net_profit_tei_cop"),
    }

    # Ejemplo de Referencia Auditado ($1.000.000 COP Brutos en 1 pago Wompi)
    reference_example_1m = calculate_5_step_cascade(1000000.0, movements_count=1, gateway_tx_count=1)

    return {
        "period_key": period_key,
        "year": year,
        "month": month,
        "totals": totals,
        "drivers": drivers_rows,
        "merchants": merchants_rows,
        "reference_example_1m": reference_example_1m,
    }


def execute_monthly_fiscal_closing(db: Session, year: int, month: int, emit_siigo: bool = True) -> Dict[str, Any]:
    """
    Ejecuta el Cierre Fiscal Mensual a las 23:00h del último día del mes (o bajo demanda del Admin):
    Guarda o actualiza cada registro en `monthly_fiscal_closings` y emite la Factura Electrónica
    Consolidada individual en Siigo -> DIAN para cada Conductor TEI RIDE y cada Negocio Aliado.
    """
    summary = collect_monthly_entities(db, year, month)
    period_key = summary["period_key"]
    all_entities = summary["drivers"] + summary["merchants"]

    emitted_records = []
    for item in all_entities:
        existing = db.query(MonthlyFiscalClosing).filter(
            MonthlyFiscalClosing.period_key == period_key,
            MonthlyFiscalClosing.entity_type == item["entity_type"],
            MonthlyFiscalClosing.user_id == item["user_id"],
            MonthlyFiscalClosing.merchant_id == item["merchant_id"]
        ).first()

        if not existing:
            existing = MonthlyFiscalClosing(
                period_year=year,
                period_month=month,
                period_key=period_key,
                entity_type=item["entity_type"],
                user_id=item["user_id"],
                merchant_id=item["merchant_id"],
            )
            db.add(existing)

        existing.entity_name = item["entity_name"]
        existing.document_id = item["document_id"]
        existing.city = item["city"]
        existing.movements_count = item["movements_count"]
        existing.gateway_tx_count = item["gateway_tx_count"]
        existing.gross_collected_cop = item["gross_collected_cop"]
        existing.wompi_fee_cop = item["wompi_fee_cop"]
        existing.net_after_gateway_cop = item["net_after_gateway_cop"]
        existing.network_91_5_cop = item["network_91_5_cop"]
        existing.vault_50_cop = item["vault_50_cop"]
        existing.loyalty_bag_50_cop = item["loyalty_bag_50_cop"]
        existing.tei_gross_8_5_cop = item["tei_gross_8_5_cop"]
        existing.tei_taxable_base_cop = item["tei_taxable_base_cop"]
        existing.iva_19_cop = item["iva_19_cop"]
        existing.ica_bogota_cop = item["ica_bogota_cop"]
        existing.profit_before_tax_cop = item["profit_before_tax_cop"]
        existing.income_tax_35_cop = item["income_tax_35_cop"]
        existing.net_profit_tei_cop = item["net_profit_tei_cop"]

        db.commit()
        db.refresh(existing)

        if emit_siigo and existing.siigo_status not in ("emitida", "emitida_local"):
            user_obj = db.query(User).filter(User.id == existing.user_id).first() if existing.user_id else None
            emit_consolidated_monthly_invoice(existing, user_obj, db)

        emitted_records.append({
            "id": existing.id,
            "entity_type": existing.entity_type,
            "entity_name": existing.entity_name,
            "document_id": existing.document_id,
            "gross_collected_cop": existing.gross_collected_cop,
            "wompi_fee_cop": existing.wompi_fee_cop,
            "network_91_5_cop": existing.network_91_5_cop,
            "tei_gross_8_5_cop": existing.tei_gross_8_5_cop,
            "iva_19_cop": existing.iva_19_cop,
            "ica_bogota_cop": existing.ica_bogota_cop,
            "income_tax_35_cop": existing.income_tax_35_cop,
            "net_profit_tei_cop": existing.net_profit_tei_cop,
            "siigo_status": existing.siigo_status,
            "siigo_invoice_id": existing.siigo_invoice_id,
            "cufe": existing.cufe,
            "legal_observations": existing.legal_observations,
        })

    return {
        "message": f"Cierre Fiscal Mensual {period_key} procesado exitosamente ({len(emitted_records)} facturas consolidadas).",
        "period_key": period_key,
        "totals": summary["totals"],
        "records": emitted_records,
    }
