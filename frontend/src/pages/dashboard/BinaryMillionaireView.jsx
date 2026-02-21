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
        // First check if userId is in localStorage
        let userId = localStorage.getItem('userId');
        if (userId) {
            return parseInt(userId);
        }

        // Try to get from token
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.sub || payload.user_id;
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }
        return null;
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
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <h2 className="text-2xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                    💎 Red Binaria Millonaria
                </h2>
                <div className="bg-amber-50 border border-amber-500 rounded-lg p-6 mt-8">
                    <h3 className="text-amber-800 font-bold mb-4 text-lg">
                        📢 No Registrado
                    </h3>
                    <p className="text-amber-900 mb-2">
                        Aún no estás registrado en el Plan Binario Millonario.
                    </p>
                    <p className="text-amber-900">
                        💡 <strong>Compra un paquete millonario</strong> para unirte y comenzar a ganar comisiones por niveles.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                💎 Red Binaria Millonaria
            </h2>
            <p className="text-gray-500 mb-8 text-sm md:text-base">
                Comisiones por niveles impares 1-27 • Basado en Puntos de Volumen (PV)
            </p>

            {/* Tarjeta de Visualización del Árbol */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 md:p-8 mb-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">
                            🌳 Tu Red Binaria Millonaria
                        </h3>
                        <p className="opacity-90 text-sm">
                            Posición Global #{status.global_position || 'N/A'}
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-3xl font-bold">
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <div className="text-sm opacity-90">
                            Ganancia Total
                        </div>
                    </div>
                </div>

                {/* Visualización simplificada del árbol */}
                <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-md">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full text-3xl mb-2">
                            👤
                        </div>
                        <div className="text-sm font-semibold">
                            TÚ
                        </div>
                        <div className="text-xs opacity-80">
                            Nivel 1
                        </div>
                    </div>

                    {/* Niveles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/15 rounded-lg p-4 text-center">
                            <div className="text-sm mb-2 opacity-90">
                                ⬅️ LÍNEA IZQUIERDA
                            </div>
                            <div className="text-2xl font-bold">{leftLineCount}</div>
                            <div className="text-xs opacity-80">
                                miembros
                            </div>
                        </div>
                        <div className="bg-white/15 rounded-lg p-4 text-center">
                            <div className="text-sm mb-2 opacity-90">
                                ➡️ LÍNEA DERECHA
                            </div>
                            <div className="text-2xl font-bold">{rightLineCount}</div>
                            <div className="text-xs opacity-80">
                                miembros
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-xs mb-2">
                            <span>Total PV Generado</span>
                            <span>{totalPV.toLocaleString()} PV</span>
                        </div>
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((totalPV / 100000 * 100), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarjeta de Estado */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        📊 Estado de Cuenta
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Estado</p>
                            <p className={`text-lg font-bold ${status.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                                {status.is_active ? '✅ Activo' : '❌ Inactivo'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Posición Global</p>
                            <p className="text-lg font-bold">#{status.global_position}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Fecha de Ingreso</p>
                            <p className="text-sm font-semibold">
                                {status.created_at ? new Date(status.created_at).toLocaleDateString('es-ES') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tarjeta de Información */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        ℹ️ Plan Millonario
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>
                            <strong>🎯 Modelo:</strong> Binario 2x2
                        </p>
                        <p>
                            <strong>💰 Niveles que Pagan:</strong> Impares 1-27
                        </p>
                        <p>
                            <strong>📊 Conversión:</strong> 1 PV = $4,500 COP
                        </p>
                        <p>
                            <strong>⚡ Placement:</strong> Orden de Llegada (BFS)
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabla de Comisiones por Nivel */}
            <div className="bg-white shadow-md rounded-xl p-4 md:p-6 mt-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                    💵 Estructura de Comisiones por Nivel (mensual)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                <th className="p-3 md:p-4 text-left rounded-tl-lg">Niveles</th>
                                <th className="p-3 md:p-4 text-center">Comisión</th>
                                <th className="p-3 md:p-4 text-right">Activos</th>
                                <th className="p-3 md:p-4 text-right rounded-tr-lg">Ganado (USD)</th>
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
                                    <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                        <td className="p-3 md:p-4 font-semibold">
                                            <span className="mr-2">{group.emoji}</span>
                                            <span className="block md:inline">Niveles {group.levels}</span>
                                        </td>
                                        <td className="p-3 md:p-4 text-center font-mono font-bold text-lg text-emerald-600">
                                            {group.percent}%
                                        </td>
                                        <td className="p-3 md:p-4 text-right font-mono font-semibold">
                                            {totalActive.toLocaleString()}
                                        </td>
                                        <td className="p-3 md:p-4 text-right font-mono font-bold text-emerald-700">
                                            ${totalEarned.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold">
                                <td colSpan="2" className="p-3 md:p-4 text-base md:text-lg">
                                    💰 TOTAL MES ACTUAL:
                                </td>
                                <td></td>
                                <td className="p-3 md:p-4 text-right text-base md:text-lg">
                                    ${(stats?.level_stats?.reduce((acc, curr) => acc + (curr.earned_amount || 0), 0) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 p-5 bg-amber-50 border border-amber-300 rounded-lg">
                    <h4 className="font-bold mb-3 text-amber-800">
                        📝 Notas Importantes:
                    </h4>
                    <ul className="list-disc pl-5 text-amber-900 text-sm space-y-1">
                        <li><strong>Ciclo Mensual:</strong> Del día 18 al día 17 del mes siguiente (Hora Colombia).</li>
                        <li><strong>Niveles Impares:</strong> Solo los niveles impares (1, 3, 5, 7...) generan comisiones</li>
                        <li><strong>Fórmula:</strong> Comisión = (PV × %) × Valor del Punto (USD) por cada miembro activo</li>
                        <li><strong>PV (Puntos de Volumen):</strong> Determinado por el paquete comprado por cada usuario</li>
                        <li><strong>Hasta Nivel 27:</strong> El plan paga comisiones hasta el nivel 27 de profundidad</li>
                        <li><strong>Placement Automático:</strong> Los nuevos miembros se colocan en orden de llegada (BFS)</li>
                    </ul>
                </div>
            </div>

            {/* Resumen Detallado por Nivel Individual */}
            <div className="bg-white shadow-md rounded-xl p-4 md:p-6 mt-6">
                <h3 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                    📊 Resumen Detallado por Nivel (Niveles Impares)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                <th className="p-3 md:p-4 text-left rounded-tl-lg">Nivel</th>
                                <th className="p-3 md:p-4 text-center">%</th>
                                <th className="p-3 md:p-4 text-right">Activos</th>
                                <th className="p-3 md:p-4 text-right rounded-tr-lg">Ganado (USD)</th>
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
                                    <tr key={idx} className="border-b border-gray-200 bg-amber-50 hover:bg-amber-100 transition-colors">
                                        <td className="p-3 md:p-4 font-semibold">
                                            Nivel {level}
                                        </td>
                                        <td className="p-3 md:p-4 text-center font-mono font-semibold text-emerald-600">
                                            {percent}%
                                        </td>
                                        <td className="p-3 md:p-4 text-right font-mono font-semibold">
                                            {active.toLocaleString()}
                                        </td>
                                        <td className="p-3 md:p-4 text-right font-mono font-bold text-emerald-700">
                                            ${earned.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
