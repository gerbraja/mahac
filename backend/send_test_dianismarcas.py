import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env")
from utils.email_service import send_welcome_email
from database.connection import SessionLocal
from database.models.user import User

async def main():
    db = SessionLocal()
    try:
        # Find user
        username = "Dianismarcas"
        user = db.query(User).filter(User.username.ilike(username)).first()
        
        if not user:
            print(f"Usuario {username} no encontrado.")
            return

        print(f"Usuario encontrado: {user.name} ({user.email})")
        
        # Send to the user's requesting email for testing:
        test_email = "gerbraja@gmail.com"
        print(f"Enviando correo de bienvenida de prueba a {test_email}...")
        
        referral_link = f"https://tiendavirtualtei.com/usuario/{user.username}"
        
        await send_welcome_email(
            to_email=test_email,
            username=user.username,
            full_name=user.name,
            referral_link=referral_link
        )
        print("Correo enviado.")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
