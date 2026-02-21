import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const DirectsView = () => {
    const [directs, setDirects] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchUserIdAndDirects();
    }, []);

    const fetchUserIdAndDirects = async () => {
        setLoading(true);
        try {
            // Always fetch fresh userId from API to ensure correct data
            const userResponse = await api.get('/auth/me');
            const currentUserId = userResponse.data.id;

            setUserId(currentUserId);

            // Now fetch directs with the correct userId
            const res = await api.get(`/api/unilevel/directs/${currentUserId}`);
            console.log('Directs:', res.data);
            setDirects(res.data);
        } catch (error) {
            console.error('Error fetching directs:', error);
            setDirects({ total_directs: 0, total_network: 0, directs: [] });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-xl text-gray-500">
                Cargando datos de afiliados...
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-br from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                    👥 Mis Afiliados Directos
                </h1>
                <p className="text-gray-500 text-lg">
                    Personas que has afiliado personalmente a tu red
                </p>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Total Directs */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-b-4 border-emerald-500 text-center">
                    <div className="text-4xl md:text-5xl mb-3">👤</div>
                    <div className="text-sm text-gray-500 mb-2 font-medium">
                        Afiliados Directos (Nivel 1)
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-emerald-600">
                        {directs?.total_directs || 0}
                    </div>
                    <div className="text-xs text-gray-400 mt-3">
                        Personas que afiliaste directamente
                    </div>
                </div>

                {/* Total Network */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-b-4 border-indigo-500 text-center">
                    <div className="text-4xl md:text-5xl mb-3">🌐</div>
                    <div className="text-sm text-gray-500 mb-2 font-medium">
                        Total Red (Todos los Niveles)
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-indigo-600">
                        {directs?.total_network || 0}
                    </div>
                    <div className="text-xs text-gray-400 mt-3">
                        Todas las personas en tu red
                    </div>
                </div>
            </div>

            {/* List of Directs */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                    📋 Lista de Afiliados
                </h2>

                {directs && directs.total_directs > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
                                <tr>
                                    <th className="p-4 text-left font-bold border-b-2 border-emerald-600 rounded-tl-lg">
                                        #
                                    </th>
                                    <th className="p-4 text-left font-bold border-b-2 border-emerald-600">
                                        Nombre
                                    </th>
                                    <th className="p-4 text-left font-bold border-b-2 border-emerald-600">
                                        Email
                                    </th>
                                    <th className="p-4 text-center font-bold border-b-2 border-emerald-600 rounded-tr-lg">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {directs.directs.map((direct, index) => (
                                    <tr key={direct.user_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}>
                                        <td className="p-4 font-semibold text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                                    {direct.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">
                                                        {direct.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ID: {direct.user_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm break-all">
                                            {direct.email}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${direct.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {direct.status === 'active' ? '✅ Activo' : '⏸️ Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <div className="text-6xl mb-4 text-gray-300">👥</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            No tienes afiliados directos aún
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Comienza a invitar personas a tu red para construir tu negocio y ganar comisiones
                        </p>
                        <div className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="text-lg font-bold mb-1">
                                🎯 Próximo Paso
                            </div>
                            <p className="text-sm opacity-90">
                                Invita a personas a unirse a tu red y comienza a generar ingresos
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 md:p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    ℹ️ Información sobre Afiliados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <h4 className="text-lg font-bold mb-2 text-emerald-100">
                            ¿Qué son tus afiliados directos?
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Son las personas que patrocinaste personalmente al unirse a la red. Ellos son tu Nivel 1 y son los que generan comisiones para ti a través del sistema Unilevel.
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <h4 className="text-lg font-bold mb-2 text-emerald-100">
                            ¿Cuáles son tus beneficios?
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Recibes el 1% de comisión de sus compras. Además, si ellos patrocina a otros, tú recibes comisiones de hasta 7 niveles de profundidad.
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <h4 className="text-lg font-bold mb-2 text-emerald-100">
                            🎁 Bono Matching
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Recibe el 50% extra de las comisiones que generan tus directs. Si tus directs ganan $100 en comisiones, tú ganas $50 adicionales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectsView;
