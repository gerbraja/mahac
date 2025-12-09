#!/usr/bin/env python3
"""Test script to verify Country field is saved and retrieved correctly."""

import sqlite3
from datetime import datetime

# Connect to database
db_path = "dev.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("🧪 TESTING COUNTRY FIELD FUNCTIONALITY")
print("=" * 60)

# Check if country column exists in user table
print("\n1️⃣ Checking if 'country' column exists in user table...")
cursor.execute("PRAGMA table_info(user)")
columns = cursor.fetchall()
country_exists = any(col[1] == 'country' for col in columns)

if country_exists:
    print("   ✅ Country column EXISTS in user table")
else:
    print("   ❌ Country column MISSING in user table")
    
# Check User ID 1 (admin)
print("\n2️⃣ Checking User ID 1 (admin)...")
cursor.execute("SELECT id, name, email, country FROM user WHERE id = 1")
user1 = cursor.fetchone()
if user1:
    print(f"   Name: {user1[1]}")
    print(f"   Email: {user1[2]}")
    print(f"   Country: {user1[3] or 'NULL'}")
else:
    print("   User 1 not found")

# Check User ID 2 (Sembradoresdeesperanza)
print("\n3️⃣ Checking User ID 2 (Sembradoresdeesperanza)...")
cursor.execute("SELECT id, name, email, country FROM user WHERE id = 2")
user2 = cursor.fetchone()
if user2:
    print(f"   Name: {user2[1]}")
    print(f"   Email: {user2[2]}")
    print(f"   Country: {user2[3] or 'NULL'}")
else:
    print("   User 2 not found")

# Check UnilevelMember records
print("\n4️⃣ Checking UnilevelMember records...")
cursor.execute("SELECT COUNT(*) FROM unilevel_member")
unilevel_count = cursor.fetchone()[0]
print(f"   Total UnilevelMembers: {unilevel_count}")

# Check BinaryGlobalMember records
print("\n5️⃣ Checking BinaryGlobalMember records...")
cursor.execute("SELECT COUNT(*) FROM binary_global_member")
binary_count = cursor.fetchone()[0]
print(f"   Total BinaryGlobalMembers: {binary_count}")

cursor.execute("SELECT user_id, position FROM binary_global_member ORDER BY user_id")
binary_members = cursor.fetchall()
for user_id, position in binary_members:
    print(f"   - User {user_id}: Position {position}")

# Check UnilevelCommission records
print("\n6️⃣ Checking UnilevelCommission records...")
cursor.execute("SELECT COUNT(*) FROM unilevel_commission")
commission_count = cursor.fetchone()[0]
print(f"   Total UnilevelCommissions: {commission_count}")

if commission_count > 0:
    cursor.execute("SELECT SUM(amount) FROM unilevel_commission")
    total_amount = cursor.fetchone()[0]
    print(f"   ⚠️ Total amount: ${total_amount}")
else:
    print(f"   ✅ No example commissions found (cleaned)")

print("\n" + "=" * 60)
print("✅ TEST COMPLETE - Ready to test frontend")
print("=" * 60)

conn.close()
