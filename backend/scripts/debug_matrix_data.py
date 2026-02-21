
import sys
import os

# Add the project root to safety path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.database.connection import SessionLocal
from backend.database.models.matrix import MatrixMember
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.supplier import Supplier
from sqlalchemy import func

def debug_matrix_data():
    output_file = "matrix_debug_final.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        db = SessionLocal()
        try:
            users = db.query(User).all()
            f.write(f"Total Users: {len(users)}\n")
            
            for user in users:
                f.write(f"\nUser: {user.username} (ID: {user.id})\n")
                
                # Check Matrix Memberships
                memberships = db.query(MatrixMember).filter(MatrixMember.user_id == user.id).all()
                if not memberships:
                    f.write("  - No Matrix Memberships\n")
                    continue
                    
                for member in memberships:
                    f.write(f"  - Matrix ID: {member.matrix_id} (Member ID: {member.id}, Active: {member.is_active})\n")
                    
                    # Check Direct Children (Level 2)
                    children = db.query(MatrixMember).filter(MatrixMember.upline_id == member.id).all()
                    f.write(f"    - Direct Children (Level 2): {len(children)}\n")
                    
                    # Check Grandchildren (Level 3)
                    grand_children_count = 0
                    for child in children:
                        grand_children = db.query(MatrixMember).filter(MatrixMember.upline_id == child.id).all()
                        grand_children_count += len(grand_children)
                    f.write(f"    - Grandchildren (Level 3): {grand_children_count}\n")
                    f.write(f"    - Total Active Members in Matrix: {len(children) + grand_children_count}\n")

        except Exception as e:
            f.write(f"Error: {e}\n")
        finally:
            db.close()
    print(f"Debug data written to {output_file}")

if __name__ == "__main__":
    debug_matrix_data()
