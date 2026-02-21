import sys
import os

sys.path.append(os.getcwd())

print("Importing session...")
from backend.database.connection import SessionLocal
print("Importing User...")
from backend.database.models.user import User
print("Importing Unilevel...")
from backend.database.models.unilevel import UnilevelMember
print("Importing Millionaire...")
from backend.database.models.binary_millionaire import BinaryMillionaireMember
print("Importing Global...")
from backend.database.models.binary_global import BinaryGlobalMember
print("Importing Matrix...")
from backend.database.models.matrix import MatrixMember
print("Importing Payment Service...")
from backend.mlm.services.payment_service import process_post_payment_commissions

print("Imports Success!")
