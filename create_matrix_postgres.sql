-- SQL Script para crear y configurar Forced Matrix en PostgreSQL Cloud SQL
-- Base de datos: tiendavirtual

-- 1. Crear tabla matrix_members
CREATE TABLE IF NOT EXISTS matrix_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    matrix_id INTEGER NOT NULL DEFAULT 1,
    upline_id INTEGER REFERENCES matrix_members(id),
    position INTEGER,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matrix_user ON matrix_members(user_id);
CREATE INDEX IF NOT EXISTS idx_matrix_upline ON matrix_members(upline_id);
CREATE INDEX IF NOT EXISTS idx_matrix_id ON matrix_members(matrix_id);

-- 2. Crear tabla matrix_commissions
CREATE TABLE IF NOT EXISTS matrix_commissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    matrix_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    reason VARCHAR(100),
    level_from INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matrix_comm_user ON matrix_commissions(user_id);

-- 3. Registrar usuarios en TODAS las matrices
-- Matrix IDs: 27=Consumidor, 77=Bronce, 277=Plata, 777=Oro, 2777=Platino, 7777=Diamante, 27777=Doble Diamante

-- MATRIX 27 (Consumidor)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 27, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 27, 1, 1, 1, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 27, 1, 2, 1, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
SELECT 6, 27, id, 1, 2, TRUE FROM matrix_members WHERE user_id = 4 AND matrix_id = 27 LIMIT 1
ON CONFLICT DO NOTHING;

-- MATRIX 77 (Bronce)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 77, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 77, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 77), 1, 1, TRUE) 
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 77, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 77), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 77, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 77), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- MATRIX 277 (Plata)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 277, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 277, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 277), 1, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 277, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 277), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 277, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 277), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- MATRIX 777 (Oro)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 777, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 777), 1, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 777), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 777, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 777), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- MATRIX 2777 (Platino)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 2777, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 2777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 2777), 1, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 2777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 2777), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 2777, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 2777), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- MATRIX 7777 (Diamante)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 7777, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 7777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 7777), 1, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 7777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 7777), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 7777, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 7777), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- MATRIX 27777 (Doble Diamante)
INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (1, 27777, NULL, NULL, 0, TRUE) ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (2, 27777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27777), 1, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (4, 27777, (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27777), 2, 1, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level, is_active)
VALUES (6, 27777, (SELECT id FROM matrix_members WHERE user_id = 4 AND matrix_id = 27777), 1, 2, TRUE)
ON CONFLICT DO NOTHING;

-- 4. Verificar registros
SELECT matrix_id, COUNT(*) as total_members 
FROM matrix_members 
GROUP BY matrix_id 
ORDER BY matrix_id;

SELECT m.id, m.user_id, u.username, m.matrix_id, m.level, m.position
FROM matrix_members m
JOIN users u ON m.user_id = u.id
WHERE m.matrix_id IN (27, 77)
ORDER BY m.matrix_id, m.level, m.position;
