"""
notification_service.py
========================
Servicio unificado de notificaciones para todos los eventos del ciclo de pedidos.

Canales soportados:
  - Email (Gmail SMTP) ← ACTIVO HOY
  - WhatsApp (Twilio / Meta Cloud API) ← LISTO PARA ACTIVAR (agregar credenciales)

Uso:
  from backend.services.notification_service import notify_order_event
  notify_order_event("payment_confirmed", order, user, db)
"""

import smtplib
import os
import logging
import json
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ============================================================
# CONFIG — Leído automáticamente de variables de entorno
# ============================================================
SMTP_SERVER   = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
EMAIL_SENDER  = os.getenv("EMAIL_SENDER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
COMPANY_NAME  = "Centro Comercial Virtual TEI"
BASE_URL      = os.getenv("FRONTEND_URL", "https://tuempresainternacional.com")

# WhatsApp — Agregar credenciales la próxima semana
TWILIO_SID       = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN     = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WA_FROM   = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Sandbox
META_WA_TOKEN    = os.getenv("META_WA_TOKEN", "")
META_WA_PHONE_ID = os.getenv("META_WA_PHONE_ID", "")

WHATSAPP_ENABLED = bool(TWILIO_SID and TWILIO_TOKEN) or bool(META_WA_TOKEN)


# ============================================================
# PLANTILLAS DE EMAIL HTML
# ============================================================

def _email_wrapper(title: str, color: str, icon: str, body_html: str) -> str:
    """Genera el wrapper base del email con el diseño de TEI."""
    return f"""
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, {color} 0%, #1e3a8a 100%); padding: 30px; text-align: center; color: white;">
          <div style="font-size: 52px; margin-bottom: 10px;">{icon}</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">{title}</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 13px;">{COMPANY_NAME}</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px 35px;">
          {body_html}
        </div>

        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© {datetime.now().year} {COMPANY_NAME}. Todos los derechos reservados.</p>
          <p style="margin: 5px 0 0;">Esta empresa es de Dios y para su Gloria. 🙏</p>
          <p style="margin: 5px 0 0;">
            <a href="{BASE_URL}/dashboard/orders" style="color: #60a5fa; text-decoration: none;">Ver mis pedidos</a>
            &nbsp;|&nbsp;
            <a href="mailto:soporte@tuempresainternacional.com" style="color: #60a5fa; text-decoration: none;">Soporte</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    """


def _get_template(event: str, order, user, extra: dict = None) -> dict:
    """
    Retorna subject, html_body y whatsapp_message según el evento.
    
    Eventos soportados:
      - payment_confirmed
      - in_transit
      - ready_for_pickup
      - delivered
      - batch_shipped    (solo WhatsApp/Email al encargado del punto)
    """
    extra = extra or {}
    customer_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() or getattr(user, 'name', 'Cliente')
    order_id = order.id
    tracking = getattr(order, 'tracking_number', None) or 'Pendiente'
    dashboard_url = f"{BASE_URL}/dashboard/orders"

    # ─── PAGO CONFIRMADO ───────────────────────────────────────────
    if event == "payment_confirmed":
        subject = f"✅ Pago Confirmado — Pedido #{order_id} | TEI"
        body = f"""
        <p style="font-size: 16px;">Hola <strong>{customer_name}</strong>,</p>
        <p>¡Excelente noticia! Tu pago por el <strong>Pedido #{order_id}</strong> fue confirmado exitosamente. 
        Ya estamos preparando tu paquete con todo el cuidado que mereces.</p>

        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin:0; color: #15803d; font-weight: 700;">📦 Pedido #{order_id}</p>
          <p style="margin: 5px 0 0; color: #166534;">Estado: <strong>En preparación</strong></p>
          <p style="margin: 5px 0 0; color: #166534;">Total: <strong>$ {order.total_cop:,.0f} COP</strong></p>
        </div>

        <p>Tu factura electrónica DIAN será enviada a este correo por Siigo en los próximos momentos.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{dashboard_url}" style="background: linear-gradient(to right, #22c55e, #16a34a); color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
            📋 Ver mi Pedido
          </a>
        </div>
        """
        wa_msg = (
            f"✅ *¡Pago Confirmado! - TEI*\n\n"
            f"Hola {customer_name} 👋\n"
            f"Tu pedido *#{order_id}* fue pagado exitosamente.\n"
            f"Ya estamos alistando tu paquete 📦\n\n"
            f"Revisa tu estado aquí:\n{dashboard_url}"
        )

    # ─── EN TRÁNSITO ───────────────────────────────────────────────
    elif event == "in_transit":
        subject = f"🚛 Tu pedido #{order_id} está en camino a tu ciudad | TEI"
        body = f"""
        <p style="font-size: 16px;">Hola <strong>{customer_name}</strong>,</p>
        <p>¡Buenas noticias! Tu pedido <strong>#{order_id}</strong> ha salido de nuestra bodega central 
        y está en camino a tu ciudad de destino.</p>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin:0; color: #1d4ed8; font-weight: 700;">🚛 Información del Envío</p>
          <p style="margin: 5px 0 0; color: #1e40af;">Pedido: <strong>#{order_id}</strong></p>
          <p style="margin: 5px 0 0; color: #1e40af;">Guía: <strong>{tracking}</strong></p>
          <p style="margin: 5px 0 0; color: #1e40af;">Transportadora: <strong>Inter Rapidísimo</strong></p>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Te notificaremos nuevamente cuando tu paquete llegue al punto de entrega de tu ciudad.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{dashboard_url}" style="background: linear-gradient(to right, #3b82f6, #1d4ed8); color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
            🔍 Rastrear mi Pedido
          </a>
        </div>
        """
        wa_msg = (
            f"🚛 *Tu pedido va en camino - TEI*\n\n"
            f"Hola {customer_name} 👋\n"
            f"Tu pedido *#{order_id}* ya está en tránsito a tu ciudad.\n"
            f"Guía: *{tracking}*\n"
            f"Transportadora: Inter Rapidísimo\n\n"
            f"Te avisamos cuando llegue 📍"
        )

    # ─── LISTO PARA ENTREGA ────────────────────────────────────────
    elif event == "ready_for_pickup":
        point_name = extra.get("point_name", "el punto de entrega de tu ciudad")
        point_address = extra.get("point_address", "Consulta la dirección con el encargado")
        subject = f"📍 ¡Tu pedido #{order_id} llegó! Pasa a recogerlo | TEI"
        body = f"""
        <p style="font-size: 16px;">Hola <strong>{customer_name}</strong>,</p>
        <p>¡Tu pedido <strong>#{order_id}</strong> ya llegó a tu ciudad! 🎉 Por favor pasa a recogerlo 
        a la mayor brevedad posible.</p>

        <div style="background: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin:0; color: #c2410c; font-weight: 700; font-size: 18px;">📍 ¡Tu Paquete Te Espera!</p>
          <p style="margin: 8px 0 0; color: #9a3412;"><strong>Punto de Entrega:</strong> {point_name}</p>
          <p style="margin: 5px 0 0; color: #9a3412;"><strong>Dirección:</strong> {point_address}</p>
          <p style="margin: 5px 0 0; color: #9a3412;"><strong># de Pedido:</strong> #{order_id}</p>
        </div>

        <p style="font-size: 14px; color: #6b7280; font-style: italic;">
          🪪 No olvides llevar tu cédula o el número de pedido para reclamarlo.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{dashboard_url}" style="background: linear-gradient(to right, #f97316, #ea580c); color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
            📋 Ver Detalles del Pedido
          </a>
        </div>
        """
        wa_msg = (
            f"📍 *¡Tu pedido llegó! - TEI*\n\n"
            f"Hola {customer_name} 👋\n"
            f"Tu pedido *#{order_id}* ya llegó a tu ciudad.\n\n"
            f"*Punto de Entrega:* {point_name}\n"
            f"*Dirección:* {point_address}\n\n"
            f"🪪 Lleva tu cédula o el N° de pedido para reclamarlo.\n"
            f"¡Te esperamos!"
        )

    # ─── ENTREGADO ─────────────────────────────────────────────────
    elif event == "delivered":
        subject = f"🎉 ¡Pedido #{order_id} entregado! Gracias por comprar en TEI"
        body = f"""
        <p style="font-size: 16px;">Hola <strong>{customer_name}</strong>,</p>
        <p>¡Felicitaciones! Tu pedido <strong>#{order_id}</strong> fue entregado exitosamente. 
        Esperamos que disfrutes tu compra al máximo.</p>

        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 64px;">🎉</div>
          <p style="color: #15803d; font-weight: 700; font-size: 18px; margin: 10px 0;">¡Pedido Completado!</p>
          <p style="color: #166534; margin: 0;">Pedido #{order_id} — {datetime.now().strftime('%d/%m/%Y')}</p>
        </div>

        <p>¿Tuviste algún inconveniente? No dudes en contactarnos.</p>
        <p>Recuerda que puedes ver el historial de todos tus pedidos en tu oficina virtual.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{BASE_URL}/dashboard/store" style="background: linear-gradient(to right, #8b5cf6, #6d28d9); color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
            🛍️ Seguir Comprando
          </a>
        </div>
        """
        wa_msg = (
            f"🎉 *¡Pedido Entregado! - TEI*\n\n"
            f"Hola {customer_name} 👋\n"
            f"Tu pedido *#{order_id}* fue entregado. ¡Gracias por confiar en nosotros!\n\n"
            f"¿Tienes algún comentario? Escríbenos:\n"
            f"soporte@tuempresainternacional.com"
        )

    else:
        return None

    return {
        "subject": subject,
        "html": _email_wrapper(
            title=subject.split("—")[0].strip(),
            color="#1e3a8a",
            icon=event == "payment_confirmed" and "✅" or
                 event == "in_transit" and "🚛" or
                 event == "ready_for_pickup" and "📍" or "🎉",
            body_html=body
        ),
        "whatsapp_text": wa_msg,
        "to_email": getattr(user, 'email', None),
        "to_phone": getattr(user, 'phone_number', None) or getattr(user, 'phone', None),
    }


# ============================================================
# ENVÍO DE EMAIL
# ============================================================

def _send_email(to_email: str, subject: str, html: str):
    """Envía un email via Gmail SMTP. Falla silenciosamente para no bloquear el flujo."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        logger.warning("⚠️ EMAIL_SENDER o EMAIL_PASSWORD no configurados. Email NO enviado.")
        return False
    if not to_email:
        logger.warning("⚠️ Destinatario de email vacío. Saltando.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"TEI Notificaciones <{EMAIL_SENDER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD.replace(" ", ""))
            server.sendmail(EMAIL_SENDER, to_email, msg.as_string())

        logger.info(f"📧 Email '{subject}' enviado a {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Error enviando email a {to_email}: {e}")
        return False


# ============================================================
# ENVÍO DE WHATSAPP
# ============================================================

def _send_whatsapp(to_phone: str, message: str):
    """
    Envía un WhatsApp. Soporta Twilio o Meta Cloud API.
    Agrega TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN para activar.
    """
    if not WHATSAPP_ENABLED:
        logger.info(f"💬 WhatsApp desactivado (sin credenciales). Msg para {to_phone}: {message[:50]}...")
        return False

    if not to_phone:
        logger.warning("⚠️ Teléfono vacío. WhatsApp no enviado.")
        return False

    # Normalizar teléfono colombiano: asegurar +57
    clean_phone = to_phone.replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        clean_phone = f"+57{clean_phone}" if len(clean_phone) == 10 else f"+{clean_phone}"

    # ── Twilio (activar cuando llegue el celular) ──
    if TWILIO_SID and TWILIO_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_SID, TWILIO_TOKEN)
            msg = client.messages.create(
                from_=TWILIO_WA_FROM,
                body=message,
                to=f"whatsapp:{clean_phone}"
            )
            logger.info(f"✅ WhatsApp Twilio enviado a {clean_phone}: SID {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"❌ Error WhatsApp Twilio: {e}")

    # ── Meta Cloud API (alternativa) ──
    if META_WA_TOKEN and META_WA_PHONE_ID:
        try:
            resp = requests.post(
                f"https://graph.facebook.com/v19.0/{META_WA_PHONE_ID}/messages",
                headers={"Authorization": f"Bearer {META_WA_TOKEN}", "Content-Type": "application/json"},
                json={
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message}
                },
                timeout=10
            )
            if resp.status_code == 200:
                logger.info(f"✅ WhatsApp Meta enviado a {clean_phone}")
                return True
            else:
                logger.error(f"❌ Error WhatsApp Meta: {resp.text}")
        except Exception as e:
            logger.error(f"❌ Error WhatsApp Meta: {e}")

    return False


# ============================================================
# FUNCIÓN PRINCIPAL — PUNTO DE ENTRADA
# ============================================================

def notify_order_event(event: str, order, user, db=None, extra: dict = None):
    """
    Envía notificaciones para un evento del ciclo de pedido.
    
    Args:
        event: 'payment_confirmed' | 'in_transit' | 'ready_for_pickup' | 'delivered'
        order: Objeto Order de SQLAlchemy
        user:  Objeto User de SQLAlchemy
        db:    Sesión de DB (opcional, para futuros logs)
        extra: Datos extra (e.g. {'point_name': '...', 'point_address': '...'})
    
    Diseñado para ser NO-BLOQUEANTE: si falla el email, el pedido continúa.
    """
    try:
        template = _get_template(event, order, user, extra)
        if not template:
            logger.warning(f"⚠️ Evento '{event}' no tiene plantilla. Saltando notificación.")
            return

        # Enviar Email
        _send_email(
            to_email=template["to_email"],
            subject=template["subject"],
            html=template["html"]
        )

        # Enviar WhatsApp (cuando esté habilitado)
        _send_whatsapp(
            to_phone=template["to_phone"],
            message=template["whatsapp_text"]
        )

    except Exception as e:
        # NUNCA debe detener el flujo de pago
        logger.error(f"❌ Error en notify_order_event('{event}'): {e}")
