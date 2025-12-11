import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

// Matrix configurations - Complete list from CONSUMIDOR to DIAMANTE AZUL
// Based on backend/mlm/plans/matriz_forzada/plan_template.yml
const MATRIX_LEVELS = {
    1: { name: 'CONSUMIDOR', reward: 77, rewardUSD: 77, rewardCrypto: 0, color: '#10b981', icon: '🛍️', monthlyLimit: 14 },
    2: { name: 'BRONCE', reward: 277, rewardUSD: 277, rewardCrypto: 0, color: '#cd7f32', icon: '🥉', monthlyLimit: 10 },
    3: { name: 'PLATA', reward: 877, rewardUSD: 877, rewardCrypto: 0, color: '#c0c0c0', icon: '🥈', monthlyLimit: 8 },
    4: { name: 'ORO', reward: 3000, rewardUSD: 1500, rewardCrypto: 1500, color: '#ffd700', icon: '🥇', monthlyLimit: 7 },
    5: { name: 'PLATINO', reward: 9700, rewardUSD: 4850, rewardCrypto: 4850, color: '#e5e4e2', icon: '💍', monthlyLimit: 6 },
    6: { name: 'RUBÍ', reward: 25000, rewardUSD: 12500, rewardCrypto: 12500, color: '#e0115f', icon: '♦️', monthlyLimit: 5 },
    7: { name: 'ESMERALDA', reward: 77000, rewardUSD: 38500, rewardCrypto: 38500, color: '#50c878', icon: '💚', monthlyLimit: 4 },
    8: { name: 'DIAMANTE', reward: 270000, rewardUSD: 135000, rewardCrypto: 135000, color: '#b9f2ff', icon: '💎', monthlyLimit: 2 },
    9: { name: 'DIAMANTE AZUL', reward: 970000, rewardUSD: 485000, rewardCrypto: 485000, color: '#4169e1', icon: '💎', monthlyLimit: 1 }
};

const MatrixNode = ({ filled, name, level }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0.5rem'
        }}>
            <div style={{
                width: filled ? '50px' : '50px',
                height: filled ? '50px' : '50px',
                borderRadius: '50%',
                background: filled ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                border: filled ? '3px solid #4f46e5' : '2px dashed #9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: filled ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s'
            }}>
                {filled ? '👤' : ''}
            </div>
            {name && (
                <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                    fontWeight: '600'
                }}>
                    {name}
                </div>
            )}
            {level && (
                <div style={{
                    fontSize: '0.65rem',
                    color: '#9ca3af',
                    marginTop: '0.1rem'
                }}>
                    Nivel {level}
                </div>
            )}
        </div>
    );
};

const MatrixVisual = ({ matrixConfig, activeMembers = 0, showTitle = true }) => {
    // Matrix 3x3: 1 + 3 + 9 = 13 total positions
    const level1 = 1; // You
    const level2 = 3; // First level
    const level3 = 9; // Second level
    
    const filledLevel2 = Math.min(activeMembers, level2);
    const filledLevel3 = Math.max(0, Math.min(activeMembers - level2, level3));
    
    const remaining = 12 - activeMembers; // 12 positions to fill (excluding yourself)

    return (
        <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: `3px solid ${matrixConfig.color}`,
            minWidth: '400px'
        }}>
            {showTitle && (
                <>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {matrixConfig.icon}
                        </div>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: matrixConfig.color,
                            marginBottom: '0.5rem'
                        }}>
                            MATRIX {matrixConfig.name}
                        </h3>
                        <div style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#10b981',
                            marginBottom: '0.5rem'
                        }}>
                            Ganancia Total: ${matrixConfig.reward.toLocaleString()} USD
                        </div>
                        {matrixConfig.rewardCrypto > 0 ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '1rem',
                                marginTop: '0.75rem'
                            }}>
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    background: '#dcfce7',
                                    borderRadius: '0.5rem',
                                    border: '2px solid #10b981'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '600' }}>💵 Dólares</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>
                                        ${matrixConfig.rewardUSD.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    background: '#fef3c7',
                                    borderRadius: '0.5rem',
                                    border: '2px solid #f59e0b'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>₿ Cripto</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#d97706' }}>
                                        ${matrixConfig.rewardCrypto.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#92400e', marginTop: '0.25rem' }}>
                                        🔒 Congelada 210 días
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div style={{
                        background: '#f3f4f6',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Progreso
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                            {activeMembers} / 12 posiciones
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                            {remaining > 0 ? `Faltan ${remaining} para completar` : '✅ ¡Matrix Completada!'}
                        </div>
                    </div>
                </>
            )}

            {/* Matrix Structure */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
            }}>
                {/* Level 1 - You */}
                <div style={{ textAlign: 'center' }}>
                    <MatrixNode filled={true} name="TÚ" level={1} />
                </div>

                {/* Connector Line */}
                <div style={{
                    width: '2px',
                    height: '20px',
                    background: '#cbd5e1'
                }}></div>

                {/* Level 2 - 3 positions */}
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                    }}>
                        NIVEL 2 ({filledLevel2}/{level2})
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {[...Array(level2)].map((_, i) => (
                            <MatrixNode key={`l2-${i}`} filled={i < filledLevel2} />
                        ))}
                    </div>
                </div>

                {/* Connector Line */}
                <div style={{
                    width: '2px',
                    height: '20px',
                    background: '#cbd5e1'
                }}></div>

                {/* Level 3 - 9 positions */}
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                    }}>
                        NIVEL 3 ({filledLevel3}/{level3})
                    </div>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.75rem',
                        justifyItems: 'center'
                    }}>
                        {[...Array(level3)].map((_, i) => (
                            <MatrixNode key={`l3-${i}`} filled={i < filledLevel3} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MatrixView = () => {
    const [userMatrices, setUserMatrices] = useState({});
    const [matrixStats, setMatrixStats] = useState({});
    const [loading, setLoading] = useState(true);
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        fetchUserMatrices();
    }, []);

    const fetchUserMatrices = async () => {
        setLoading(true);
        try {
            // Fetch status and stats from backend
            const [statusRes, statsRes] = await Promise.all([
                api.get(`/api/forced-matrix/status/${userId}`),
                api.get(`/api/forced-matrix/stats/${userId}`)
            ]);

            console.log('Matrix Status:', statusRes.data);
            console.log('Matrix Stats:', statsRes.data);

            // Transform status data for display
            const matrixData = {};
            if (statusRes.data.matrices) {
                statusRes.data.matrices.forEach(matrix => {
                    matrixData[matrix.matrix_level] = {
                        is_active: matrix.is_active,
                        cycles_completed: matrix.cycles_completed,
                        global_position: matrix.global_position,
                        position: matrix.position,
                        created_at: matrix.created_at,
                        last_cycle_at: matrix.last_cycle_at
                    };
                });
            }

            setUserMatrices(matrixData);
            setMatrixStats(statsRes.data || {});
        } catch (error) {
            console.error('Error fetching matrices:', error);
            setUserMatrices({});
            setMatrixStats({});
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                fontSize: '1.25rem',
                color: '#6b7280'
            }}>
                Cargando matrices...
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    marginBottom: '0.5rem'
                }}>
                    🌳 Mis Matrices 3x3
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Sistema de Matrix Cerrada - Completa cada nivel para ganar recompensas
                </p>
            </div>

            {/* Info Box */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                marginBottom: '3rem',
                boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    📚 ¿Cómo funcionan las Matrices?
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '0.5rem' }}>✓ Cada matriz tiene 12 posiciones (3 en nivel 2, 9 en nivel 3)</li>
                    <li style={{ marginBottom: '0.5rem' }}>✓ Invitas personas que se activan con paquetes de inicio</li>
                    <li style={{ marginBottom: '0.5rem' }}>✓ Al completar los 12 espacios, recibes la recompensa completa</li>
                    <li>✓ Puedes tener múltiples reentradas en cada matriz</li>
                </ul>
            </div>

            {/* Main 4 Matrices - Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '2rem',
                marginBottom: '3rem'
            }}>
                {[1, 2, 3, 4].map(matrixId => {
                    const config = MATRIX_LEVELS[matrixId];
                    const statsData = matrixStats.matrices?.[matrixId] || {};
                    const activeMembers = statsData.active_members || 0;
                    
                    return (
                        <MatrixVisual
                            key={matrixId}
                            matrixConfig={config}
                            activeMembers={activeMembers}
                            showTitle={true}
                        />
                    );
                })}
            </div>

            {/* Additional Matrices Summary */}
            <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    marginBottom: '1.5rem'
                }}>
                    📊 Resumen Completo de Todas las Matrices
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead style={{ background: '#1e3a8a' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'white', borderBottom: '2px solid #3b82f6' }}>Matriz</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>Nivel</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>Recompensa Total</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>💵 Dólares</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>₿ Cripto</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>🔄 Ciclos Mes</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>Reentradas</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>Completadas</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #3b82f6' }}>Total Ganado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(MATRIX_LEVELS).map((matrixId, index) => {
                                const config = MATRIX_LEVELS[matrixId];
                                const data = userMatrices[matrixId] || {};
                                const statsData = matrixStats.matrices?.[matrixId] || {};
                                
                                const isActive = data.is_active || false;
                                const cyclesCompleted = data.cycles_completed || 0;
                                const totalEarned = (statsData.total_earned_usd || 0) + (statsData.total_earned_crypto || 0);
                                const activeMembers = statsData.active_members || 0;
                                
                                // Placeholder for monthly cycles (backend doesn't track this yet)
                                const monthlyCycles = 0;
                                const remainingCycles = Math.max(0, config.monthlyLimit - monthlyCycles);

                                return (
                                    <tr key={matrixId} style={{ 
                                        borderBottom: '1px solid #e5e7eb',
                                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '1.75rem' }}>{config.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: config.color }}>
                                                        {config.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: isActive ? '#10b981' : '#ef4444' }}>
                                                        {isActive ? '✓ Activa' : '✗ No Registrado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                                            Nivel {matrixId}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', fontSize: '1rem' }}>
                                            ${config.reward.toLocaleString()} USD
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#059669' }}>
                                            {config.rewardCrypto > 0 ? `$${config.rewardUSD.toLocaleString()}` : `$${config.rewardUSD.toLocaleString()}`}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#d97706' }}>
                                            {config.rewardCrypto > 0 ? (
                                                <div>
                                                    <div>${config.rewardCrypto.toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#92400e', marginTop: '0.25rem' }}>
                                                        🔒 210 días
                                                    </div>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '0.5rem',
                                                    background: monthlyCycles >= config.monthlyLimit ? '#fee2e2' : '#dbeafe',
                                                    border: `2px solid ${monthlyCycles >= config.monthlyLimit ? '#dc2626' : '#3b82f6'}`
                                                }}>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        fontSize: '1.125rem',
                                                        color: monthlyCycles >= config.monthlyLimit ? '#dc2626' : '#1e40af'
                                                    }}>
                                                        {monthlyCycles}/{config.monthlyLimit}
                                                    </span>
                                                </div>
                                                {remainingCycles > 0 ? (
                                                    <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>
                                                        ✅ Faltan {remainingCycles}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' }}>
                                                        ⚠️ Límite alcanzado
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#3b82f6', fontSize: '1.125rem' }}>
                                            {activeMembers}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '9999px',
                                                background: cyclesCompleted > 0 ? '#d1fae5' : '#f3f4f6',
                                                color: cyclesCompleted > 0 ? '#065f46' : '#6b7280',
                                                fontWeight: '700',
                                                fontSize: '1rem'
                                            }}>
                                                {cyclesCompleted}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.125rem' }}>
                                            <span style={{ color: totalEarned > 0 ? '#10b981' : '#6b7280' }}>
                                                ${totalEarned.toLocaleString()} USD
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr style={{ 
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.25rem'
                            }}>
                                <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'right' }}>
                                    💰 TOTAL ACUMULADO DE TODAS LAS MATRICES:
                                </td>
                                <td style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1.75rem' }}>
                                    ${(matrixStats.total_earned_usd || 0).toLocaleString()} USD
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: '#f3f4f6',
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #3b82f6'
                }}>
                    <h4 style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.75rem' }}>
                        📝 Nota:
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#4b5563' }}>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>Ciclos Mes:</strong> Muestra cuántas veces has completado esta matriz en el mes actual y cuántas puedes hacer según el límite mensual</li>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>Reentradas:</strong> Número de veces que has vuelto a entrar en esta matriz</li>
                        <li style={{ marginBottom: '0.5rem' }}>• <strong>Completadas:</strong> Matrices que has llenado completamente (12/12 posiciones)</li>
                        <li>• <strong>Total Ganado:</strong> Suma de todas las recompensas obtenidas en esta matriz</li>
                    </ul>
                </div>

                {/* Crypto Information */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    borderRadius: '1rem',
                    color: 'white',
                    boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '3rem' }}>₿</div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                Sistema de Criptomonedas
                            </h3>
                            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                Información importante sobre tus recompensas en cripto
                            </p>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                                <div>
                                    <strong>Periodo de Congelamiento:</strong> Las criptomonedas quedan congeladas por <strong>210 días</strong> desde la fecha en que las ganas.
                                </div>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                                <div>
                                    <strong>Contador Regresivo:</strong> Verás un contador en tiempo real mostrando cuántos días faltan para que tus criptos estén disponibles.
                                </div>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>💰</span>
                                <div>
                                    <strong>Valor del Token:</strong> Cada token de cripto = <strong>$100 USD</strong>
                                </div>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>✅</span>
                                <div>
                                    <strong>Después de 210 días puedes:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        <li>Convertir a efectivo dentro de la plataforma</li>
                                        <li>Transferir a Binance para vender</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        💡 <strong>Tip:</strong> Consulta la sección "💰 Billetera" para ver el detalle de tus criptos congeladas y disponibles
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatrixView;
