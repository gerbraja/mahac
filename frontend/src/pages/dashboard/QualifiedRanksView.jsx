import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function QualifiedRanksView() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [achievedRanks, setAchievedRanks] = useState([]);
    const [currentRankInfo, setCurrentRankInfo] = useState(null);

    // Datos REALES de rangos de calificación - Dinero que se gana por cada Matrix completada + PREMIOS
    const defaultRanks = [
        {
            id: 1,
            name: 'Consumidor',
            emoji: '👤',
            color: 'from-blue-500 to-blue-700',
            matrix_id: 27,
            earning: '$77',
            monthly_limit: 14,
            prize: null
        },
        {
            id: 2,
            name: 'Bronce',
            emoji: '🥉',
            color: 'from-amber-600 to-amber-800',
            matrix_id: 77,
            earning: '$277',
            monthly_limit: 10,
            prize: null
        },
        {
            id: 3,
            name: 'Plata',
            emoji: '🥈',
            color: 'from-gray-400 to-gray-600',
            matrix_id: 277,
            earning: '$877',
            monthly_limit: 8,
            prize: '🎁 $127 USD (Compra Productos)'
        },
        {
            id: 4,
            name: 'Oro',
            emoji: '🥇',
            color: 'from-yellow-400 to-yellow-600',
            matrix_id: 877,
            earning: '$3,000 ($1,500 USD + $1,500 Crypto)',
            monthly_limit: 7,
            special: true,
            prize: '🎁 $500 USD (Compra Productos)'
        },
        {
            id: 5,
            name: 'Platino',
            emoji: '💎',
            color: 'from-blue-300 to-blue-500',
            matrix_id: 3000,
            earning: '$9,700 ($4,850 USD + $4,850 Crypto)',
            monthly_limit: 6,
            special: true,
            prize: '🎁 $1,700 USD (Compra Productos)'
        },
        {
            id: 6,
            name: 'Rubí',
            emoji: '💍',
            color: 'from-red-600 to-red-800',
            matrix_id: 9700,
            earning: '$25,000 ($12,500 USD + $12,500 Crypto)',
            monthly_limit: 5,
            special: true,
            prize: '✈️ Viaje Nacional x3'
        },
        {
            id: 7,
            name: 'Esmeralda',
            emoji: '💚',
            color: 'from-green-600 to-green-800',
            matrix_id: 30000,
            earning: '$77,000 ($38,500 USD + $38,500 Crypto)',
            monthly_limit: 4,
            special: true,
            prize: '🚢 Crucero x4'
        },
        {
            id: 8,
            name: 'Diamante',
            emoji: '✨',
            color: 'from-cyan-400 to-cyan-600',
            matrix_id: 100000,
            earning: '$270,000 ($135,000 USD + $135,000 Crypto)',
            monthly_limit: 3,
            special: true,
            prize: '🚗 Auto $47k USD + ✈️ Viaje Int.'
        },
        {
            id: 9,
            name: 'Diamante Azul',
            emoji: '🔷',
            color: 'from-indigo-600 to-indigo-800',
            matrix_id: 300000,
            earning: 'Confidencial - Se revelará en seminario de Diamantes',
            monthly_limit: 2,
            special: true,
            prize: null
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/api/wallet/summary');
                const qualifiedData = response.data.earnings_by_source?.qualified_ranks?.bonuses || [];
                const achievedNames = qualifiedData.map(d => d.rank);
                setAchievedRanks(achievedNames);

                // Find highest achieved rank
                let highest = null;
                // Iterate backwards to find highest
                for (let i = defaultRanks.length - 1; i >= 0; i--) {
                    if (achievedNames.includes(defaultRanks[i].name)) {
                        highest = defaultRanks[i];
                        break;
                    }
                }
                setCurrentRankInfo(highest);

            } catch (err) {
                console.error(err);
                setError('Error cargando rangos');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Determine next rank
    const nextRankIdx = currentRankInfo
        ? defaultRanks.findIndex(r => r.name === currentRankInfo.name) + 1
        : 0;
    const nextRank = nextRankIdx < defaultRanks.length ? defaultRanks[nextRankIdx] : null;

    // Calculate visualization progress (simplified: based on milestones count)
    const totalSteps = defaultRanks.length;
    const currentStep = currentRankInfo ? defaultRanks.findIndex(r => r.name === currentRankInfo.name) + 1 : 0;
    const progressPercent = (currentStep / totalSteps) * 100;

    return (
        <div className="p-6 space-y-8">
            {/* Encabezado */}
            <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">🏆 Rangos de Calificación y Premios</h2>
                <p className="text-gray-600 text-lg">
                    Cada rango de calificación te permite ganar más dinero por Matrix y obtener increíbles Premios en Productos, Viajes y Autos.
                </p>
            </div>

            {/* Barra de Progreso */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl shadow-lg border-2 border-purple-300">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold text-gray-800">Tu Progreso en Calificación</span>
                        <span className="text-2xl font-bold text-gray-600">
                            {currentRankInfo ? `${currentRankInfo.name} - Ganas ${currentRankInfo.earning} por Matrix` : 'Sin Calificación Aún'}
                        </span>
                    </div>

                    {/* Barra Visual Principal */}
                    <div className="relative w-full h-14 bg-gray-400 rounded-full overflow-hidden shadow-md mb-4">
                        {/* Relleno de progreso */}
                        <div
                            className="absolute h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 transition-all duration-500 flex items-center"
                            style={{ width: `${Math.max(5, progressPercent)}%` }}
                        >
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-purple-600"></div>
                        </div>

                        {/* Indicador de progreso */}
                        <div className="absolute inset-0 flex items-center pl-4 text-white font-bold drop-shadow-lg">
                            <span className="text-sm">Rango: {currentRankInfo ? currentRankInfo.name : 'Inicial'} | Ganancia: {currentRankInfo ? currentRankInfo.earning : '$0'} por Matrix</span>
                        </div>
                    </div>

                    {/* Etiquetas de Rangos Debajo - Grid responsivo */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs font-semibold mt-4">
                        {defaultRanks.map((rank, idx) => {
                            const isAchieved = achievedRanks.includes(rank.name);
                            return (
                                <div key={idx} className={`flex flex-col items-center p-1 rounded-lg transition-colors ${isAchieved ? 'bg-purple-200 border border-purple-400' : 'hover:bg-white/50'}`}>
                                    <div className="text-lg mb-1">{rank.emoji}</div>
                                    <span className="text-gray-800 text-xs truncate max-w-full">{rank.name.split(' ')[0]}</span>
                                    <span className="text-purple-700 text-[10px] sm:text-xs font-bold truncate max-w-full">
                                        {rank.earning.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Descripción del progreso */}
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                        <p className="text-sm text-gray-800">
                            <span className="font-bold">Rango Actual: {currentRankInfo ? currentRankInfo.name : 'Ninguno'}</span><br />
                            Ganancia por Matrix: {currentRankInfo ? currentRankInfo.earning : '$0'} USD<br />
                            <span className="text-purple-600 font-semibold">
                                {nextRank
                                    ? `Próximo Rango: ${nextRank.name} (${nextRank.earning} por Matrix - Meta: ${nextRank.matrix_id} Matrix completadas)`
                                    : '¡Has alcanzado el máximo rango!'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de Tarjetas de Rangos */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {defaultRanks.map((rank, index) => (
                        <div
                            key={rank.id}
                            className={`bg-gradient-to-br ${rank.color} rounded-2xl shadow-xl p-4 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col`}
                        >
                            {/* Emoji e Índice */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-4xl">{rank.emoji}</div>
                                <div className="text-xs bg-white/30 px-2 py-1 rounded-full">
                                    {index + 1}/15
                                </div>
                            </div>

                            {/* Nombre del Rango */}
                            <h3 className="text-lg font-bold mb-1">{rank.name}</h3>

                            {/* Divisor */}
                            <div className="w-full h-1 bg-white/20 rounded-full mb-3"></div>

                            {/* Requisitos */}
                            <div className="mb-3 space-y-2 flex-grow">
                                <div>
                                    <p className="text-xs opacity-90 mb-1">💰 Ganancia por Matrix</p>
                                    <p className="text-xl font-bold">{rank.earning}</p>
                                </div>
                                {rank.prize && (
                                    <div className="bg-white/20 p-2 rounded-lg mt-2">
                                        <p className="text-xs font-bold text-yellow-300 mb-0.5">🏆 PREMIO EXTRA</p>
                                        <p className="text-sm font-bold leading-tight">{rank.prize}</p>
                                    </div>
                                )}
                                <div className="mt-2">
                                    <p className="text-xs opacity-90 mb-1">📊 Límite</p>
                                    <p className="text-sm font-semibold">
                                        {rank.monthly_limit ? `${rank.monthly_limit}x/mes` : rank.yearly_limit ? `${rank.yearly_limit}x/año` : 'Sin límite'}
                                    </p>
                                </div>
                            </div>

                            {/* Badge de estado */}
                            <div className="mt-auto pt-3 border-t border-white/30 text-center">
                                {index === 0 ? (
                                    <span className="inline-block bg-yellow-300 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">✓ Próximo</span>
                                ) : (
                                    <span className="inline-block bg-white/30 px-3 py-1 rounded-full text-xs font-semibold">Por Alcanzar</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Cargando rangos...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Información Adicional */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-300 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">💰 Cómo Ganas Dinero con los Rangos de Calificación</h3>
                <div className="space-y-4 text-gray-700 text-sm">
                    <div>
                        <p className="font-semibold text-purple-700 mb-2">Cómo Funciona:</p>
                        <p>✓ Cada rango define cuánto dinero ganas por cada Matrix completada</p>
                        <p>✓ Consumidor: Ganas $77 por cada Matrix que completes</p>
                        <p>✓ Bronce: Ganas $277 por cada Matrix que completes</p>
                        <p>✓ Plata: Ganas $877 por cada Matrix que completes</p>
                        <p>✓ A partir de Oro y superiores: 50% en Dólares USD + 50% en Criptomoneda</p>
                    </div>
                    <div>
                        <p className="font-semibold text-purple-700 mb-2">Ejemplo de Progresión de Ganancias:</p>
                        <p>Consumidor ($77) → Bronce ($277) → Plata ($877) → Oro ($3,000 total)</p>
                        <p>Platino ($9,700) → Rubí ($25,000) → Esmeralda ($77,000)</p>
                        <p>Diamante ($270,000) → Diamante Azul</p>
                    </div>
                    <div>
                        <p className="font-semibold text-purple-700 mb-2">Límites Mensuales por Rango:</p>
                        <p>✓ Consumidor: 14 veces por mes</p>
                        <p>✓ Bronce: 10 veces por mes</p>
                        <p>✓ Plata: 8 veces por mes</p>
                        <p>✓ Oro: 7 veces por mes</p>
                        <p>✓ Diamante Azul: 2 veces por mes</p>
                        <p>Los rangos superiores (Diamante Rojo en adelante) solo se muestran cuando califiques</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-300 mt-4">
                        <p className="font-semibold text-orange-700 mb-2">🏆 Premio Adicional por Tu fidelidad:</p>
                        <p>Por ejemplo: Si ganas $1,500 dólares en Oro, te regalan $1,500 dólares en cripto.</p>
                        <p>En Platino, si ganas $4,850 dólares, la empresa te obsequia $4,850 en Cripto por tu fidelidad.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
