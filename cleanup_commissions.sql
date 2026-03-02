-- INSTRUCTIONS:
-- 1. Run: gcloud sql connect mlm-db --user=postgres --database=tiendavirtual
-- 2. Enter Password: AdminPostgres2025
-- 3. Copy and paste the following block:

BEGIN;

-- 1. Create a temporary table to hold the Commissions to delete
CREATE TEMP TABLE bad_commissions AS
SELECT id, user_id, commission_amount 
FROM unilevel_commissions 
WHERE level = 1 
  AND commission_amount > 10 
  AND user_id = (SELECT id FROM users WHERE username = 'Sembradores' LIMIT 1);

-- 2. Check what we found (Optional, for verification)
SELECT * FROM bad_commissions;

-- 3. Update the User Balance
WITH sum_bad AS (
    SELECT SUM(commission_amount) as total_bad FROM bad_commissions
)
UPDATE users 
SET 
    available_balance = GREATEST(0, available_balance - (SELECT total_bad FROM sum_bad)),
    total_earnings = GREATEST(0, total_earnings - (SELECT total_bad FROM sum_bad)),
    monthly_earnings = GREATEST(0, monthly_earnings - (SELECT total_bad FROM sum_bad))
WHERE id = (SELECT id FROM users WHERE username = 'Sembradores')
  AND EXISTS (SELECT 1 FROM sum_bad WHERE total_bad > 0);

-- 4. Delete the bad commissions
DELETE FROM unilevel_commissions 
WHERE id IN (SELECT id FROM bad_commissions);

-- 5. Commit the changes
COMMIT;

-- Verify results
SELECT id, username, available_balance, total_earnings FROM users WHERE username = 'Sembradores';
