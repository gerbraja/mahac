-- Script SQL para crear la tabla binary_millionaire_members en PostgreSQL Cloud SQL
-- Ejecutar con: gcloud sql connect mlm-db --user=postgres --project=tei-mlm-prod
-- Luego copiar y pegar este SQL

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS binary_millionaire_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    upline_id INTEGER REFERENCES binary_millionaire_members(id),
    position VARCHAR(10),
    global_position INTEGER UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_bmm_user_id ON binary_millionaire_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bmm_global_pos ON binary_millionaire_members(global_position);

-- 3. Registrar usuarios activos (IDs: 1, 2, 4, 6)
-- Primero verificar quiénes están activos
SELECT id, username, status FROM users WHERE id IN (1, 2, 4, 6);

-- Registrar usuario ID 1 (admin)
INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active)
VALUES (1, NULL, 'left', 1, TRUE)
ON CONFLICT (global_position) DO NOTHING;

-- Registrar usuario ID 2 (TeiAdmin)
INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active)
VALUES (2, 1, 'left', 2, TRUE)
ON CONFLICT (global_position) DO NOTHING;

-- Registrar usuario ID 4 (Sembradores)
INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active)
VALUES (4, 1, 'right', 3, TRUE)
ON CONFLICT (global_position) DO NOTHING;

-- Registrar usuario ID 6 (Gerbraja1)
INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active)
VALUES (6, 2, 'left', 4, TRUE)
ON CONFLICT (global_position) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT 
    bmm.id,
    bmm.user_id,
    u.username,
    bmm.global_position,
    bmm.upline_id,
    bmm.position
FROM binary_millionaire_members bmm
JOIN users u ON bmm.user_id = u.id
ORDER BY bmm.global_position;
