-- =====================================================
-- ARREGLO COMPLETO DE BINARY GLOBAL
-- Ejecutar TODO esto de una vez en PostgreSQL
-- =====================================================

-- PASO 1: Corregir referred_by_id en users
UPDATE users SET referred_by_id = 2 WHERE id = 4;

-- PASO 2: Arreglar upline_id en binary_global_members existentes
-- TeiAdmin bajo admin
UPDATE binary_global_members SET upline_id = 6 WHERE id = 7;

-- Sembradores bajo TeiAdmin (cambiar de right a left bajo TeiAdmin)
UPDATE binary_global_members SET upline_id = 7, position = 'left' WHERE id = 8;

-- Gerbraja1 bajo Sembradores
UPDATE binary_global_members SET upline_id = 8, position = 'left' WHERE id = 9;

-- Admin debe ser right bajo admin porque TeiAdmin ya es left
UPDATE binary_global_members SET position = 'right' WHERE id = 6 AND user_id = 1;

-- PASO 3: Insertar Gerbraja (ID 5) bajo TeiAdmin
INSERT INTO binary_global_members (user_id, upline_id, position, global_position, is_active, registered_at, activation_deadline, earning_deadline)
VALUES (
    5,      -- Gerbraja
    7,      -- bajo TeiAdmin (member.id)
    'right',-- Sembradores está en left, Gerbraja en right
    5,      -- siguiente posición global
    false,  -- no está activo
    NOW(),
    NOW() + INTERVAL '120 days',
    NOW() + INTERVAL '367 days'
);

-- PASO 4: Insertar Dianismarcas (ID 7) bajo Gerbraja1
INSERT INTO binary_global_members (user_id, upline_id, position, global_position, is_active, registered_at, activation_deadline, earning_deadline, activated_at)
VALUES (
    7,      -- Dianismarcas
    9,      -- bajo Gerbraja1 (member.id)
    'left', -- primera posición bajo Gerbraja1
    6,      -- siguiente posición global
    true,   -- está activo
    NOW(),
    NOW() + INTERVAL '120 days',
    NOW() + INTERVAL '367 days',
    NOW()   -- activado ahora
);

-- VERIFICACIÓN FINAL
SELECT 
    bgm.id,
    bgm.user_id,
    u.username,
    bgm.position,
    bgm.upline_id,
    parent.username as parent_username,
    bgm.global_position,
    bgm.is_active
FROM binary_global_members bgm
LEFT JOIN users u ON bgm.user_id = u.id
LEFT JOIN binary_global_members parent_bgm ON bgm.upline_id = parent_bgm.id
LEFT JOIN users parent ON parent_bgm.user_id = parent.id
ORDER BY bgm.global_position;
