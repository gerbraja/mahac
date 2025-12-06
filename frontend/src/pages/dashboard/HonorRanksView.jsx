import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function HonorRanksView() {
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRanks();
    }, []);

    const fetchRanks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/admin/honor-ranks');
            setRanks(response.data);
        } catch (err) {
            console.error('Error fetching honor ranks:', err);
            setError('Error al cargar los rangos de honor');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-2">
                    💎 Rangos de Honor
                </h2>
                <p className="text-gray-600">
                    Rangos basados en comisiones acumuladas. Alcanza estos niveles para obtener premios exclusivos.
                </p>
            </div>

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

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ranks.map((rank, index) => (
                        <div
                            key={rank.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                        >
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
                                <h3 className="text-xl font-bold text-white">{rank.name}</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Comisión Requerida</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(rank.commission_required)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Recompensa</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {rank.reward_description}
                                    </p>
                                    {rank.reward_value_usd && (
                                        <p className="text-lg font-bold text-green-600 mt-2">
                                            {formatCurrency(rank.reward_value_usd)}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Usuarios que lo alcanzaron</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            {rank.users_achieved}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && ranks.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg">No hay rangos de honor configurados.</p>
                </div>
            )}
        </div>
    );
}
