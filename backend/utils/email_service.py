import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def send_welcome_email(to_email: str, username: str, full_name: str, referral_link: str):
    """
    Sends a welcome email to a new user using Gmail SMTP.
    This function is designed to be run as a background task.
    """
    try:
        # Get credentials from environment variables
        sender_email = os.getenv("EMAIL_SENDER")
        password = os.getenv("EMAIL_PASSWORD")

        if not sender_email or not password:
            logger.warning("⚠️ Email credentials not found. Welcome email was not sent.")
            return

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "¡Bienvenido a Tienda Virtual TEI! 🚀"
        
        # Use alias for the "From" address if configured (e.g. soporte@ authenticating but sending as bienvenida@)
        alias_email = "bienvenida@tuempresainternacional.com"
        message["From"] = f"Bienvenida TEI <{alias_email}>"
        
        message["To"] = to_email

        # Email Body (HTML)
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0;">¡Bienvenido a la Familia TEI!</h1>
              </div>
              <div style="padding: 30px;">
                <p>Hola <strong>{full_name}</strong>,</p>
                <p>¡Estamos muy emocionados de tenerte con nosotros! Tu registro en <strong>Centro Comercial Virtual TEI</strong> ha sido exitoso.</p>
                
                <div style="background-color: #f9fafb; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Tu Usuario:</strong> {username}</p>
                  <p style="margin: 5px 0 0;"><strong>Tu Enlace de Referido:</strong></p>
                  <a href="{referral_link}" style="color: #4F46E5; text-decoration: none;">{referral_link}</a>
                </div>

                <p>Estás a un paso de comenzar a generar ingresos. Explora tu oficina virtual y completa tu perfil para comenzar.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://tiendavirtualtei.com/login" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ingresar a mi Cuenta</a>
                </div>
              </div>
              <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>&copy; {datetime.now().year} Centro Comercial Virtual TEI. Todos los derechos reservados.</p>
                <p>Esta empresa es de Dios y para su Gloria.</p>
              </div>
            </div>
          </body>
        </html>
        """

        # Attach HTML content
        part2 = MIMEText(html, "html")
        message.attach(part2)

        # Connect to Gmail SMTP Server using context manager for safety
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Upgrade connection to secure
            server.login(sender_email, password)
            server.sendmail(sender_email, to_email, message.as_string())
        
        logger.info(f"✅ Welcome email sent successfully to {to_email}")

    except Exception as e:
        logger.error(f"❌ Failed to send welcome email to {to_email}: {str(e)}")

async def send_order_invoice_email(order_data: dict, user_email: str):
    """
    Sends an invoice/shipping confirmation email.
    """
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        password = os.getenv("EMAIL_PASSWORD")

        if not sender_email or not password:
            logger.warning("⚠️ Email credentials not found. Invoice email was not sent.")
            return

        message = MIMEMultipart("alternative")
        message["Subject"] = f"¡Tu pedido #{order_data['id']} ha sido enviado! 📦"
        
        # Use alias for invoice emails
        alias_email = "facturacion@tuempresainternacional.com"
        message["From"] = f"Facturación TEI <{alias_email}>"
        
        message["To"] = user_email

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
                <p>facturacion@tuempresainternacional.com</p>
              </div>
            </div>
          </body>
        </html>
        """

        part2 = MIMEText(html, "html")
        message.attach(part2)

        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, user_email, message.as_string())
        
        logger.info(f"✅ Invoice email sent successfully to {user_email}")

    except Exception as e:
        logger.error(f"❌ Failed to send invoice email to {user_email}: {str(e)}")
