import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

export default function AdminPromotions() {
    const [data, setData] = useState({ total_qualifiers: 0, qualifiers: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchQualifiers();
    }, []);

    const fetchQualifiers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/promotions/admin/qualifiers');
            setData(response.data);
        } catch (error) {
            console.error("Error fetching qualifiers:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (userId) => {
        try {
            setDetailLoading(true);
            // Reutilizamos el endpoint de usuario pasándole un query param o usando el cálculo
            // Dado que el administrador puede ver el progreso del usuario,
            // podemos realizar la petición directamente.
            // Para simplicidad, podemos usar el endpoint del usuario. 
            // Para que el admin pueda auditar a CUALQUIER usuario, podemos agregar un query param user_id al backend
            // o llamar al endpoint.
            // Hagamos que el backend soporte esto agregando ?user_id al router de promociones.
            const response = await api.get(`/api/promotions/travel-status?user_id=${userId}`);
            setUserDetail(response.data);
        } catch (error) {
            console.error("Error fetching user promotion detail:", error);
            alert("No se pudo cargar el detalle de la estructura");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewStructure = (qualifier) => {
        setSelectedUser(qualifier);
        setUserDetail(null);
        fetchUserDetail(qualifier.user_id);
    };

    // Filtro de búsqueda
    const filteredQualifiers = data.qualifiers.filter(q => 
        q.name.toLowerCase().includes(search.toLowerCase()) ||
        (q.membership_code && q.membership_code.toLowerCase().includes(search.toLowerCase())) ||
        (q.document_id && q.document_id.includes(search))
    );

    // Contadores
    const totalNational = data.qualifiers.reduce((acc, q) => acc + (q.national_won > 0 ? q.national_won : 0), 0);
    const totalInternational = data.qualifiers.reduce((acc, q) => acc + (q.international_won > 0 ? q.international_won : 0), 0);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                    <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-blue-900 mb-2 flex items-center gap-3">
                    <span>✈️</span> Campaña de Viajes: Panel de Ganadores
                </h1>
                <p className="text-gray-600">
                    Administra y audita a los calificados para los viajes nacionales e internacionales (Sep 4 - Nov 3).
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-100 mb-1">Total Ganadores</h3>
                    <p className="text-4xl font-extrabold">{data.total_qualifiers}</p>
                    <span className="text-xs text-blue-100 block mt-2">Líderes con al menos 1 premio ganado</span>
                    <span className="absolute -right-4 -bottom-4 text-8xl opacity-10">👥</span>
                </div>

                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-100 mb-1">Tiquetes Nacionales</h3>
                    <p className="text-4xl font-extrabold">{totalNational} Viajes</p>
                    <span className="text-xs text-teal-100 block mt-2">Destino: San Andrés / Santa Marta</span>
                    <span className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏖️</span>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-100 mb-1">Tiquetes Internacionales</h3>
                    <p className="text-4xl font-extrabold">{totalInternational} Viajes</p>
                    <span className="text-xs text-pink-100 block mt-2">Destino: Punta Cana</span>
                    <span className="absolute -right-4 -bottom-4 text-8xl opacity-10">🌴</span>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:max-w-xs">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o documento..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8"
                    />
                    <span className="absolute left-2.5 top-3 text-gray-400">🔍</span>
                </div>
                <button
                    onClick={fetchQualifiers}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg transition"
                >
                    🔄 Recargar Datos
                </button>
            </div>

            {/* Winners Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Socio / Contacto</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4 text-center">Viajes Nacionales</th>
                                <th className="px-6 py-4 text-center">Viajes Internacionales</th>
                                <th className="px-6 py-4 text-right">Estructura</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredQualifiers.length > 0 ? (
                                filteredQualifiers.map((q) => (
                                    <tr key={q.user_id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{q.name}</div>
                                            <div className="text-xs text-gray-500">Código: {q.membership_code || 'N/A'}</div>
                                            <div className="text-xs text-gray-400">{q.email} | {q.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-600">{q.document_id || 'No reg.'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {q.national_won > 0 ? (
                                                <span className="bg-teal-100 text-teal-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                                    ⭐ {q.national_won} Tiquete(s)
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {q.international_won > 0 ? (
                                                <span className="bg-pink-100 text-pink-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                                    ⭐ {q.international_won} Tiquete(s)
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewStructure(q)}
                                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold py-1.5 px-3 rounded-lg text-xs transition"
                                            >
                                                🔍 Auditar Estructura
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No se encontraron ganadores que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Modal / Sidebar Drawer */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-end">
                    <div className="w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Auditoría de Estructura</h3>
                                <p className="text-sm text-gray-500">Socio: {selectedUser.name} ({selectedUser.membership_code})</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2"
                            >
                                ✕
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-500">Cargando árbol de comisiones...</p>
                            </div>
                        ) : userDetail ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                                        <span className="text-xs text-teal-700 font-bold uppercase">Ramas Nacionales</span>
                                        <span className="block text-2xl font-black text-teal-950 mt-1">{userDetail.national_legs}</span>
                                        <span className="text-[10px] text-teal-600 block mt-1">(Mínimo 3 frontales con 3+ indirectos)</span>
                                    </div>
                                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                                        <span className="text-xs text-pink-700 font-bold uppercase">Ramas Internacionales</span>
                                        <span className="block text-2xl font-black text-pink-955 mt-1">{userDetail.international_legs}</span>
                                        <span className="text-[10px] text-pink-600 block mt-1">(Mínimo 5 frontales con 5+ indirectos)</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3">Detalle por Rama Frontal (Líneas Unilevel)</h4>
                                    <div className="space-y-3">
                                        {userDetail.directs_details && userDetail.directs_details.length > 0 ? (
                                            userDetail.directs_details.map((direct, i) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-gray-900">{direct.name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${direct.active_in_period ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                            {direct.active_in_period ? 'Frontal Activo' : 'Frontal Inactivo'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">Cantidad de indirectos válidos:</span>
                                                        <span className="font-bold text-indigo-700">{direct.downline_count}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 text-sm">El usuario no tiene patrocinados directos calificados en esta ventana temporal.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Error al procesar el desglose.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
