import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from datetime import datetime
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _send_email_message(to_email: str, subject: str, html_content: str, from_name: str, from_email: str) -> bool:
    """
    Helper function to send email, trying Mailgun API first if configured,
    and falling back to SMTP otherwise.
    """
    mailgun_key = os.getenv("MAILGUN_API_KEY")
    mailgun_domain = os.getenv("MAILGUN_DOMAIN")
    mailgun_url = os.getenv("MAILGUN_API_URL", "https://api.mailgun.net").rstrip("/")

    if mailgun_key and mailgun_domain:
        try:
            url = f"{mailgun_url}/v3/{mailgun_domain}/messages"
            auth = ("api", mailgun_key)
            data = {
                "from": f"{from_name} <{from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            logger.info(f"Sending email to {to_email} via Mailgun HTTP API...")
            response = httpx.post(url, auth=auth, data=data, timeout=10.0)
            if response.status_code == 200:
                logger.info(f"Email sent successfully via Mailgun to {to_email}")
                return True
            else:
                logger.error(f"Mailgun API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error sending email via Mailgun API: {str(e)}")
            # Fallback to SMTP

    # Fallback to SMTP
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        password = os.getenv("EMAIL_PASSWORD")

        if not sender_email or not password:
            logger.warning("Email credentials not found. SMTP email was not sent.")
            return False

        clean_password = password.replace(" ", "")

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{from_name} <{from_email}>"
        message["To"] = to_email

        part = MIMEText(html_content, "html")
        message.attach(part)

        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        logger.info(f"Sending email to {to_email} via SMTP ({smtp_server}:{smtp_port})...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, clean_password)
            server.sendmail(sender_email, to_email, message.as_string())

        logger.info(f"Email sent successfully via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {to_email}: {str(e)}")
        return False


def send_welcome_email(to_email: str, username: str, full_name: str, referral_link: str):
    """
    Sends a welcome email to a new user.
    """
    try:
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
                <div style="font-size: 40px; margin-bottom: 10px;">🌟</div>
                <h1 style="margin: 0; font-size: 26px;">¡Felicidades y Bienvenido!</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Hoy comienza tu camino hacia la libertad financiera.</p>
              </div>
              <div style="padding: 35px 30px;">
                <p style="font-size: 16px;">Hola <strong>{full_name}</strong>,</p>
                <p style="font-size: 16px;">Nos llena de emoción darte la bienvenida a la <strong>Familia TEI (Centro Comercial Virtual)</strong>. Has tomado una de las decisiones más importantes para tu futuro: <strong>has dado el primer paso hacia la construcción de tus sueños.</strong></p>
                
                <p style="font-size: 16px;">A partir de hoy, cuentas con todas las herramientas para generar ingresos, crecer profesionalmente y alcanzar esa libertad financiera que tanto anhelas. ¡Nosotros estamos aquí para apoyarte en cada etapa de tu éxito!</p>
                
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 20px; margin: 25px 0;">
                  <h4 style="margin: 0 0 15px 0; color: #0369a1; font-size: 16px;">Tus Credenciales de Acceso</h4>
                  <p style="margin: 0 0 10px 0; font-size: 15px;">👤 <strong>Usuario:</strong> {username}</p>
                  <p style="margin: 0; font-size: 15px;">🔗 <strong>Tu Enlace de Referido Exclusivo:</strong><br/>
                  <a href="{referral_link}" style="color: #2563eb; text-decoration: none; word-break: break-all;">{referral_link}</a></p>
                </div>

                <p style="font-size: 16px; text-align: center; font-weight: bold; color: #1e3a8a;">¡Tu negocio ya está en marcha! Explora tu oficina virtual y prepárate para brillar.</p>
                
                <div style="text-align: center; margin-top: 35px;">
                  <a href="https://tuempresainternacional.com/login" style="background: linear-gradient(to right, #3b82f6, #1e40af); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">
                    Ingresar a mi Oficina Virtual
                  </a>
                </div>
              </div>
              <div style="background-color: #1f2937; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                <p style="margin: 0;">&copy; {datetime.now().year} Centro Comercial Virtual TEI. Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0;">Esta empresa es de Dios y para su Gloria.</p>
              </div>
            </div>
          </body>
        </html>
        """
        _send_email_message(
            to_email=to_email,
            subject="¡Bienvenido a Tienda Virtual TEI! 🚀",
            html_content=html,
            from_name="Bienvenida TEI",
            from_email="bienvenida@tuempresainternacional.online"
        )
    except Exception as e:
        logger.error(f"Failed in send_welcome_email process to {to_email}: {str(e)}")


def send_order_invoice_email(order_data: dict, user_email: str):
    """
    Sends an invoice/shipping confirmation email.
    """
    try:
        # Format items list
        items_html = ""
        for item in order_data['items']:
            items_html += f"""
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; color: #333;">{item['product_name']}</td>
                <td style="padding: 10px; text-align: center; color: #333;">{item['quantity']}</td>
                <td style="padding: 10px; text-align: right; color: #333;">${item['subtotal_usd']:.2f}</td>
            </tr>
            """

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <div style="background-color: #1e3a8a; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">¡Tu Pedido va en Camino! 🚚</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Orden #{order_data['id']}</p>
              </div>

              <div style="padding: 30px;">
                <p>Hola,</p>
                <p>Gracias por tu compra en <strong>Centro Comercial Virtual TEI</strong>. Nos complace informarte que tu pedido ha sido procesado y enviado.</p>
                
                <h3 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-top: 30px;">Detalle del Pedido</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8fafc; text-align: left;">
                            <th style="padding: 10px;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total Pagado:</td>
                            <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #1e3a8a; font-size: 18px;">${order_data['total_usd']:.2f} USD</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-top: 30px;">
                    <h4 style="margin: 0 0 10px 0; color: #0369a1;">📍 Dirección de Envío</h4>
                    <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                        {order_data.get('shipping_address', 'Dirección registrada en perfil')}
                    </p>
                    {f'<p style="margin: 10px 0 0 0; font-weight: bold; color: #0c4a6e;">Guía de Rastreo: {order_data["tracking_number"]}</p>' if order_data.get("tracking_number") else ''}
                </div>

                <p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    * Este correo sirve como comprobante de tu pedido. La factura electrónica con numeración oficial será enviada próximamente según la normativa vigente.
                </p>
              </div>
              
              <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>&copy; {datetime.now().year} Centro Comercial Virtual TEI.</p>
                <p>facturacion@tuempresainternacional.online</p>
              </div>
            </div>
          </body>
        </html>
        """
        _send_email_message(
            to_email=user_email,
            subject=f"¡Tu pedido #{order_data['id']} ha sido enviado! 📦",
            html_content=html,
            from_name="Facturación TEI",
            from_email="facturacion@tuempresainternacional.online"
        )
    except Exception as e:
        logger.error(f"Failed in send_order_invoice_email process to {user_email}: {str(e)}")


def send_password_reset_email(to_email: str, reset_link: str):
    """
    Sends a password reset email with a secure link.
    """
    try:
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

              <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔑</div>
                <h1 style="margin: 0; font-size: 24px;">Recuperación de Contraseña</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Centro Comercial Virtual TEI</p>
              </div>

              <div style="padding: 35px 30px;">
                <p style="font-size: 16px;">Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón a continuación para crear una nueva contraseña:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="{reset_link}"
                     style="background: linear-gradient(to right, #3b82f6, #1e40af); color: white; padding: 14px 32px;
                            text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                            display: inline-block; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">
                    Restablecer mi Contraseña
                  </a>
                </div>

                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este enlace expira en 1 hora.</strong><br>
                    Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
                  </p>
                </div>

                <p style="font-size: 13px; color: #6b7280;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="{reset_link}" style="color: #3b82f6; word-break: break-all;">{reset_link}</a>
                </p>
              </div>

              <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© {datetime.now().year} Centro Comercial Virtual TEI. Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0;">Esta empresa es de Dios y para su Gloria.</p>
              </div>
            </div>
          </body>
        </html>
        """
        _send_email_message(
            to_email=to_email,
            subject="🔑 Recuperación de contraseña - Centro Comercial TEI",
            html_content=html,
            from_name="Soporte TEI",
            from_email="soporte@tuempresainternacional.online"
        )
    except Exception as e:
        logger.error(f"Failed in send_password_reset_email process to {to_email}: {str(e)}")


def send_admin_alert_email(subject: str, alert_message: str):
    """
    Sends a system alert email to the admin.
    """
    try:
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">🚨 Alerta del Sistema TEI</h2>
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; border: 1px solid #f87171;">
                <p><strong>Detalle del reporte:</strong></p>
                <p>{alert_message}</p>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Este es un mensaje automático de monitoreo de Centro Comercial TEI.</p>
          </body>
        </html>
        """
        admin_email = os.getenv("EMAIL_SENDER", "soporte@tuempresainternacional.online")
        _send_email_message(
            to_email=admin_email,
            subject=subject,
            html_content=html,
            from_name="Alerta Sistema TEI",
            from_email="alertas@tuempresainternacional.online"
        )
    except Exception as e:
        logger.error(f"Failed in send_admin_alert_email process: {str(e)}")


def send_physical_sale_confirmation_email(
    to_email: str,
    user_name: str,
    merchant_name: str,
    sale_amount: float,
    commission_amount: float,
    transaction_id: int
):
    try:
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
                <div style="font-size: 40px; margin-bottom: 10px;">🛍️</div>
                <h1 style="margin: 0; font-size: 24px;">¡Compra Registrada Exitosamente!</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Centro Comercial Virtual TEI</p>
              </div>
              <div style="padding: 35px 30px;">
                <p style="font-size: 16px;">Hola <strong>{user_name}</strong>,</p>
                <p style="font-size: 16px;">Te informamos que se ha registrado una compra física asociada a tu cuenta de afiliado:</p>
                
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 4px; padding: 20px; margin: 25px 0;">
                  <h4 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Detalle de la Compra</h4>
                  <p style="margin: 0 0 10px 0; font-size: 15px;">🏢 <strong>Establecimiento:</strong> {merchant_name}</p>
                  <p style="margin: 0 0 10px 0; font-size: 15px;">💰 <strong>Monto de la Compra:</strong> ${sale_amount:,.2f} COP</p>
                  <p style="margin: 0 0 10px 0; font-size: 15px;">🎟️ <strong>Transacción ID:</strong> #{transaction_id}</p>
                  <p style="margin: 0; font-size: 15px;">📈 <strong>Comisión para Puntos/Red:</strong> Generada y pendiente de liberación</p>
                </div>

                <p style="font-size: 16px; text-align: center; font-weight: bold; color: #15803d;">¡Gracias por comprar en nuestros comercios aliados y seguir creciendo con la red TEI!</p>
              </div>
              <div style="background-color: #1f2937; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                <p style="margin: 0;">&copy; {datetime.now().year} Centro Comercial Virtual TEI. Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0;">Esta empresa es de Dios y para su Gloria.</p>
              </div>
            </div>
          </body>
        </html>
        """
        _send_email_message(
            to_email=to_email,
            subject=f"🛍️ Compra registrada en {merchant_name} - Centro Comercial TEI",
            html_content=html,
            from_name="Notificaciones TEI",
            from_email="notificaciones@tuempresainternacional.online"
        )
    except Exception as e:
        logger.error(f"Failed in send_physical_sale_confirmation_email: {str(e)}")
