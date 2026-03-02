-- =====================================================
-- INSTRUCCIONES: Corregir Binary Global en Cloud SQL
-- =====================================================

-- PASO 1: VER USUARIOS AFECTADOS
-- Esta query muestra todos los usuarios con position NULL en Binary Global
SELECT 
    bgm.id as member_id,
    bgm.user_id,
    u.username,
    u.name,
    u.status,
    bgm.position,
    bgm.upline_id,
    bgm.global_position,
    bgm.is_active,
    bgm.registered_at
FROM binary_global_members bgm
LEFT JOIN users u ON bgm.user_id = u.id
WHERE bgm.position IS NULL
ORDER BY bgm.id;

-- PASO 2: ELIMINAR REGISTROS CON POSITION NULL
-- IMPORTANTE: Esto eliminará los registros incorrectos
-- Los usuarios serán re-registrados automáticamente en el próximo inicio de sesión
DELETE FROM binary_global_members
WHERE position IS NULL;

-- PASO 3: VERIFICAR QUE SE ELIMINARON
-- Debería retornar 0 filas
SELECT COUNT(*) 
FROM binary_global_members 
WHERE position IS NULL;

-- PASO 4: RE-REGISTRAR USUARIOS MANUALMENTE (ALTERNATIVA)
-- Si prefieres no eliminar y re-registrar manualmente, usa estas queries:

-- NOTA: Necesitarás ejecutar esto para cada usuario, asignando la posición correcta
-- Primero identifica quién debe ser el upline y qué posición (left/right)

-- Ejemplo para usuario ID 6 (Gerbraja1) - Ajusta según tu estructura
UPDATE binary_global_members
SET 
    position = 'left',  -- o 'right' según corresponda
    upline_id = 1       -- ID del member parent (no user_id, sino member.id)
WHERE user_id = 6 AND position IS NULL;

-- Ejemplo para usuario ID 7 (Dianismarcas)
-- Si es hijo de Gerbraja1, necesitas el member.id de Gerbraja1
UPDATE binary_global_members
SET 
    position = 'left',  -- o 'right' según corresponda
    upline_id = (SELECT id FROM binary_global_members WHERE user_id = 6 LIMIT 1)
WHERE user_id = 7 AND position IS NULL;

-- PASO 5: VERIFICAR ESTRUCTURA FINAL
-- Esta query muestra toda la estructura del árbol Binary Global
SELECT 
    bgm.id as member_id,
    bgm.user_id,
    u.username,
    bgm.position,
    bgm.upline_id,
    upline_user.username as upline_username,
    bgm.global_position,
    bgm.is_active,
    u.status as user_status
FROM binary_global_members bgm
LEFT JOIN users u ON bgm.user_id = u.id
LEFT JOIN binary_global_members upline_bgm ON bgm.upline_id = upline_bgm.id
LEFT JOIN users upline_user ON upline_bgm.user_id = upline_user.id
ORDER BY bgm.global_position;

-- PASO 6: CONTAR MIEMBROS POR LÍNEA (VERIFICACIÓN)
-- Para un usuario específico (ej: user_id = 1 - admin)
-- Esta query cuenta cuántos tiene en cada línea

WITH RECURSIVE downline AS (
    -- Usuario raíz
    SELECT id, user_id, position, upline_id, 1 as depth
    FROM binary_global_members
    WHERE user_id = 1  -- Cambia este ID según el usuario que quieras verificar
    
    UNION ALL
    
    -- Descendientes recursivos
    SELECT m.id, m.user_id, m.position, m.upline_id, d.depth + 1
    FROM binary_global_members m
    INNER JOIN downline d ON m.upline_id = d.id
    WHERE d.depth < 21  -- Máximo 21 niveles
)
SELECT 
    COUNT(CASE WHEN position = 'left' THEN 1 END) as left_line_total,
    COUNT(CASE WHEN position = 'right' THEN 1 END) as right_line_total,
    COUNT(*) - 1 as total_downline  -- -1 para excluir al usuario mismo
FROM downline
WHERE id != (SELECT id FROM binary_global_members WHERE user_id = 1 LIMIT 1);
