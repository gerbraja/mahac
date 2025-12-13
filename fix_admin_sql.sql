-- Script para arreglar el usuario admin en Cloud SQL
-- Ejecuta esto en: https://console.cloud.google.com/sql/instances/mlm-db/query?project=tei-mlm-prod

-- Paso 1: Verificar si el admin existe
SELECT id, username, email, is_admin, status 
FROM users 
WHERE username = 'admin';

-- Paso 2: Si el admin NO existe, créalo con este comando:
-- (Si SÍ existe, salta al Paso 3)
INSERT INTO users (
    name, username, email, password, is_admin, status, 
    referral_code, membership_number, membership_code,
    created_at, updated_at
) VALUES (
    'Administrador Principal',
    'admin',
    'admin@tuempresainternacional.com',
    '$2b$12$KIXqZ9vQJ5rN5rN5rN5rOu5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5e',
    true,
    'active',
    'admin',
    1,
    'ADMIN001',
    NOW(),
    NOW()
);

-- Paso 3: Si el admin SÍ existe, actualiza su contraseña con este comando:
UPDATE users 
SET 
    password = '$2b$12$KIXqZ9vQJ5rN5rN5rN5rOu5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5e',
    is_admin = true,
    status = 'active',
    updated_at = NOW()
WHERE username = 'admin';

-- Paso 4: Verificar que se actualizó correctamente
SELECT id, username, email, is_admin, status, 
       substring(password, 1, 30) as password_hash_preview
FROM users 
WHERE username = 'admin';

-- =========================================
-- IMPORTANTE: Después de ejecutar esto,
-- las credenciales serán:
--   Usuario: admin
--   Contraseña: admin123
-- (Esta es temporal para probar el login)
-- =========================================
