import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';

const BinaryMillionaireView = () => {
    const { userId } = useParams();
    const [status, setStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to get current user ID
    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.sub || payload.user_id;
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }
        return localStorage.getItem('user_id') || null;
    };

    const activeUserId = userId || getCurrentUserId();

    const fetchStatus = async () => {
        if (!activeUserId) {
            setError('No se pudo obtener el ID de usuario.');
            setLoading(false);
            return;
        }

        try {
            // TODO: Crear endpoint /api/binary-millionaire/status/{user_id}
            const response = await api.get(`/api/binary-millionaire/status/${activeUserId}`);
            setStatus(response.data);

            // Fetch stats if registered
            if (response.data.status !== 'not_registered') {
                try {
                    const statsResponse = await api.get(`/api/binary-millionaire/stats/${activeUserId}`);
                    setStats(statsResponse.data);
                } catch (statsErr) {
                    console.error('Error fetching stats:', statsErr);
                }
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching status:', err);
            // Por ahora mostrar estado no registrado
            setStatus({ status: 'not_registered' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [activeUserId]);

    // Calcular estadísticas desde el backend
    const totalEarnings = stats?.total_earnings_all_time || 0;
    const thisYearEarnings = stats?.total_earnings_this_year || 0;
    const leftLineCount = stats?.left_line_count || 0;
    const rightLineCount = stats?.right_line_count || 0;
    const totalPV = stats?.total_pv || 0;

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando Red Binaria Millonaria...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '1rem' }}>
                    <p style={{ color: '#991b1b', fontWeight: 'bold' }}>❌ Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!status || status.status === 'not_registered') {
        return (
            <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💎 Red Binaria Millonaria
                </h2>
                <div style={{ 
                    background: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '0.5rem', 
                    padding: '1.5rem',
                    marginTop: '2rem'
                }}>
                    <h3 style={{ color: '#92400e', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📢 No Registrado
                    </h3>
                    <p style={{ color: '#78350f', marginBottom: '0.5rem' }}>
                        Aún no estás registrado en el Plan Binario Millonario.
                    </p>
                    <p style={{ color: '#78350f' }}>
                        💡 <strong>Compra un paquete millonario</strong> para unirte y comenzar a ganar comisiones por niveles.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💎 Red Binaria Millonaria
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
                Comisiones por niveles impares 1-27 • Basado en Puntos de Volumen (PV)
            </p>

            {/* Tarjeta de Visualización del Árbol */}
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', color: 'white', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            🌳 Tu Red Binaria Millonaria
                        </h3>
                        <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>
                            Posición Global #{status.global_position || 'N/A'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Ganancia Total
                        </div>
                    </div>
                </div>

                {/* Visualización simplificada del árbol */}
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ 
                            display: 'inline-block', 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: '50%', 
                            width: '60px', 
                            height: '60px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '2rem'
                        }}>
                            👤
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                            TÚ
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            Nivel 1
                        </div>
                    </div>

                    {/* Niveles */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                                ⬅️ LÍNEA IZQUIERDA
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{leftLineCount}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                miembros
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                                ➡️ LÍNEA DERECHA
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{rightLineCount}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                miembros
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                            <span>Total PV Generado</span>
                            <span>{totalPV.toLocaleString()} PV</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ background: 'white', width: `${Math.min((totalPV / 100000 * 100), 100)}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Tarjeta de Estado */}
                <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Estado de Cuenta
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Estado</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: status.is_active ? '#059669' : '#dc2626' }}>
                                {status.is_active ? '✅ Activo' : '❌ Inactivo'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Posición Global</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>#{status.global_position}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Fecha de Ingreso</p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                {status.created_at ? new Date(status.created_at).toLocaleDateString('es-ES') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tarjeta de Información */}
                <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ℹ️ Plan Millonario
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.75' }}>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>🎯 Modelo:</strong> Binario 2x2
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>💰 Niveles que Pagan:</strong> Impares 1-27
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>📊 Conversión:</strong> 1 PV = $4,500 COP
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>⚡ Placement:</strong> Orden de Llegada (BFS)
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabla de Comisiones por Nivel */}
            <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💵 Estructura de Comisiones por Nivel
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRadius: '0.5rem 0 0 0' }}>Niveles</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>% Comisión</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Personas Posibles</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Activos Actuales</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>PV Generado</th>
                                <th style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 0.5rem 0 0' }}>Ganado (COP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { levels: '1, 3, 5, 7, 9', percent: 3.0, emoji: '🥉', range: [1, 3, 5, 7, 9] },
                                { levels: '11, 13, 15, 17', percent: 2.0, emoji: '🥈', range: [11, 13, 15, 17] },
                                { levels: '19, 21, 23', percent: 1.0, emoji: '🥇', range: [19, 21, 23] },
                                { levels: '25, 27', percent: 0.5, emoji: '💎', range: [25, 27] },
                            ].map((group, idx) => {
                                // Calcular totales del grupo
                                let totalPossible = 0;
                                let totalActive = 0;
                                let totalPV = 0;
                                let totalEarned = 0;

                                group.range.forEach(level => {
                                    const possible = Math.pow(2, level);
                                    totalPossible += possible;

                                    const levelStat = stats?.level_stats?.find(s => s.level === level);
                                    totalActive += levelStat?.active_members || 0;
                                    totalPV += levelStat?.total_pv || 0;
                                    totalEarned += levelStat?.earned_amount || 0;
                                });

                                return (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid #e5e7eb',
                                        background: idx % 2 === 0 ? '#fef3c7' : '#d1fae5'
                                    }}>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                                            <span style={{ marginRight: '0.5rem' }}>{group.emoji}</span>
                                            Niveles {group.levels}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.125rem', color: '#10b981' }}>
                                            {group.percent}%
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                            {totalPossible.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                                            {totalActive.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#7c3aed' }}>
                                            {totalPV.toLocaleString()} PV
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#059669' }}>
                                            ${totalEarned.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}>
                                <td colSpan="4" style={{ padding: '1rem', fontSize: '1rem' }}>
                                    💰 TOTAL ACUMULADO MILLONARIO:
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem' }}>
                                    {totalPV.toLocaleString()} PV
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem' }}>
                                    ${thisYearEarnings.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#92400e' }}>
                        📝 Notas Importantes:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f', fontSize: '0.875rem', lineHeight: '1.75' }}>
                        <li><strong>Niveles Impares:</strong> Solo los niveles impares (1, 3, 5, 7...) generan comisiones</li>
                        <li><strong>Fórmula:</strong> Comisión = (PV × %) × $4,500 COP por cada miembro activo</li>
                        <li><strong>PV (Puntos de Volumen):</strong> Determinado por el paquete comprado por cada usuario</li>
                        <li><strong>Hasta Nivel 27:</strong> El plan paga comisiones hasta el nivel 27 de profundidad</li>
                        <li><strong>Placement Automático:</strong> Los nuevos miembros se colocan en orden de llegada (BFS)</li>
                    </ul>
                </div>
            </div>

            {/* Resumen Detallado por Nivel Individual */}
            <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem', gridColumn: '1 / -1', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Resumen Detallado por Nivel (Niveles Impares)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '0.5rem 0 0 0' }}>Nivel</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>%</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Posibles</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Activos</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>PV Total</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', borderRadius: '0 0.5rem 0 0' }}>Ganado (COP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27].map((level, idx) => {
                                const percent = level <= 9 ? 3.0 : level <= 17 ? 2.0 : level <= 23 ? 1.0 : 0.5;
                                const possible = Math.pow(2, level);
                                const levelStat = stats?.level_stats?.find(s => s.level === level);
                                const active = levelStat?.active_members || 0;
                                const pv = levelStat?.total_pv || 0;
                                const earned = levelStat?.earned_amount || 0;

                                return (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid #e5e7eb',
                                        background: '#fef3c7'
                                    }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                            Nivel {level}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: '600', color: '#10b981' }}>
                                            {level.percent}%
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {possible.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                                            {active.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#7c3aed' }}>
                                            {pv.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#059669' }}>
                                            ${earned.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BinaryMillionaireView;
