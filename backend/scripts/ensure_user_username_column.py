"""Ensure the `username` column exists on the users table for development DB.

This script inspects the `users` table and adds a `username` column if missing.
It uses a simple ALTER TABLE statement which works for SQLite and Postgres
for adding a nullable text column.
"""
from sqlalchemy import inspect, text
from backend.database.connection import engine


def ensure_column():
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        print("No users table found; skip.")
        return

    cols = [c['name'] for c in insp.get_columns('users')]
    if 'username' in cols:
        print("username column already exists on users table.")
        return

    # Add nullable username column (safe default)
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(150)"))
        print("Added username column to users table.")
    except Exception as e:
        print("Could not add column via ALTER TABLE:", e)
        print("Consider using Alembic migration or recreating the DB for dev.")


if __name__ == '__main__':
    ensure_column()
