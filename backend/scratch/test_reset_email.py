import asyncio
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure we are in the correct directory or load from .env directly
load_dotenv(".env")

from utils.email_service import send_password_reset_email
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
        
    target_email = "mahac7@gmail.com" # Assuming this might be the user's or a safe test email
    # Or better, use the sender email to test delivery to self
    target_email = email
    
    print(f"Attempting to send a test password reset email to {target_email}...")
    # send_password_reset_email is synchronous
    try:
        send_password_reset_email(
            to_email=target_email,
            reset_link="https://tuempresainternacional.com/reset-password?token=test_token_123"
        )
        print("Function call finished.")
    except Exception as e:
        print(f"Exception during function call: {e}")

if __name__ == "__main__":
    asyncio.run(test())
