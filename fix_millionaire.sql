"""
Quick SQL script to register users in Binary Millionaire.
Execute with: sqlite3 dev.db < fix_millionaire.sql
"""

-- First, let's see who needs registration
SELECT 'Users missing from Binary Millionaire:' as info;
SELECT u.id, u.username, u.name, u.status
FROM users u
WHERE u.status = 'active'
AND u.id NOT IN (SELECT user_id FROM binary_millionaire_members);

-- Get the current max position
CREATE TEMP TABLE max_pos AS
SELECT COALESCE(MAX(global_position), 0) as max_position
FROM binary_millionaire_members;

-- Register missing active users
-- Note: This is a simplified version that places everyone under position 1 or as root
INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active, created_at)
SELECT 
    u.id as user_id,
    CASE 
        WHEN (SELECT COUNT(*) FROM binary_millionaire_members) = 0 THEN NULL
        ELSE (SELECT id FROM binary_millionaire_members ORDER BY global_position ASC LIMIT 1)
    END as upline_id,
    CASE 
        WHEN (SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = 
            (SELECT id FROM binary_millionaire_members ORDER BY global_position ASC LIMIT 1) AND position = 'left') > 0 
        THEN 'right'
        ELSE 'left'
    END as position,
    (SELECT max_position FROM max_pos) + ROW_NUMBER() OVER (ORDER BY u.id) as global_position,
    1 as is_active,
    datetime('now') as created_at
FROM users u
WHERE u.status = 'active'
AND u.id NOT IN (SELECT user_id FROM binary_millionaire_members);

-- Show results
SELECT 'Registration complete! New members:' as info;
SELECT id, user_id, global_position, position, upline_id
FROM binary_millionaire_members
ORDER BY global_position DESC
LIMIT 10;
