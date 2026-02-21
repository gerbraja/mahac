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
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                    🌐 Binary Global 2x2
                </h2>
                <div className="bg-amber-50 border border-amber-500 rounded-lg p-6">
                    <h3 className="text-amber-800 font-bold mb-4 text-lg">
                        📢 No Registrado
                    </h3>
                    <p className="text-amber-900 mb-2">
                        Aún no estás registrado en el plan Binary Global 2x2.
                    </p>
                    <p className="text-amber-900">
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
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                🌐 Binary Global 2x2
            </h2>
            <p className="text-gray-500 mb-8 text-sm md:text-base">
                Red binaria global con pre-afiliación • Ganancias en niveles impares 3-21
            </p>

            {/* Tarjeta de Visualización del Árbol */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-8 mb-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">
                            🌳 Tu Red Binaria Global
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
                            <span>Progreso de Red</span>
                            <span>{leftLineCount + rightLineCount} / 2,097,152 posibles</span>
                        </div>
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(((leftLineCount + rightLineCount) / 2097152 * 100), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        📊 Mi Estado
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Estado:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {status.status === 'active' ? '🟢 ACTIVO' : '🔵 PRE-AFILIADO'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Posición Global:</span>
                            <span className="font-mono font-bold text-xl text-blue-600">
                                #{status.global_position || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Posición:</span>
                            <span className="font-semibold text-gray-800">
                                {status.position === 'left' ? '⬅️ Izquierda' : status.position === 'right' ? '➡️ Derecha' : '🌟 RAÍZ'}
                            </span>
                        </div>

                        {status.status === 'pre_registered' && deadline && (
                            <div className={`mt-4 p-4 rounded-lg border ${daysLeft <= 10 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                <p className={`font-bold mb-2 ${daysLeft <= 10 ? 'text-red-800' : 'text-amber-800'
                                    }`}>
                                    ⚠️ Activación Requerida
                                </p>
                                <p className={`text-sm mb-2 ${daysLeft <= 10 ? 'text-red-900' : 'text-amber-900'
                                    }`}>
                                    Tienes <span className="font-bold text-base">{daysLeft} días</span> para activar tu cuenta antes de ser eliminado.
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    📅 Fecha límite: {deadline.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <button
                                    onClick={handleActivate}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-bold hover:scale-[1.02] transition-transform shadow-md"
                                >
                                    ✅ Activar Ahora
                                </button>
                            </div>
                        )}

                        {status.status === 'active' && earningDeadline && (
                            <div className={`mt-4 p-4 rounded-lg border ${earningDaysLeft > 30 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                <p className={`font-bold mb-2 ${earningDaysLeft > 30 ? 'text-emerald-800' : 'text-amber-800'
                                    }`}>
                                    💰 Ventana de Ganancias
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className={`font-bold text-base ${earningDaysLeft > 30 ? 'text-emerald-600' : 'text-amber-600'
                                        }`}>
                                        {earningDaysLeft} días
                                    </span> restantes para ganar comisiones
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    📅 Expira: {earningDeadline.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        ℹ️ Detalles del Plan
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">🌍</span>
                            <div>
                                <strong className="text-gray-900">Colocación Global Automática</strong>
                                <p className="text-sm text-gray-500 mt-1">
                                    Los nuevos miembros se colocan por orden de llegada mundial
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">💰</span>
                            <div>
                                <strong className="text-gray-900">Comisiones en Niveles Impares</strong>
                                <p className="text-sm text-gray-500 mt-1">
                                    Niveles 3-13: $0.50 USD | Niveles 15-21: $1.00 USD
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">⏰</span>
                            <div>
                                <strong className="text-gray-900">120 Días de Pre-afiliación</strong>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tiempo para activar antes de perder la posición
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">📅</span>
                            <div>
                                <strong className="text-gray-900">367 Días de Ganancias</strong>
                                <p className="text-sm text-gray-500 mt-1">
                                    Ventana desde el registro para ganar comisiones
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commission Levels */}
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6 md:col-span-2">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        📊 Niveles de Comisión
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 text-left border-b-2 border-gray-200">Nivel</th>
                                    <th className="p-3 text-left border-b-2 border-gray-200">Personas</th>
                                    <th className="p-3 text-right border-b-2 border-gray-200">Comisión</th>
                                    <th className="p-3 text-center border-b-2 border-gray-200">Estado</th>
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
                                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3 font-semibold">Nivel {row.level}</td>
                                        <td className="p-3">{row.persons}</td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            {row.commission}
                                        </td>
                                        <td className="p-3 text-center">
                                            {row.pays ? (
                                                <span className="text-emerald-600 font-semibold">✅ SE PAGA</span>
                                            ) : (
                                                <span className="text-red-600 font-semibold">❌ NO PAGA</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600 m-0">
                            💡 <strong>Nota:</strong> Las comisiones se pagan UNA VEZ al año por cada miembro activo en niveles impares.
                            Total máximo teórico: <span className="font-bold text-emerald-600">$2,790,740.00</span>
                        </p>
                    </div>
                </div>

                {/* Resumen Completo de Ganancias por Nivel */}
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6 md:col-span-2">
                    <h3 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                        📊 Resumen Completo de Ganancias por Nivel
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                    <th className="p-3 md:p-4 text-left rounded-tl-lg">Nivel</th>
                                    <th className="p-3 md:p-4 text-right hidden md:table-cell">Comisión/Persona</th>
                                    <th className="p-3 md:p-4 text-right">Activos</th>
                                    <th className="p-3 md:p-4 text-right">Ganado (Mes)</th>
                                    <th className="p-3 md:p-4 text-right rounded-tr-lg">Potencial Máximo</th>
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
                                        <tr key={idx} className="border-b border-gray-200 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                            <td className="p-3 md:p-4 font-semibold">
                                                <span className="mr-2">{row.emoji}</span>
                                                <span className="block md:inline">Nivel {row.level}</span>
                                            </td>
                                            <td className="p-3 md:p-4 text-right font-mono font-bold text-emerald-600 hidden md:table-cell">
                                                ${row.commission.toFixed(2)}
                                            </td>
                                            <td className="p-3 md:p-4 text-right font-mono font-semibold">
                                                {active.toLocaleString()}
                                            </td>
                                            <td className="p-3 md:p-4 text-right font-mono font-bold text-blue-600">
                                                ${earned.toFixed(2)}
                                            </td>
                                            <td className="p-3 md:p-4 text-right font-mono font-bold text-emerald-600 text-xs md:text-sm">
                                                ${potential.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                    <td colSpan="2" className="p-3 md:p-4 text-sm md:text-base">
                                        💰 TOTAL MES ACTUAL:
                                    </td>
                                    <td className="hidden md:table-cell"></td>
                                    <td className="p-3 md:p-4 text-right text-base md:text-lg">
                                        ${thisYearEarnings.toFixed(2)}
                                    </td>
                                    <td className="p-3 md:p-4 text-right text-base md:text-lg">
                                        $2,790,740.00
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-bold mb-3 text-green-800">
                            📝 Notas Importantes:
                        </h4>
                        <ul className="list-disc pl-5 text-green-800 text-sm space-y-1">
                            <li><strong>Ciclo Mensual:</strong> Del día 28 al día 27 del mes siguiente (Hora Colombia).</li>
                            <li><strong>Activos Actuales:</strong> Número de personas en este nivel que están activas en tu red</li>
                            <li><strong>Ganado Este Mes:</strong> Total de comisiones recibidas en este ciclo</li>
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
