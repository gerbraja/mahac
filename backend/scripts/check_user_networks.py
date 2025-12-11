import os, sys
# Ensure project root is on PYTHONPATH
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database.connection import SessionLocal
from backend.database.models.user import User

# network models
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.unilevel import UnilevelMember
from backend.database.models.matrix import MatrixMember

usernames = ['gerbraja', 'SembradoresdeEsperanza']

if __name__ == '__main__':
    db = SessionLocal()
    try:
        for uname in usernames:
            user = db.query(User).filter(User.username == uname).first()
            print('\n===', uname, '===')
            if not user:
                print('User not found')
                continue
            print('User ID:', user.id, 'email:', user.email, 'referred_by_id:', user.referred_by_id)

            # Binary Global
            bg = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).all()
            if bg:
                for m in bg:
                    print('Binary Global:', 'id=', m.id, 'upline_id=', m.upline_id, 'position=', m.position, 'is_active=', m.is_active)
            else:
                print('Binary Global: NOT REGISTERED')

            # Unilevel
            ul = db.query(UnilevelMember).filter(UnilevelMember.user_id == user.id).all()
            if ul:
                for m in ul:
                    print('Unilevel:', 'id=', m.id, 'sponsor_id=', m.sponsor_id)
            else:
                print('Unilevel: NOT REGISTERED')

            # Matrix
            mm = db.query(MatrixMember).filter(MatrixMember.user_id == user.id).all()
            if mm:
                for m in mm:
                    print('Matrix:', 'id=', m.id, 'matrix_id=', m.matrix_id, 'upline_id=', m.upline_id, 'position=', m.position)
            else:
                print('Matrix: NOT REGISTERED')
    finally:
        db.close()
