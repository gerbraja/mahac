-- SQL script to check and fix global positions in Binary Global
-- First, let's see the current state
SELECT 
    bg.id,
    bg.user_id,
    u.username,
    bg.global_position,
    bg.position,
    bg.is_active,
    bg.registered_at
FROM binary_global_members bg
LEFT JOIN users u ON bg.user_id = u.id
ORDER BY bg.id;

-- Count members with NULL global_position
SELECT COUNT(*) as null_count
FROM binary_global_members
WHERE global_position IS NULL;

-- If there are NULL values, assign sequential positions
-- Get the max current position
SELECT COALESCE(MAX(global_position), 0) as max_position
FROM binary_global_members;

-- Update NULL positions with sequential numbers
-- This will be executed manually after reviewing the above queries
