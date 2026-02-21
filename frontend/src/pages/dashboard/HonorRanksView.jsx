import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function HonorRanksView() {
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentCommission, setCurrentCommission] = useState(0);
    const [nextRank, setNextRank] = useState(null);

    // Datos reales de los rangos de honor del sistema
    const defaultRanks = [
        {
            id: 1,
            name: 'Silver',
            emoji: '🥈',
            color: 'from-gray-400 to-gray-600',
            commission: 1000,
            reward: 'Reward $97 worth of products',
            reward_value: 97
        },
        {
            id: 2,
            name: 'Gold',
            emoji: '🥇',
            color: 'from-yellow-400 to-yellow-600',
            commission: 3700,
            reward: 'Reward $277 worth of products',
            reward_value: 277
        },
        {
            id: 3,
            name: 'Platinum',
            emoji: '💎',
            color: 'from-blue-300 to-blue-500',
            commission: 5700,
            reward: 'Gift for $1000 USD',
            reward_value: 1000
        },
        {
            id: 4,
            name: 'Rubí',
            emoji: '💍',
            color: 'from-red-600 to-red-800',
            commission: 9700,
            reward: 'Domestic Trip x3',
            reward_value: null
        },
        {
            id: 5,
            name: 'Esmeralda',
            emoji: '💚',
            color: 'from-green-600 to-green-800',
            commission: 19700,
            reward: 'Cruise x4',
            reward_value: null
        },
        {
            id: 6,
            name: 'Diamond',
            emoji: '✨',
            color: 'from-cyan-400 to-cyan-600',
            commission: 37700,
            reward: 'International Cruise x5 + Pool 7%',
            reward_value: null
        },
        {
            id: 7,
            name: 'Blue Diamond',
            emoji: '🔷',
            color: 'from-indigo-600 to-indigo-800',
            commission: 77700,
            reward: 'Luxury trip x5 + Pool 7%',
            reward_value: null
        },
    ];

    useEffect(() => {
        fetchRanks();
    }, []);

    const fetchRanks = async () => {
        try {
            const response = await api.get('/api/wallet/summary');
            const data = response.data;
            const earned = data.total_earnings || 0;

            setCurrentCommission(earned);
            setRanks(defaultRanks); // We use the static definitions but currentCommission drives logic

            // Determine next rank
            const next = defaultRanks.find(r => r.commission > earned);
            setNextRank(next || null);

        } catch (err) {
            console.error(err);
            setError('Error al cargar información de rangos');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Calculate progress percentage
    const targetCommission = nextRank ? nextRank.commission : (defaultRanks[defaultRanks.length - 1].commission * 1.2); // Cap if maxed
    const progressPercent = Math.min(100, Math.max(0, (currentCommission / targetCommission) * 100));

    return (
        <div className="p-6 space-y-8">
            {/* Encabezado */}
            <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">💎 Rangos de Honor</h2>
                <p className="text-gray-600 text-lg">
                    Rangos basados en comisiones acumuladas. Alcanza estos niveles para obtener premios exclusivos.
                </p>
            </div>

            {/* Barra de Progreso */}
            <div className="bg-gradient-to-r from-gray-100 to-blue-100 p-8 rounded-2xl shadow-lg border-2 border-indigo-200">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold text-gray-800">Tu Progreso en los Rangos</span>
                        <span className="text-2xl font-bold text-gray-600">
                            {nextRank
                                ? `Próximo: ${nextRank.name} (${progressPercent.toFixed(1)}%)`
                                : '¡Máximo Rango Alcanzado!'}
                        </span>
                    </div>

                    {/* Barra Visual Principal */}
                    <div className="relative w-full h-12 bg-gray-400 rounded-full overflow-hidden shadow-md mb-4">
                        {/* Relleno de progreso */}
                        <div
                            className="absolute h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-green-400 transition-all duration-500 flex items-center"
                            style={{ width: `${progressPercent}%` }}
                        >
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-green-500"></div>
                        </div>

                        {/* Indicador de progreso */}
                        <div className="absolute inset-0 flex items-center pl-4 text-white font-bold drop-shadow-lg">
                            <span className="text-sm">
                                {formatCurrency(currentCommission)} / {formatCurrency(targetCommission)}
                            </span>
                        </div>
                    </div>

                    {/* Etiquetas de Rangos Debajo */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 text-center text-xs font-semibold mt-4">
                        {defaultRanks.map((rank, idx) => (
                            <div key={idx} className={`flex flex-col items-center p-1 rounded-lg transition-colors ${currentCommission >= rank.commission ? 'bg-green-100 border border-green-300' : 'hover:bg-white/50'}`}>
                                <div className="text-xl mb-1">{rank.emoji}</div>
                                <span className="text-gray-800 truncate max-w-full">{rank.name}</span>
                                <span className="text-gray-600 text-[10px] sm:text-xs font-bold truncate max-w-full">
                                    ${rank.commission.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Descripción del progreso */}
                    <div className="mt-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-300">
                        <p className="text-sm text-gray-800">
                            <span className="font-bold">Total Comisiones: {formatCurrency(currentCommission)}</span><br />
                            Meta Siguiente: {formatCurrency(targetCommission)}<br />
                            <span className="text-indigo-600 font-semibold">
                                {nextRank
                                    ? `¡Falta ${formatCurrency(targetCommission - currentCommission)} para alcanzar ${nextRank.name}!`
                                    : '¡Felicidades, eres un líder top!'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de Tarjetas de Rangos */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {defaultRanks.map((rank, index) => (
                        <div
                            key={rank.id}
                            className={`bg-gradient-to-br ${rank.color} rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                        >
                            {/* Emoji e Índice */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-5xl">{rank.emoji}</div>
                                <div className="text-sm bg-white/30 px-3 py-1 rounded-full">
                                    Nivel {index + 1}/7
                                </div>
                            </div>

                            {/* Nombre del Rango */}
                            <h3 className="text-2xl font-bold mb-1">{rank.name}</h3>
                            <p className="text-xs opacity-90 mb-4 capitalize">
                                {index === 0 ? 'Rango de entrada' : index < 6 ? 'Rango intermedio' : 'Rango máximo'}
                            </p>

                            {/* Divisor */}
                            <div className="w-full h-1 bg-white/20 rounded-full mb-4"></div>

                            {/* Requisitos */}
                            <div className="mb-4 space-y-3">
                                <div>
                                    <p className="text-xs opacity-90 mb-1">💰 Comisión Requerida</p>
                                    <p className="text-xl font-bold">{formatCurrency(rank.commission)}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-90 mb-1">🎁 Recompensa</p>
                                    <p className="text-sm font-semibold">{rank.reward}</p>
                                    {rank.reward_value && (
                                        <p className="text-lg font-bold mt-1">{formatCurrency(rank.reward_value)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Badge de estado */}
                            <div className="mt-4 pt-4 border-t border-white/30 text-center">
                                {index === 0 ? (
                                    <span className="inline-block bg-yellow-300 text-gray-800 px-4 py-2 rounded-full text-sm font-bold">✓ Rango Actual</span>
                                ) : (
                                    <span className="inline-block bg-white/30 px-4 py-2 rounded-full text-sm font-semibold">Por Alcanzar</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Cargando rangos...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Información Adicional */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Cómo Alcanzar Rangos Superiores</h3>
                <div className="space-y-4 text-gray-700 text-sm">
                    <div>
                        <p className="font-semibold text-indigo-700 mb-2">Requisito Principal:</p>
                        <p>✓ Acumula ganancias en comisiones de equipo, bonos de matching y ganancias de matrix</p>
                        <p className="text-xs opacity-75 mt-1">Nota: No incluye bonos especiales de compra o cambio de productos</p>
                    </div>
                    <div>
                        <p className="font-semibold text-indigo-700 mb-2">Ejemplo:</p>
                        <p>Si has ganado $600 en comisiones de equipo + $250 en matching bonus + $150 en matrix = $1,000 total → Calificas para Rango Silver</p>
                    </div>
                    <div>
                        <p className="font-semibold text-indigo-700 mb-2">Beneficios:</p>
                        <p>✓ Los rangos son permanentes una vez alcanzados</p>
                        <p>✓ Recibe premios exclusivos (productos, dinero, viajes)</p>
                        <p>✓ Aumenta tu estatus en la comunidad</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
