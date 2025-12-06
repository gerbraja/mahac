import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.mlm.services.matrix_service import MatrixService
from backend.mlm.schemas.plan import MatrixPlan
import yaml

USERNAMES = ['gerbraja', 'SembradoresdeEsperanza']

if __name__ == '__main__':
    db = SessionLocal()
    try:
        plan_path = os.path.join(os.path.dirname(__file__), '..', 'mlm', 'plans', 'matriz_forzada', 'plan_template.yml')
        with open(plan_path, 'r') as f:
            plan_data = yaml.safe_load(f)
            matrix_plan = MatrixPlan(**plan_data)
            matrix_service = MatrixService(matrix_plan)

        for uname in USERNAMES:
            user = db.query(User).filter(User.username == uname).first()
            if not user:
                print('User not found:', uname)
                continue
            # Determine first matrix id from plan
            first_matrix_id = matrix_plan.matrices[0].id if getattr(matrix_plan, 'matrices', None) and len(matrix_plan.matrices) > 0 else None
            if not first_matrix_id:
                print('No matrix id found in plan')
                continue
            print(f'Buying matrix {first_matrix_id} for user {uname} (id={user.id})')
            try:
                res = matrix_service.buy_matrix(db, user.id, matrix_id=first_matrix_id)
                print('Result:', res)
            except Exception as e:
                print('Error buying matrix for', uname, e)
    finally:
        db.close()
