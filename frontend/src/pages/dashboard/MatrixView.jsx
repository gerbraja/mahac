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
        <div className="flex flex-col items-center m-1 md:m-2">
            <div className={`
                flex items-center justify-center 
                w-10 h-10 md:w-[50px] md:h-[50px] 
                rounded-full 
                text-lg md:text-2xl 
                transition-all duration-300
                ${filled
                    ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] border-[3px] border-indigo-600 shadow-md'
                    : 'bg-gray-200 border-2 border-dashed border-gray-400'}
            `}>
                {filled ? '👤' : ''}
            </div>
            {name && (
                <div className="text-[0.6rem] md:text-xs text-gray-500 mt-1 font-semibold">
                    {name}
                </div>
            )}
            {level && (
                <div className="text-[0.6rem] text-gray-400 mt-0.5">
                    Nivel {level}
                </div>
            )}
        </div>
    );
};

const MatrixVisual = ({ matrixConfig, statsData = {}, showTitle = true }) => {
    // Matrix 3x3: 1 + 3 + 9 = 13 total positions
    const level1 = 1; // You
    const level2 = 3; // First level
    const level3 = 9; // Second level

    // Use counts from backend (which properly tracks level 2 and level 3)
    const activeMembers = statsData.active_members || 0;
    const filledLevel2 = statsData.level2_count || 0;
    const filledLevel3 = statsData.level3_count || 0;

    const remaining = 12 - activeMembers; // 12 positions to fill (excluding yourself)

    return (
        <div
            className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden w-full max-w-full"
            style={{ borderColor: matrixConfig.color }}
        >
            <div className="p-4 md:p-8">
                {showTitle && (
                    <div className="text-center mb-6">
                        <div className="text-3xl md:text-4xl mb-2">
                            {matrixConfig.icon}
                        </div>
                        <h3
                            className="text-xl md:text-2xl font-bold mb-2"
                            style={{ color: matrixConfig.color }}
                        >
                            MATRIX {matrixConfig.name}
                        </h3>
                        <div className="text-lg md:text-xl font-bold text-emerald-500 mb-2">
                            Ganancia Total: ${matrixConfig.reward.toLocaleString()} USD
                        </div>

                        {matrixConfig.rewardCrypto > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-3">
                                <div className="px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-500">
                                    <div className="text-xs text-emerald-800 font-semibold">💵 Dólares</div>
                                    <div className="text-sm md:text-base font-bold text-emerald-600">
                                        ${matrixConfig.rewardUSD.toLocaleString()}
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-500">
                                    <div className="text-xs text-amber-800 font-semibold">₿ Cripto</div>
                                    <div className="text-sm md:text-base font-bold text-amber-600">
                                        ${matrixConfig.rewardCrypto.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-amber-800 mt-1">
                                        🔒 Congelada 210 días
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showTitle && (
                    <div className="bg-gray-100 p-3 rounded-lg mb-6 text-center">
                        <div className="text-xs md:text-sm text-gray-500 mb-1">
                            Progreso
                        </div>
                        <div className="text-lg md:text-2xl font-bold text-blue-900">
                            {activeMembers} / 12 posiciones
                        </div>
                        <div className="text-xs md:text-sm text-red-500 mt-1 font-medium">
                            {remaining > 0 ? `Faltan ${remaining} para completar` : '✅ ¡Matrix Completada!'}
                        </div>
                    </div>
                )}

                {/* Matrix Structure */}
                <div className="flex flex-col items-center gap-4 md:gap-6">
                    {/* Level 1 - You */}
                    <div className="text-center">
                        <MatrixNode filled={true} name="TÚ" level={1} />
                    </div>

                    {/* Connector Line */}
                    <div className="w-0.5 h-4 md:h-6 bg-slate-300"></div>

                    {/* Level 2 - 3 positions */}
                    <div className="w-full">
                        <div className="text-xs text-gray-500 text-center mb-2 font-semibold">
                            NIVEL 2 ({filledLevel2}/{level2})
                        </div>
                        <div className="flex justify-center gap-2 md:gap-4">
                            {[...Array(level2)].map((_, i) => (
                                <MatrixNode key={`l2-${i}`} filled={i < filledLevel2} />
                            ))}
                        </div>
                    </div>

                    {/* Connector Line */}
                    <div className="w-0.5 h-4 md:h-6 bg-slate-300"></div>

                    {/* Level 3 - 9 positions */}
                    <div className="w-full">
                        <div className="text-xs text-gray-500 text-center mb-2 font-semibold">
                            NIVEL 3 ({filledLevel3}/{level3})
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 md:gap-3 place-items-center">
                            {[...Array(level3)].map((_, i) => (
                                <MatrixNode key={`l3-${i}`} filled={i < filledLevel3} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { getUserId } from '../../utils/auth';

const MatrixView = () => {
    const [userMatrices, setUserMatrices] = useState({});
    const [matrixStats, setMatrixStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const initUser = async () => {
            try {
                const id = await getUserId();
                setUserId(id);
            } catch (error) {
                console.error("Error getting user ID:", error);
                setLoading(false);
            }
        };
        initUser();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchUserMatrices();
        }
    }, [userId]);

    const fetchUserMatrices = async () => {
        setLoading(true);
        try {
            // Fetch status and stats from backend
            const [statusRes, statsRes] = await Promise.all([
                api.get(`/api/forced-matrix/status/${userId}`),
                api.get(`/api/forced-matrix/stats/${userId}`)
            ]);

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
            <div className="p-8 text-center text-xl text-gray-500">
                Cargando matrices...
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 md:mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
                    🌳 Mis Matrices 3x3
                </h1>
                <p className="text-gray-500 text-base md:text-lg px-4">
                    Sistema de Matrix Cerrada - Completa cada nivel para ganar recompensas
                </p>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-6 rounded-2xl mb-8 md:mb-12 shadow-lg">
                <h3 className="text-lg md:text-xl font-bold mb-3">
                    📚 ¿Cómo funcionan las Matrices?
                </h3>
                <ul className="space-y-2 text-sm md:text-base">
                    <li>✓ Cada matriz tiene 12 posiciones (3 en nivel 2, 9 en nivel 3)</li>
                    <li>✓ Invitas personas que se activan con paquetes de inicio</li>
                    <li>✓ Al completar los 12 espacios, recibes la recompensa completa</li>
                    <li>✓ Puedes tener múltiples reentradas en cada matriz</li>
                </ul>
            </div>

            {/* Main 4 Matrices - Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                {[1, 2, 3, 4].map(matrixId => {
                    const config = MATRIX_LEVELS[matrixId];
                    const statsData = matrixStats.matrices?.[matrixId] || {};

                    return (
                        <MatrixVisual
                            key={matrixId}
                            matrixConfig={config}
                            statsData={statsData}
                            showTitle={true}
                        />
                    );
                })}
            </div>

            {/* Additional Matrices Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 overflow-hidden">
                <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-6">
                    📊 Resumen Completo de Todas las Matrices
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[900px]">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="p-4 text-left border-b-2 border-blue-500">Matriz</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">Nivel</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">Recompensa Total</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">💵 Dólares</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">₿ Cripto</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">🔄 Ciclos Mes</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">Miembros Activos</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">Completadas</th>
                                <th className="p-4 text-center border-b-2 border-blue-500">Total Ganado</th>
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

                                // Placeholder for monthly cycles
                                const monthlyCycles = 0;
                                const remainingCycles = Math.max(0, config.monthlyLimit - monthlyCycles);

                                return (
                                    <tr key={matrixId} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl md:text-3xl">{config.icon}</span>
                                                <div>
                                                    <div
                                                        className="font-bold text-base"
                                                        style={{ color: config.color }}
                                                    >
                                                        {config.name}
                                                    </div>
                                                    <div className={`text-xs ${isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {isActive ? '✓ Activa' : '✗ No Registrado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-semibold">
                                            Nivel {matrixId}
                                        </td>
                                        <td className="p-4 text-center font-bold text-emerald-500">
                                            ${config.reward.toLocaleString()} USD
                                        </td>
                                        <td className="p-4 text-center font-semibold text-emerald-600">
                                            ${config.rewardUSD.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center font-semibold text-amber-600">
                                            {config.rewardCrypto > 0 ? (
                                                <div>
                                                    <div>${config.rewardCrypto.toLocaleString()}</div>
                                                    <div className="text-[10px] text-amber-800 mt-1">
                                                        🔒 210 días
                                                    </div>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`
                                                    px-3 py-2 rounded-lg border-2 font-bold text-lg
                                                    ${monthlyCycles >= config.monthlyLimit
                                                        ? 'bg-red-100 border-red-600 text-red-600'
                                                        : 'bg-blue-100 border-blue-500 text-blue-800'}
                                                `}>
                                                    {monthlyCycles}/{config.monthlyLimit}
                                                </div>
                                                {remainingCycles > 0 ? (
                                                    <div className="text-[10px] text-emerald-600 font-bold">
                                                        ✅ Faltan {remainingCycles}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-red-600 font-bold">
                                                        ⚠️ Límite alcanzado
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-blue-500 text-lg">
                                            {activeMembers}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`
                                                px-4 py-2 rounded-full font-bold text-base
                                                ${cyclesCompleted > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}
                                            `}>
                                                {cyclesCompleted}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-lg">
                                            <span className={totalEarned > 0 ? 'text-emerald-500' : 'text-gray-500'}>
                                                ${totalEarned.toLocaleString()} USD
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gradient-to-r from-blue-900 to-blue-500 text-white font-bold text-lg md:text-xl">
                                <td colSpan="8" className="p-6 text-right">
                                    💰 TOTAL ACUMULADO DE TODAS LAS MATRICES:
                                </td>
                                <td className="p-6 text-center text-2xl md:text-3xl">
                                    ${(matrixStats.total_earned_usd || 0).toLocaleString()} USD
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-8 p-6 bg-gray-100 rounded-xl border-l-4 border-blue-500">
                    <h4 className="font-bold text-blue-900 mb-3">
                        📝 Nota:
                    </h4>
                    <ul className="space-y-2 text-gray-600 text-sm md:text-base">
                        <li>• <strong>Ciclos Mes:</strong> Muestra cuántas veces has completado esta matriz en el mes actual</li>
                        <li>• <strong>Miembros Activos:</strong> Número de personas activas en tu matriz actual (Meta: 12)</li>
                        <li>• <strong>Completadas:</strong> Matrices que has llenado completamente (12/12 posiciones)</li>
                        <li>• <strong>Total Ganado:</strong> Suma de todas las recompensas obtenidas en esta matriz</li>
                    </ul>
                </div>

                {/* Crypto Information */}
                <div className="mt-8 p-4 md:p-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl text-white shadow-lg overflow-hidden">
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <div className="text-4xl md:text-5xl">₿</div>
                        <div className="min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold leading-tight">
                                Sistema de Criptomonedas
                            </h3>
                            <p className="opacity-90 text-sm md:text-base mt-1">
                                Información importante sobre tus recompensas en cripto
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm">
                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <span className="text-xl md:text-2xl shrink-0 mt-0.5">🔒</span>
                                <div className="text-sm md:text-base">
                                    <strong>Periodo de Congelamiento:</strong> Las criptomonedas quedan congeladas por <strong>210 días</strong> desde la fecha en que las ganas.
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-xl md:text-2xl shrink-0 mt-0.5">⏱️</span>
                                <div className="text-sm md:text-base">
                                    <strong>Contador Regresivo:</strong> Verás un contador en tiempo real mostrando cuántos días faltan para que tus criptos estén disponibles.
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-xl md:text-2xl shrink-0 mt-0.5">💰</span>
                                <div className="text-sm md:text-base">
                                    <strong>Valor del Token:</strong> Cada token de cripto = <strong>$1 USD</strong>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-xl md:text-2xl shrink-0 mt-0.5">✅</span>
                                <div className="text-sm md:text-base">
                                    <strong>Después de 210 días puedes:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Convertir a efectivo dentro de la plataforma</li>
                                        <li>Transferir a Binance para vender</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 p-4 bg-white/10 rounded-lg text-center text-sm">
                        💡 <strong>Tip:</strong> Consulta la sección "💰 Billetera" para ver el detalle de tus criptos congeladas y disponibles
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatrixView;
