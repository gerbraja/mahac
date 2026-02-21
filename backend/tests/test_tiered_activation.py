import pytest
from sqlalchemy.orm import Session
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.matrix import MatrixMember
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.sponsorship import SponsorshipCommission
from backend.mlm.services.payment_service import process_post_payment_commissions
from backend.mlm.services.activation_service import process_activation

# Mock DB Session
@pytest.fixture
def db(db_session):
    return db_session

def create_user(db, email, sponsor_id=None):
    user = User(
        email=email,
        username=email.split('@')[0],
        status="pre-affiliate",
        referred_by_id=sponsor_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Ensure sponsor is in Unilevel/Millionaire if exists
    if sponsor_id:
        u_mem = UnilevelMember(user_id=sponsor_id, level=1)
        db.add(u_mem)
        m_mem = BinaryMillionaireMember(user_id=sponsor_id, position='left', global_position=1, is_active=True)
        db.add(m_mem)
        db.commit()
    return user

def test_consumer_activation_generic_purchase(db):
    """
    Scenario: User buys a generic product (Toothpaste).
    Expectation:
    1. Status -> Active
    2. Registered in Unilevel
    3. Registered in Millionaire
    4. NOT in Matrix
    5. NOT in Global Binary
    6. NO Sponsorship Bonus
    """
    # Setup
    sponsor = create_user(db, "sponsor_gen@test.com")
    user = create_user(db, "consumer_gen@test.com", sponsor.id)
    
    # Generic Product
    product = Product(name="Toothpaste", price=10.0, pv=5, is_activation=False)
    db.add(product)
    db.commit()
    
    # Process Payment
    process_post_payment_commissions(
        db, 
        user_id=user.id, 
        total_pv=5, 
        is_activation=False, 
        total_cop=45000.0
    )
    
    db.refresh(user)
    
    # Checks
    assert user.status == "active", "User should be active after generic purchase"
    
    # Unilevel
    uni = db.query(UnilevelMember).filter_by(user_id=user.id).first()
    assert uni is not None, "Should be in Unilevel"
    
    # Millionaire
    mill = db.query(BinaryMillionaireMember).filter_by(user_id=user.id).first()
    assert mill is not None, "Should be in Millionaire"
    
    # Matrix (Should be None)
    matrix = db.query(MatrixMember).filter_by(user_id=user.id).first()
    assert matrix is None, "Should NOT be in Matrix for generic purchase"
    
    # Global Binary (Should be None)
    globe = db.query(BinaryGlobalMember).filter_by(user_id=user.id).first()
    assert globe is None, "Should NOT be in Global Binary for generic purchase"
    
    # Sponsorship Bonus (Should be None)
    spon_comm = db.query(SponsorshipCommission).filter_by(new_member_id=user.id).first()
    assert spon_comm is None, "Should NOT get Sponsorship Bonus for generic purchase"

def test_full_activation_package_purchase(db):
    """
    Scenario: User buys Activation Package.
    Expectation:
    1. Status -> Active
    2. Registered in Unilevel & Millionaire
    3. Registered in Matrix
    4. Registered in Global Binary
    5. Sponsorship Bonus Generated ($9.7)
    """
    # Setup
    sponsor = create_user(db, "sponsor_act@test.com")
    # Make sure sponsor is fully activated to receive bonuses if needed (though logic might not require it for generation)
    sponsor.status = "active"
    db.add(sponsor)
    db.commit()
    
    user = create_user(db, "affiliate_act@test.com", sponsor.id)
    
    # Activation Product
    product = Product(name="Activation Kit", price=147.0, pv=3, is_activation=True)
    db.add(product)
    db.commit()
    
    # Process Payment
    process_post_payment_commissions(
        db, 
        user_id=user.id, 
        total_pv=3, 
        is_activation=True, 
        total_cop=600000.0
    )
    
    db.refresh(user)
    
    # Checks
    assert user.status == "active"
    
    # Matrix (Should exist)
    matrix = db.query(MatrixMember).filter_by(user_id=user.id).first()
    assert matrix is not None, "Should be in Matrix after activation package"
    
    # Global Binary (Should exist)
    globe = db.query(BinaryGlobalMember).filter_by(user_id=user.id).first()
    assert globe is not None, "Should be in Global Binary after activation package"
    
    # Sponsorship Bonus (Should exist)
    spon_comm = db.query(SponsorshipCommission).filter_by(new_member_id=user.id).first()
    assert spon_comm is not None, "Should get Sponsorship Bonus"
    assert spon_comm.commission_amount == 9.7
