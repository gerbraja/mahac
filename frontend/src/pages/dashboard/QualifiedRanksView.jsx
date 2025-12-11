import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function QualifiedRanksView() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Datos REALES de rangos de calificación - Dinero que se gana por cada Matrix completada
    const defaultRanks = [
        { 
            id: 1, 
            name: 'Consumidor', 
            emoji: '👤', 
            color: 'from-blue-500 to-blue-700', 
            matrix_id: 27,
            earning: '$77',
            monthly_limit: 14
        },
        { 
            id: 2, 
            name: 'Bronce', 
            emoji: '🥉', 
            color: 'from-amber-600 to-amber-800', 
            matrix_id: 77,
            earning: '$277',
            monthly_limit: 10
        },
        { 
            id: 3, 
            name: 'Plata', 
            emoji: '🥈', 
            color: 'from-gray-400 to-gray-600', 
            matrix_id: 277,
            earning: '$877',
            monthly_limit: 8
        },
        { 
            id: 4, 
            name: 'Oro', 
            emoji: '🥇', 
            color: 'from-yellow-400 to-yellow-600', 
            matrix_id: 877,
            earning: '$3,000 ($1,500 USD + $1,500 Crypto)',
            monthly_limit: 7,
            special: true
        },
        { 
            id: 5, 
            name: 'Platino', 
            emoji: '💎', 
            color: 'from-blue-300 to-blue-500', 
            matrix_id: 3000,
            earning: '$9,700 ($4,850 USD + $4,850 Crypto)',
            monthly_limit: 6,
            special: true
        },
        { 
            id: 6, 
            name: 'Rubí', 
            emoji: '💍', 
            color: 'from-red-600 to-red-800', 
            matrix_id: 9700,
            earning: '$25,000 ($12,500 USD + $12,500 Crypto)',
            monthly_limit: 5,
            special: true
        },
        { 
            id: 7, 
            name: 'Esmeralda', 
            emoji: '💚', 
            color: 'from-green-600 to-green-800', 
            matrix_id: 30000,
            earning: '$77,000 ($38,500 USD + $38,500 Crypto)',
            monthly_limit: 4,
            special: true
        },
        { 
            id: 8, 
            name: 'Diamante', 
            emoji: '✨', 
            color: 'from-cyan-400 to-cyan-600', 
            matrix_id: 100000,
            earning: '$270,000 ($135,000 USD + $135,000 Crypto)',
            monthly_limit: 3,
            special: true
        },
        { 
            id: 9, 
            name: 'Diamante Azul', 
            emoji: '🔷', 
            color: 'from-indigo-600 to-indigo-800', 
            matrix_id: 300000,
            earning: '$970,000 ($485,000 USD + $485,000 Crypto)',
            monthly_limit: 2,
            special: true
        },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-8">
            {/* Encabezado */}
            <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">🏆 Rangos de Calificación</h2>
                <p className="text-gray-600 text-lg">
                    Cada rango de calificación te permite ganar más dinero por cada Matrix que completes. Sube de rango completando más Matrices en tu estructura. Los rangos superiores (Diamante Rojo+) se muestran cuando califiques a Diamante Azul.
                </p>
            </div>

            {/* Barra de Progreso */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl shadow-lg border-2 border-purple-300">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold text-gray-800">Tu Progreso en Calificación</span>
                        <span className="text-2xl font-bold text-gray-600">Consumidor - Ganas $77 por Matrix</span>
                    </div>
                    
                    {/* Barra Visual Principal */}
                    <div className="relative w-full h-14 bg-gray-400 rounded-full overflow-hidden shadow-md mb-4">
                        {/* Relleno de progreso */}
                        <div 
                            className="absolute h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 transition-all duration-500 flex items-center"
                            style={{width: '0%'}}
                        >
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-purple-600"></div>
                        </div>
                        
                        {/* Indicador de progreso */}
                        <div className="absolute inset-0 flex items-center pl-4 text-white font-bold drop-shadow-lg">
                            <span className="text-sm">Rango: Consumidor | Ganancia: $77 por Matrix</span>
                        </div>
                    </div>

                    {/* Etiquetas de Rangos Debajo - Grid responsivo */}
                    <div className="grid grid-cols-5 lg:grid-cols-15 gap-1 text-center text-xs font-semibold mt-4">
                        {defaultRanks.map((rank, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className="text-lg mb-1">{rank.emoji}</div>
                                <span className="text-gray-800 text-xs truncate">{rank.name.split(' ')[0]}</span>
                                <span className="text-gray-600 text-xs font-bold text-purple-700">{rank.earning}</span>
                            </div>
                        ))}
                    </div>

                    {/* Descripción del progreso */}
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                        <p className="text-sm text-gray-800">
                            <span className="font-bold">Rango Actual: Consumidor</span><br/>
                            Ganancia por Matrix: $77 USD<br/>
                            <span className="text-purple-600 font-semibold">Próximo Rango: Bronce ($277 por Matrix - 77 Matrix IDs)</span>
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
                            className={`bg-gradient-to-br ${rank.color} rounded-2xl shadow-xl p-4 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
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
                            <div className="mb-3 space-y-2">
                                <div>
                                    <p className="text-xs opacity-90 mb-1">💰 Ganancia por Matrix</p>
                                    <p className="text-2xl font-bold">{rank.earning}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-90 mb-1">📊 Límite</p>
                                    <p className="text-sm font-semibold">
                                        {rank.monthly_limit ? `${rank.monthly_limit}x/mes` : rank.yearly_limit ? `${rank.yearly_limit}x/año` : 'Sin límite'}
                                    </p>
                                </div>
                            </div>

                            {/* Badge de estado */}
                            <div className="mt-3 pt-3 border-t border-white/30 text-center">
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
                        <p>Diamante ($270,000) → Diamante Azul ($970,000)</p>
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
                        <p className="font-semibold text-orange-700 mb-2">⚠️ Pago Mixto a partir de Oro:</p>
                        <p>Cuando califiques a Oro o superior, el 50% de tu ganancia se paga en Dólares USD</p>
                        <p>El otro 50% se paga en Criptomoneda (según los términos del sistema)</p>
                        <p>Ejemplo: En Oro ganas $3,000 = $1,500 USD + $1,500 en Crypto</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
