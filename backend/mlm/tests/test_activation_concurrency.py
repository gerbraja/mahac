import os
import threading
import time
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.mlm.services.activation_service import process_activation


TEST_DB = os.getenv('TEST_DATABASE_URL')


@pytest.mark.skipif(not TEST_DB or not TEST_DB.startswith('postgres'), reason="Postgres TEST_DATABASE_URL required for concurrency test")
def test_concurrent_activation_unique_log_and_membership():
    # Use a real Postgres DB provided via TEST_DATABASE_URL
    engine = create_engine(TEST_DB)
    Session = sessionmaker(bind=engine)

    # Ensure tables exist (models should be present in DB)
    User.__table__.create(bind=engine, checkfirst=True)
    ActivationLog.__table__.create(bind=engine, checkfirst=True)

    # Create the test user
    sess = Session()
    user = User(name='Concurrent', email='concurrent@example.com')
    sess.add(user)
    sess.commit()
    user_id = user.id
    sess.close()

    results = []
    barrier = threading.Barrier(2)

    def worker(results_list):
        s = Session()
        barrier.wait()
        try:
            res = process_activation(s, user_id, package_amount=10.0)
            results_list.append(res)
        except Exception as e:
            results_list.append({'error': str(e)})
        finally:
            try:
                s.close()
            except Exception:
                pass

    t1 = threading.Thread(target=worker, args=(results,))
    t2 = threading.Thread(target=worker, args=(results,))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Only one should have created the activation (the other should see already_activated)
    # Normalize results
    activated = [r for r in results if r and not r.get('error')]
    assert len(activated) == 2  # both return something, but one will have already_activated True

    # Check DB has single ActivationLog
    s2 = Session()
    rows = s2.query(ActivationLog).filter(ActivationLog.user_id == user_id).all()
    assert len(rows) == 1

    # Ensure membership_number assigned and unique
    u = s2.query(User).filter(User.id == user_id).first()
    assert u.membership_number is not None
    assert u.membership_code is not None
    s2.close()
