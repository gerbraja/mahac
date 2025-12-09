import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';

const BinaryGlobalView = () => {
    const { userId } = useParams();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

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
        console.log('🔍 Fetching Binary Global status for user:', activeUserId);
        console.log('🌐 API Base URL:', api.defaults.baseURL);
        console.log('🔗 Full URL:', `${api.defaults.baseURL}/api/binary/global/${activeUserId}`);

        if (!activeUserId) {
            setError('No se pudo obtener el ID de usuario. Por favor, inicia sesión nuevamente.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.get(`/api/binary/global/${activeUserId}`);
            console.log('✅ Response received:', response);
            console.log('📦 Response data:', response.data);
            setStatus(response.data);

            // Fetch statistics if user is registered
            if (response.data.status !== 'not_registered') {
                try {
                    const statsResponse = await api.get(`/api/binary/global/stats/${activeUserId}`);
                    console.log('📊 Stats received:', statsResponse.data);
                    setStats(statsResponse.data);
                } catch (statsErr) {
                    console.error('❌ Error fetching stats:', statsErr);
                    // Don't fail the whole component if stats fail
                }
            }

            setError(null);
        } catch (err) {
            console.error('❌ Error fetching Binary Global status:', err);
            console.error('📋 Error response:', err.response);
            console.error('📋 Error status:', err.response?.status);
            console.error('📋 Error data:', err.response?.data);
            setError(err.response?.data?.detail || err.message || 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [activeUserId]);

    const handleActivate = async () => {
        if (!confirm("¿Confirmar activación? Esto requiere un pago.")) return;
        try {
            await api.post(`/api/binary/activate-global/${activeUserId}`, {});
            alert("✅ Activación exitosa! Las comisiones han sido distribuidas.");
            fetchStatus();
        } catch (err) {
            console.error('Error activating:', err);
            alert(`Error: ${err.message || 'Activación fallida'}`);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando estado de Binary Global...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '0.5rem',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        ⚠️ Error al Cargar
                    </h3>
                    <p style={{ color: '#991b1b' }}>{error}</p>
                    <button
                        onClick={fetchStatus}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!status || status.status === 'not_registered') {
        return (
            <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    🌐 Binary Global 2x2
                </h2>
                <div style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '0.5rem',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ color: '#92400e', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📢 No Registrado
                    </h3>
                    <p style={{ color: '#78350f', marginBottom: '0.5rem' }}>
                        Aún no estás registrado en el plan Binary Global 2x2.
                    </p>
                    <p style={{ color: '#78350f' }}>
                        💡 <strong>Compra cualquier paquete</strong> para unirte automáticamente y reservar tu posición global.
                    </p>
                </div>
            </div>
        );
    }

    const deadline = status.activation_deadline ? new Date(status.activation_deadline) : null;
    const earningDeadline = status.earning_deadline ? new Date(status.earning_deadline) : null;
    const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const earningDaysLeft = earningDeadline ? Math.max(0, Math.ceil((earningDeadline - new Date()) / (1000 * 60 * 60 * 24))) : 0;

    // Calcular estadísticas desde el backend
    const totalLevels = 21;
    const activeLevels = stats?.level_stats?.filter(l => l.active_members > 0).length || 0;
    const totalEarnings = stats?.total_earnings_all_time || 0;
    const thisYearEarnings = stats?.total_earnings_this_year || 0;
    const leftLineCount = stats?.left_line_count || 0;
    const rightLineCount = stats?.right_line_count || 0;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🌐 Binary Global 2x2
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
                Red binaria global con pre-afiliación • Ganancias en niveles impares 3-21
            </p>

            {/* Tarjeta de Visualización del Árbol */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            🌳 Tu Red Binaria Global
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
                            lineHeight: '60px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
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
                            <span>Progreso de Red</span>
                            <span>{stats?.total_network_members || 0} / 2,097,152 posibles</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ background: 'white', width: `${((stats?.total_network_members || 0) / 2097152 * 100).toFixed(4)}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Status Card */}
                <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Mi Estado
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280' }}>Estado:</span>
                            <span style={{
                                fontWeight: 'bold',
                                color: status.status === 'active' ? '#059669' : '#f59e0b',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                background: status.status === 'active' ? '#d1fae5' : '#fef3c7',
                                fontSize: '0.875rem'
                            }}>
                                {status.status === 'active' ? '🟢 ACTIVO' : '🔵 PRE-AFILIADO'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280' }}>Posición Global:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem', color: '#3b82f6' }}>
                                #{status.global_position || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280' }}>Posición:</span>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                {status.position === 'left' ? '⬅️ Izquierda' : status.position === 'right' ? '➡️ Derecha' : '🌟 RAÍZ'}
                            </span>
                        </div>

                        {status.status === 'pre_registered' && deadline && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: daysLeft <= 10 ? '#fee2e2' : '#fef3c7',
                                border: `1px solid ${daysLeft <= 10 ? '#ef4444' : '#f59e0b'}`,
                                borderRadius: '0.5rem'
                            }}>
                                <p style={{
                                    color: daysLeft <= 10 ? '#991b1b' : '#92400e',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem'
                                }}>
                                    ⚠️ Activación Requerida
                                </p>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: daysLeft <= 10 ? '#7f1d1d' : '#78350f',
                                    marginBottom: '0.5rem'
                                }}>
                                    Tienes <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{daysLeft} días</span> para activar tu cuenta antes de ser eliminado.
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                                    📅 Fecha límite: {deadline.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <button
                                    onClick={handleActivate}
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    ✅ Activar Ahora
                                </button>
                            </div>
                        )}

                        {status.status === 'active' && earningDeadline && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: earningDaysLeft > 30 ? '#d1fae5' : '#fef3c7',
                                border: `1px solid ${earningDaysLeft > 30 ? '#10b981' : '#f59e0b'}`,
                                borderRadius: '0.5rem'
                            }}>
                                <p style={{
                                    color: earningDaysLeft > 30 ? '#065f46' : '#92400e',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem'
                                }}>
                                    💰 Ventana de Ganancias
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: earningDaysLeft > 30 ? '#059669' : '#f59e0b' }}>
                                        {earningDaysLeft} días
                                    </span> restantes para ganar comisiones
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                    📅 Expira: {earningDeadline.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '0.5rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ℹ️ Detalles del Plan
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🌍</span>
                            <div>
                                <strong>Colocación Global Automática</strong>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    Los nuevos miembros se colocan por orden de llegada mundial
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>💰</span>
                            <div>
                                <strong>Comisiones en Niveles Impares</strong>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    Niveles 3-13: $0.50 USD | Niveles 15-21: $1.00 USD
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>⏰</span>
                            <div>
                                <strong>120 Días de Pre-afiliación</strong>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    Tiempo para activar antes de perder la posición
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>📅</span>
                            <div>
                                <strong>367 Días de Ganancias</strong>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    Ventana desde el registro para ganar comisiones
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commission Levels */}
                <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '0.5rem', padding: '1.5rem', gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Niveles de Comisión
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f3f4f6' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nivel</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Personas</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Comisión</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { level: 1, persons: 2, commission: '$0.00', pays: false },
                                    { level: 2, persons: 4, commission: '$0.00', pays: false },
                                    { level: 3, persons: 8, commission: '$0.50', pays: true },
                                    { level: 5, persons: 32, commission: '$0.50', pays: true },
                                    { level: 7, persons: 128, commission: '$0.50', pays: true },
                                    { level: 9, persons: 512, commission: '$0.50', pays: true },
                                    { level: 11, persons: '2,048', commission: '$0.50', pays: true },
                                    { level: 13, persons: '8,192', commission: '$0.50', pays: true },
                                    { level: 15, persons: '32,768', commission: '$1.00', pays: true },
                                    { level: 17, persons: '131,072', commission: '$1.00', pays: true },
                                    { level: 19, persons: '524,288', commission: '$1.00', pays: true },
                                    { level: 21, persons: '2,097,152', commission: '$1.00', pays: true },
                                ].map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>Nivel {row.level}</td>
                                        <td style={{ padding: '0.75rem' }}>{row.persons}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                                            {row.commission}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            {row.pays ? (
                                                <span style={{ color: '#059669', fontWeight: '600' }}>✅ SE PAGA</span>
                                            ) : (
                                                <span style={{ color: '#dc2626', fontWeight: '600' }}>❌ NO PAGA</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.375rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            💡 <strong>Nota:</strong> Las comisiones se pagan UNA VEZ al año por cada miembro activo en niveles impares.
                            Total máximo teórico: <span style={{ fontWeight: 'bold', color: '#059669' }}>$2,790,740.00</span>
                        </p>
                    </div>
                </div>

                {/* Resumen Completo de Ganancias por Nivel */}
                <div style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '1.5rem', gridColumn: '1 / -1', marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Resumen Completo de Ganancias por Nivel
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderRadius: '0.5rem 0 0 0' }}>Nivel</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>¿Paga?</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Comisión/Persona</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Personas Posibles</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Activos Actuales</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Ganado Este Año</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 0.5rem 0 0' }}>Potencial Máximo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { level: 3, pays: true, commission: 0.50, possible: 8, emoji: '🥉' },
                                    { level: 5, pays: true, commission: 0.50, possible: 32, emoji: '🥉' },
                                    { level: 7, pays: true, commission: 0.50, possible: 128, emoji: '🥈' },
                                    { level: 9, pays: true, commission: 0.50, possible: 512, emoji: '🥈' },
                                    { level: 11, pays: true, commission: 0.50, possible: 2048, emoji: '🥇' },
                                    { level: 13, pays: true, commission: 0.50, possible: 8192, emoji: '🥇' },
                                    { level: 15, pays: true, commission: 1.00, possible: 32768, emoji: '💎' },
                                    { level: 17, pays: true, commission: 1.00, possible: 131072, emoji: '💎' },
                                    { level: 19, pays: true, commission: 1.00, possible: 524288, emoji: '💍' },
                                    { level: 21, pays: true, commission: 1.00, possible: 2097152, emoji: '💍' },
                                ].map((row, idx) => {
                                    // Obtener datos reales del backend
                                    const levelStat = stats?.level_stats?.find(s => s.level === row.level);
                                    const active = levelStat?.active_members || 0;
                                    const earned = levelStat?.earned_this_year || 0;
                                    const potential = row.pays ? (row.possible * row.commission) : 0;

                                    return (
                                        <tr key={idx} style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            background: '#fefce8'
                                        }}>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>
                                                <span style={{ marginRight: '0.5rem' }}>{row.emoji}</span>
                                                Nivel {row.level}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    background: '#dcfce7',
                                                    color: '#166534',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    ✅ SÍ
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#059669' }}>
                                                ${row.commission.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                                {row.possible.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                                                {active.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#3b82f6' }}>
                                                ${earned.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#059669' }}>
                                                ${potential.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}>
                                    <td colSpan="5" style={{ padding: '1rem', fontSize: '1rem' }}>
                                        💰 TOTAL ACUMULADO BINARY GLOBAL:
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem' }}>
                                        ${thisYearEarnings.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem' }}>
                                        $2,790,740.00
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                        <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#166534' }}>
                            📝 Notas Importantes:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534', fontSize: '0.875rem', lineHeight: '1.75' }}>
                            <li><strong>Activos Actuales:</strong> Número de personas en este nivel que están activas en tu red</li>
                            <li><strong>Ganado Este Año:</strong> Total de comisiones recibidas en {new Date().getFullYear()} de este nivel</li>
                            <li><strong>Potencial Máximo:</strong> Ganancia si todos los slots del nivel estuvieran llenos con miembros activos</li>
                            <li><strong>Pago Anual:</strong> Cada miembro te paga máximo 1 vez al año, aunque siga activo</li>
                            <li><strong>Ventana de Ganancias:</strong> Solo cobras de miembros que se activen dentro de tus 367 días de ventana</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BinaryGlobalView;
