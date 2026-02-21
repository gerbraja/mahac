"""
Script to retroactively generate Binary Millionaire commissions
for users who were activated before the fix was implemented.

This script will:
1. Find all users in binary_millionaire_members
2. Check which ones don't have millionaire commission records
3. Generate commissions retroactively using default 3 PV per activation
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Production database connection
db_url = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@34.176.8.33/tiendavirtual")

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

try:
    print("\n" + "="*80)
    print("RETROACTIVE BINARY MILLIONAIRE COMMISSION GENERATION")
    print("="*80)
    
    # Find all Binary Millionaire members
    members_query = text("""
        SELECT bm.id, bm.user_id, bm.global_position, bm.created_at, u.username
        FROM binary_millionaire_members bm
        LEFT JOIN users u ON bm.user_id = u.id
        ORDER BY bm.id ASC
    """)
    
    members = db.execute(members_query).fetchall()
    
    print(f"\nFound {len(members)} Binary Millionaire members")
    
    # For each member, check if they have any millionaire commissions
    from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions
    from backend.database.models.binary_millionaire import BinaryMillionaireMember
    
    fixed_count = 0
    skipped_count = 0
    
    for member_data in members:
        member_id, user_id, global_pos, created_at, username = member_data
        
        # Check if this user already has millionaire commissions
        existing_comms = db.execute(text("""
            SELECT COUNT(*) FROM binary_commissions
            WHERE user_id = :user_id AND type = 'millionaire_level_bonus'
        """), {"user_id": user_id}).scalar()
        
        if existing_comms > 0:
            print(f"  ⏭️  Skipping {username} (ID: {user_id}) - already has {existing_comms} commission records")
            skipped_count += 1
            continue
        
        # Get the member object
        member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.id == member_id).first()
        
        if member and member.upline_id:  # Only generate if they have an upline
            print(f"  ✓ Generating commissions for {username} (ID: {user_id}, Position: #{global_pos})")
            
            # Distribute commissions with default 3 PV
            distribute_millionaire_commissions(db, member, pv_amount=3)
            
            fixed_count += 1
        else:
            print(f"  ⏭️  Skipping {username} (ID: {user_id}) - no upline (root user)")
            skipped_count += 1
    
    print("\n" + "="*80)
    print(f"SUMMARY:")
    print(f"  Total members: {len(members)}")
    print(f"  Fixed: {fixed_count}")
    print(f"  Skipped: {skipped_count}")
    print("="*80)
    
    print("\n✅ Migration completed successfully!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
