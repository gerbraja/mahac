"""
Forced Matrix Members Model
Stores user participation in the 9-level forced matrix system:
1. CONSUMIDOR ($77)
2. BRONCE ($277)
3. PLATA ($877)
4. ORO ($3,000)
5. PLATINO ($9,700)
6. RUBÍ ($25,000)
7. ESMERALDA ($77,000)
8. DIAMANTE ($270,000)
9. DIAMANTE AZUL ($970,000)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from backend.database.connection import Base


class ForcedMatrixMember(Base):
    __tablename__ = "forced_matrix_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    matrix_level = Column(Integer, nullable=False)  # 1-9 (Consumidor to Diamante Azul)
    position = Column(String(20))  # 'left', 'right', or position in 2x2
    upline_id = Column(Integer, ForeignKey('forced_matrix_members.id'))
    global_position = Column(Integer)  # Position in this specific matrix
    cycles_completed = Column(Integer, default=0)  # Number of times cycled this matrix
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_cycle_at = Column(DateTime)


class ForcedMatrixCycle(Base):
    """
    Records every cycle completion with rewards
    """
    __tablename__ = "forced_matrix_cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    matrix_level = Column(Integer, nullable=False)  # 1-9
    matrix_name = Column(String(50))  # CONSUMIDOR, BRONCE, PLATA, etc.
    
    # Rewards
    total_reward = Column(Numeric(12, 2))  # Total cycle reward
    reward_usd = Column(Numeric(12, 2))  # USD portion
    reward_crypto = Column(Numeric(12, 2))  # Crypto portion (frozen 210 days)
    one_time_bonus = Column(Numeric(12, 2))  # Optional bonus (some levels)
    
    # Re-entry info
    reentry_amount = Column(Numeric(12, 2))  # Amount to re-enter same matrix
    next_matrix_id = Column(Integer)  # Next matrix level (if upgraded)
    
    # Metadata
    cycle_number = Column(Integer)  # Which cycle for this user in this matrix
    cycled_at = Column(DateTime, server_default=func.now())
    rank_upgraded_from = Column(String(50))
    rank_upgraded_to = Column(String(50))
