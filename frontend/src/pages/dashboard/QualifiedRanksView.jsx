import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function QualifiedRanksView() {
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
            const response = await api.get('/api/admin/qualified-ranks');
            setRanks(response.data);
        } catch (err) {
            console.error('Error fetching qualified ranks:', err);
            setError('Error al cargar los rangos de calificación');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                    🏆 Rangos de Calificación
                </h2>
                <p className="text-gray-600">
                    Rangos basados en Matrix ID completados. Alcanza estos hitos para obtener recompensas especiales.
                </p>
            </div>

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

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ranks.map((rank, index) => (
                        <div
                            key={rank.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                        >
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                                <h3 className="text-xl font-bold text-white">{rank.name}</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Matrix ID Requerido</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {rank.matrix_id_required.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Recompensa</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(rank.reward_amount)}
                                    </p>
                                </div>
                                {rank.monthly_limit && (
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Límite Mensual</p>
                                        <p className="text-lg font-semibold text-gray-700">
                                            {rank.monthly_limit} veces
                                        </p>
                                    </div>
                                )}
                                {rank.yearly_limit && (
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Límite Anual</p>
                                        <p className="text-lg font-semibold text-gray-700">
                                            {rank.yearly_limit} veces
                                        </p>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Usuarios que lo alcanzaron</span>
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
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
                    <p className="text-gray-500 text-lg">No hay rangos de calificación configurados.</p>
                </div>
            )}
        </div>
    );
}
