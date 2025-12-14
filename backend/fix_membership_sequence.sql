-- Script para crear y sincronizar la secuencia de membership_number
-- Este script debe ejecutarse una sola vez para arreglar el problema

-- 1. Crear la secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS membership_number_seq;

-- 2. Encontrar el máximo membership_number actual
DO $$
DECLARE
    max_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(membership_number), 0) INTO max_num FROM users;
    
    -- 3. Setear la secuencia al siguiente número disponible
    PERFORM setval('membership_number_seq', max_num);
    
    RAISE NOTICE 'Sequence synchronized. Next number will be: %', max_num + 1;
END $$;
