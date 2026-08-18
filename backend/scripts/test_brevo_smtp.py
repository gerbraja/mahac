import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load env variables from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def test_brevo():
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        password = os.getenv("EMAIL_PASSWORD")
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", 587))

        print(f"[*] Conectando a {smtp_server}:{smtp_port} con usuario {sender_email}...")

        message = MIMEMultipart("alternative")
        message["Subject"] = "Prueba de Integración Brevo SMTP - TEI"
        message["From"] = f"Sistemas TEI <{sender_email}>"
        # Cambia este correo si quieres recibir la prueba en otro lado
        message["To"] = "soporte@tuempresainternacional.com" 

        html = """
        <html>
          <body>
            <h2>¡Conexión Exitosa con Brevo! 🚀</h2>
            <p>Si estás leyendo este correo, significa que la configuración SMTP de Brevo en tu backend está funcionando perfectamente.</p>
            <p>Ya puedes enviar correos de recuperación de contraseña sin problemas de SPAM.</p>
          </body>
        </html>
        """
        
        part = MIMEText(html, "html")
        message.attach(part)

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, message["To"], message.as_string())

        print("[+] ¡ÉXITO! El correo de prueba fue enviado a soporte@tuempresainternacional.com")

    except Exception as e:
        print(f"[-] ERROR: Falló el envío del correo. Detalles: {str(e)}")

if __name__ == "__main__":
    test_brevo()
