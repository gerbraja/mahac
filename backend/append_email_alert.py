import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\utils\email_service.py"

content = """
def send_admin_alert_email(subject: str, alert_message: str):
    \"\"\"
    Sends a system alert email to the admin.
    \"\"\"
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        password = os.getenv("EMAIL_PASSWORD")

        if not sender_email or not password:
            logger.warning("Email credentials not found. Alert email was not sent.")
            return

        clean_password = password.replace(" ", "")

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        alias_email = "alertas@tuempresainternacional.com"
        message["From"] = f"Alerta Sistema TEI <{alias_email}>"
        message["To"] = sender_email

        html = f\"\"\"
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
        \"\"\"

        part = MIMEText(html, "html")
        message.attach(part)

        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, clean_password)
            server.sendmail(sender_email, sender_email, message.as_string())

        logger.info("Admin alert email sent successfully")

    except Exception as e:
        logger.error(f"Failed to send admin alert email: {str(e)}")
"""

with open(file_path, "a", encoding="utf-8") as f:
    f.write("\n" + content)
    
print("Appended send_admin_alert_email to email_service.py")
