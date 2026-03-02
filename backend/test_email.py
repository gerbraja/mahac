import asyncio
import os
from dotenv import load_dotenv

# Ensure we are in the correct directory or load from .env directly
load_dotenv(".env")

from utils.email_service import send_welcome_email
import logging

logging.basicConfig(level=logging.INFO)

async def test():
    email = os.getenv("EMAIL_SENDER")
    pwd = os.getenv("EMAIL_PASSWORD")
    print(f"EMAIL_SENDER: {email}")
    print(f"EMAIL_PASSWORD: {'SET' if pwd else 'NOT SET'}")
    
    if not email:
        print("ERROR: EMAIL_SENDER not loaded.")
        return
        
    print("Attempting to send a test email...")
    await send_welcome_email(
        to_email=email,  # Send to self
        username="test_user",
        full_name="User Test",
        referral_link="https://tiendavirtualtei.com/usuario/test_user"
    )
    print("Test finished.")

if __name__ == "__main__":
    asyncio.run(test())
