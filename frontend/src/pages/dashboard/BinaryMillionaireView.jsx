import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const BinaryMillionaireView = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTreeData = async () => {
            try {
                const response = await api.get('/api/binary-millionaire/tree');
                setTreeData(response.data);
            } catch (error) {
                console.error("Error fetching binary millionaire tree:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTreeData();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
                    💎 Red Binaria Millonaria
                </h1>
                <p className="text-gray-600">Visualiza tu estructura en el plan Binario Millonario</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100 shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-pink-100 p-3 rounded-lg">
                            <span className="text-2xl">👥</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total en Red</p>
                            <p className="text-3xl font-bold text-pink-600">{treeData?.total_members || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100 shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <span className="text-2xl">⬅️</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Pierna Izquierda</p>
                            <p className="text-3xl font-bold text-purple-600">{treeData?.left_count || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <span className="text-2xl">➡️</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Pierna Derecha</p>
                            <p className="text-3xl font-bold text-blue-600">{treeData?.right_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tree Visualization */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">🌳 Árbol Binario</h2>

                {treeData ? (
                    <div className="flex flex-col items-center space-y-8">
                        {/* Root Node (You) */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl p-6 shadow-xl min-w-[200px] text-center">
                                <div className="text-3xl mb-2">👤</div>
                                <p className="font-bold text-lg">Tú</p>
                                <p className="text-sm opacity-90">{treeData.username || 'Usuario'}</p>
                            </div>
                        </div>

                        {/* Level 1 */}
                        <div className="flex gap-12">
                            {/* Left Child */}
                            <div className="flex flex-col items-center">
                                {treeData.left ? (
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg min-w-[160px] text-center">
                                        <div className="text-2xl mb-1">👤</div>
                                        <p className="font-semibold">{treeData.left.name || 'Miembro'}</p>
                                        <p className="text-xs opacity-80">{treeData.left.username}</p>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 min-w-[160px] text-center bg-gray-50">
                                        <div className="text-2xl mb-1 opacity-30">👤</div>
                                        <p className="text-gray-400 text-sm">Posición Vacía</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Child */}
                            <div className="flex flex-col items-center">
                                {treeData.right ? (
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg min-w-[160px] text-center">
                                        <div className="text-2xl mb-1">👤</div>
                                        <p className="font-semibold">{treeData.right.name || 'Miembro'}</p>
                                        <p className="text-xs opacity-80">{treeData.right.username}</p>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 min-w-[160px] text-center bg-gray-50">
                                        <div className="text-2xl mb-1 opacity-30">👤</div>
                                        <p className="text-gray-400 text-sm">Posición Vacía</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No hay datos disponibles para mostrar</p>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">ℹ️</span>
                    Sobre el Plan Binario Millonario
                </h3>
                <p className="text-gray-700 leading-relaxed">
                    El Plan Binario Millonario te permite construir dos piernas (izquierda y derecha) y ganar comisiones
                    basadas en el volumen de ventas de tu pierna más débil. Mantén ambas piernas balanceadas para
                    maximizar tus ganancias.
                </p>
            </div>
        </div>
    );
};

export default BinaryMillionaireView;
