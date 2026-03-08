import sys
import os
import asyncio

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.utils.email_service import send_welcome_email
from dotenv import load_dotenv

load_dotenv(os.path.join(parent_dir, ".env"))

async def main():
    try:
        username = "Dianismarcas"
        name = "Dianismarcas"
        
        test_email = "gerbraja@gmail.com"
        print(f"Enviando correo de bienvenida de prueba para {username} a {test_email}...")
        
        referral_link = f"https://tiendavirtualtei.com/usuario/{username}"
        
        await send_welcome_email(
            to_email=test_email,
            username=username,
            full_name=name,
            referral_link=referral_link
        )
        print("OK Correo enviado.")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
