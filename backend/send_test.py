import os
from dotenv import load_dotenv
load_dotenv(".env")

from utils.email_service import send_welcome_email

def main():
    print("Enviando correo de prueba a gerbraja@gmail.com...")
    send_welcome_email(
        to_email="gerbraja@gmail.com",
        username="prueba_sistema",
        full_name="Usuario Prueba TEI",
        referral_link="https://tiendavirtualtei.com/"
    )
    print("Prueba completada.")

if __name__ == "__main__":
    main()
