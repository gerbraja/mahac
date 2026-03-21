"""
Script de diagnóstico para probar envío de email de recuperación de contraseña.
Ejecutar desde: backend/scripts/
  python debug_email_reset.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Configuración ──────────────────────────────────────────────────
EMAIL_SENDER   = "soporte@tuempresainternacional.com"
EMAIL_PASSWORD = "kgwv oifa hanu oftu"       # App Password de Gmail
TEST_TARGET    = "gerbraja@gmail.com"
SMTP_HOST      = "smtp.gmail.com"
SMTP_PORT      = 587
# ──────────────────────────────────────────────────────────────────

def test_smtp_connection():
    print("\n1️⃣  Probando conexión SMTP con Gmail...")
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            print(f"   ✅ Conexión TLS establecida")
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            print(f"   ✅ Login exitoso como {EMAIL_SENDER}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"   ❌ Error de autenticación: {e}")
        print("      → La App Password está incorrecta o el correo no está bien configurado.")
        return False
    except Exception as e:
        print(f"   ❌ Error de conexión: {type(e).__name__}: {e}")
        return False


def send_test_email():
    print(f"\n2️⃣  Enviando correo de prueba a {TEST_TARGET}...")
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "TEST - Recuperación de contraseña TEI"
        msg["From"]    = f"Soporte TEI <{EMAIL_SENDER}>"
        msg["To"]      = TEST_TARGET

        html = f"""
        <html><body>
          <h2>🔑 Prueba de recuperación</h2>
          <p>Este es un correo de prueba enviado directamente desde el script de diagnóstico.</p>
          <p>Si recibes esto, el envío de email funciona correctamente ✅</p>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, TEST_TARGET, msg.as_string())

        print(f"   ✅ Correo enviado exitosamente a {TEST_TARGET}")
        return True
    except Exception as e:
        print(f"   ❌ Error al enviar: {type(e).__name__}: {e}")
        return False


def check_user_in_db():
    print(f"\n3️⃣  Verificando si '{TEST_TARGET}' existe en la base de datos...")
    try:
        # Intentar importar la conexión a BD
        from dotenv import load_dotenv
        # Cargar .env si existe
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"   📄 .env cargado desde {env_path}")
        else:
            print(f"   ⚠️  .env no encontrado en {env_path}")

        db_host = os.getenv("DB_HOST", "localhost")
        db_user = os.getenv("DB_USER", "postgres")
        db_pass = os.getenv("DB_PASS", "")
        db_name = os.getenv("DB_NAME", "tiendavirtual")
        db_port = os.getenv("DB_PORT", "5432")

        import psycopg2
        conn = psycopg2.connect(
            host=db_host, port=db_port,
            user=db_user, password=db_pass,
            dbname=db_name, connect_timeout=5
        )
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, status FROM users WHERE LOWER(email) = LOWER(%s)", (TEST_TARGET,))
        row = cur.fetchone()
        if row:
            print(f"   ✅ Usuario encontrado:")
            print(f"      ID: {row[0]}, Email: {row[1]}, Nombre: {row[2]}, Status: {row[3]}")
        else:
            print(f"   ❌ Usuario NO encontrado. El correo '{TEST_TARGET}' no está registrado en la BD.")
        cur.close()
        conn.close()
        return bool(row)
    except ImportError:
        print("   ⚠️  psycopg2 no disponible - saltando verificación de BD local")
        return None
    except Exception as e:
        print(f"   ⚠️  Error conectando a BD local: {type(e).__name__}: {e}")
        print("      (Es normal si la BD es Cloud SQL - solo relevante en producción)")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("  DIAGNÓSTICO - Email Recuperación de Contraseña TEI")
    print("=" * 60)

    smtp_ok = test_smtp_connection()
    if smtp_ok:
        send_test_email()
    
    check_user_in_db()

    print("\n" + "=" * 60)
    print("Diagnóstico completado.")
    print("=" * 60)
