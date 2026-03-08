import os
import sys
import traceback
from sqlalchemy import func, text

# Setup python path to import backend modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
sys.path.insert(0, project_root)

out_file = os.path.join(project_root, "output_stats_utf8.txt")

try:
    from backend.database.connection import SessionLocal
    from backend.database.models.user import User
    from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission
    from backend.database.models.binary_millionaire import BinaryMillionaireMember
    from backend.database.models.binary import BinaryCommission

    db = SessionLocal()
    usernames = ['AlexisBM', 'Mercam', 'Gerbraja1']

    with open(out_file, "w", encoding="utf-8") as f:
        for username in usernames:
            f.write(f"\n{'='*50}\nUser: {username}\n{'='*50}\n")
            try:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    f.write("Not found in db\n")
                    continue
                
                # --- GLOBAL BINARY ---
                f.write("\n--- BINARY GLOBAL ---\n")
                g_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).first()
                if not g_member:
                    f.write("Not registered in global\n")
                else:
                    g_display_pos = g_member.global_position if g_member.global_position else g_member.id
                    f.write(f"Position: #{g_display_pos}\n")
                    
                    left_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.upline_id == g_member.id, BinaryGlobalMember.position == 'left').first()
                    right_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.upline_id == g_member.id, BinaryGlobalMember.position == 'right').first()
                    
                    left_count = 0
                    if left_member:
                        left_subtree = db.execute(text("""
                            WITH RECURSIVE downline AS (
                                SELECT id FROM binary_global_members WHERE id = :member_id
                                UNION ALL
                                SELECT m.id FROM binary_global_members m INNER JOIN downline d ON m.upline_id = d.id
                            ) SELECT COUNT(*) FROM downline
                        """), {"member_id": left_member.id}).fetchone()
                        left_count = left_subtree[0] if left_subtree else 0
                        
                    right_count = 0
                    if right_member:
                        right_subtree = db.execute(text("""
                            WITH RECURSIVE downline AS (
                                SELECT id FROM binary_global_members WHERE id = :member_id
                                UNION ALL
                                SELECT m.id FROM binary_global_members m INNER JOIN downline d ON m.upline_id = d.id
                            ) SELECT COUNT(*) FROM downline
                        """), {"member_id": right_member.id}).fetchone()
                        right_count = right_subtree[0] if right_subtree else 0
                        
                    total_earnings = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0.0
                    f.write(f"Left: {left_count}, Right: {right_count}, Total: {left_count + right_count}\n")
                    f.write(f"Total Earnings: {total_earnings}\n")

                # --- MILLIONAIRE BINARY ---
                f.write("\n--- BINARY MILLIONAIRE ---\n")
                m_member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user.id).first()
                if not m_member:
                    f.write("Not registered in millionaire\n")
                else:
                    m_display_pos = m_member.global_position if m_member.global_position else m_member.id
                    f.write(f"Position: #{m_display_pos}\n")
                    
                    left_m = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.upline_id == m_member.id, BinaryMillionaireMember.position == 'left').first()
                    right_m = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.upline_id == m_member.id, BinaryMillionaireMember.position == 'right').first()
                    
                    m_left_count = 0
                    if left_m:
                        res = db.execute(text("""
                            WITH RECURSIVE downline AS (
                                SELECT id FROM binary_millionaire_members WHERE id = :member_id
                                UNION ALL
                                SELECT m.id FROM binary_millionaire_members m INNER JOIN downline d ON m.upline_id = d.id
                            ) SELECT COUNT(*) FROM downline
                        """), {"member_id": left_m.id}).fetchone()
                        m_left_count = res[0] if res else 0
                        
                    m_right_count = 0
                    if right_m:
                        res = db.execute(text("""
                            WITH RECURSIVE downline AS (
                                SELECT id FROM binary_millionaire_members WHERE id = :member_id
                                UNION ALL
                                SELECT m.id FROM binary_millionaire_members m INNER JOIN downline d ON m.upline_id = d.id
                            ) SELECT COUNT(*) FROM downline
                        """), {"member_id": right_m.id}).fetchone()
                        m_right_count = res[0] if res else 0
                        
                    m_pv = db.query(func.sum(BinaryCommission.sale_amount)).filter(BinaryCommission.user_id == user.id, BinaryCommission.type == "millionaire_level_bonus").scalar() or 0.0
                    m_earned = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id, BinaryCommission.type == "millionaire_level_bonus").scalar() or 0.0
                    f.write(f"Left: {m_left_count}, Right: {m_right_count}, Total: {m_left_count + m_right_count}\n")
                    f.write(f"Total PV: {m_pv}, Total Earnings: {m_earned}\n")

            except Exception as outer_e:
                f.write(f"Error processing user {username}: {outer_e}\n{traceback.format_exc()}\n")

    print(f"Success writing stats to output_stats_utf8.txt")
except Exception as main_e:
    with open(out_file, "a", encoding="utf-8") as f:
        f.write(f"\nFATAL ERROR:\n{main_e}\n{traceback.format_exc()}\n")
    print(f"Failed: {main_e}")
