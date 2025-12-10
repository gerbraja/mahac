import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WalletView = () => {
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const res = await axios.get(`http://localhost:8000/api/wallet/summary`, config);
                setWalletData(res.data);
            } catch (error) {
                console.error("Error fetching wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading wallet data...</div>;
    if (!walletData) return <div className="p-4 text-red-500">Failed to load wallet data.</div>;

    const earnings = walletData.earnings_by_source || {};

    // Datos simulados para gráficas de crecimiento (últimos 6 meses)
    const monthlyGrowth = {
        overview: [120, 280, 450, 680, 920, 1200],
        special: [50, 150, 250, 400, 600, 800],
        transactions: [80, 160, 300, 520, 780, 1100],
        bonuses: [40, 90, 180, 320, 450, 650]
    };

    const getGrowthPercentage = (data) => {
        if (!data || data.length < 2) return 0;
        const previous = data[data.length - 2];
        const current = data[data.length - 1];
        if (previous === 0) return 100;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    const renderMiniChart = (data, colorClass) => {
        const max = Math.max(...data);
        const normalized = data.map(val => (val / max) * 100);

        return (
            <div className="flex items-end gap-1 h-16 mt-3">
                {normalized.map((height, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 rounded-t transition-all ${colorClass}`}
                        style={{
                            height: `${height}%`,
                            minHeight: '4px',
                            opacity: 0.7 + (idx * 0.05)
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">💰 Mi Billetera</h1>

            {/* Section Navigation Cards with Charts - ARRIBA */}
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Resumen Card */}
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${activeTab === 'summary'
                            ? 'ring-4 ring-blue-400 shadow-blue-500/50'
                            : 'hover:shadow-blue-500/30'
                        }`}
                >
                    <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-8 text-white min-h-[240px] flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-6xl">📊</div>
                            <div className="text-right">
                                <div className="text-4xl font-bold tracking-tight">${walletData.total_earnings?.toFixed(0) || '0'}</div>
                                <div className="text-sm opacity-80 mt-1">Total</div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-3">Resumen General</h3>
                        <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="text-green-300 font-bold">↗ +{getGrowthPercentage(monthlyGrowth.overview)}%</span>
                            <span className="opacity-80">vs mes anterior</span>
                        </div>
                        <div className="mt-auto">
                            {renderMiniChart(monthlyGrowth.overview, 'bg-blue-300')}
                        </div>
                    </div>
                </button>

                {/* Bonos Especiales Card */}
                <button
                    onClick={() => setActiveTab('special')}
                    className={`flex-1 relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${activeTab === 'special'
                            ? 'ring-4 ring-green-400 shadow-green-500/50'
                            : 'hover:shadow-green-500/30'
                        }`}
                >
                    <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 p-8 text-white min-h-[240px] flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-6xl">🎁</div>
                            <div className="text-right">
                                <div className="text-4xl font-bold tracking-tight">
                                    {(walletData.special_bonuses?.product_purchase?.count || 0) +
                                        (walletData.special_bonuses?.car_purchase?.count || 0) +
                                        (walletData.special_bonuses?.apartment_purchase?.count || 0) +
                                        (walletData.special_bonuses?.travel?.count || 0)}
                                </div>
                                <div className="text-sm opacity-80 mt-1">Bonos</div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-3">Bonos Especiales</h3>
                        <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="text-green-300 font-bold">↗ +{getGrowthPercentage(monthlyGrowth.special)}%</span>
                            <span className="opacity-80">crecimiento</span>
                        </div>
                        <div className="mt-auto">
                            {renderMiniChart(monthlyGrowth.special, 'bg-green-300')}
                        </div>
                    </div>
                </button>

                {/* Transacciones Card */}
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex-1 relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${activeTab === 'transactions'
                            ? 'ring-4 ring-teal-400 shadow-teal-500/50'
                            : 'hover:shadow-teal-500/30'
                        }`}
                >
                    <div className="bg-gradient-to-br from-teal-700 via-cyan-800 to-cyan-900 p-8 text-white min-h-[240px] flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-6xl">📜</div>
                            <div className="text-right">
                                <div className="text-4xl font-bold tracking-tight">
                                    {(earnings.unilevel?.count || 0) +
                                        (earnings.matching_bonus?.count || 0) +
                                        (earnings.global_pool?.count || 0)}
                                </div>
                                <div className="text-sm opacity-80 mt-1">Total</div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-3">Transacciones</h3>
                        <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="text-green-300 font-bold">↗ +{getGrowthPercentage(monthlyGrowth.transactions)}%</span>
                            <span className="opacity-80">actividad</span>
                        </div>
                        <div className="mt-auto">
                            {renderMiniChart(monthlyGrowth.transactions, 'bg-teal-300')}
                        </div>
                    </div>
                </button>

                {/* Rangos Card */}
                <button
                    onClick={() => setActiveTab('bonuses')}
                    className={`flex-1 relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${activeTab === 'bonuses'
                            ? 'ring-4 ring-indigo-400 shadow-indigo-500/50'
                            : 'hover:shadow-indigo-500/30'
                        }`}
                >
                    <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 p-8 text-white min-h-[240px] flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-6xl">🏆</div>
                            <div className="text-right">
                                <div className="text-4xl font-bold tracking-tight">
                                    {(earnings.qualified_ranks?.count || 0) +
                                        (earnings.honor_ranks?.count || 0)}
                                </div>
                                <div className="text-sm opacity-80 mt-1">Logros</div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-3">Rangos y Logros</h3>
                        <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="text-green-300 font-bold">↗ +{getGrowthPercentage(monthlyGrowth.bonuses)}%</span>
                            <span className="opacity-80">progreso</span>
                        </div>
                        <div className="mt-auto">
                            {renderMiniChart(monthlyGrowth.bonuses, 'bg-indigo-300')}
                        </div>
                    </div>
                </button>
            </div>

            {/* Balance Cards - ABAJO de los cuadros de navegación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90 uppercase">Saldo Disponible</h3>
                    <p className="text-4xl font-bold mt-2">${walletData.available_balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs mt-2 opacity-75">Disponible para retiro</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90 uppercase">Saldo Congelado</h3>
                    <p className="text-4xl font-bold mt-2">${walletData.frozen_crypto_balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs mt-2 opacity-75">Bloqueado temporalmente</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90 uppercase">Ganancias Totales</h3>
                    <p className="text-4xl font-bold mt-2">${walletData.total_earnings?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs mt-2 opacity-75">De todos los planes</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="text-sm font-medium opacity-90 uppercase">Cripto Balance</h3>
                    <p className="text-4xl font-bold mt-2">${walletData.crypto_balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs mt-2 opacity-75">Saldo en criptomonedas</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Ganancias por Fuente</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Binary Global */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-lg border-l-4 border-red-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">🔴 Binario Global</h4>
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                        {earnings.binary_global?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.binary_global?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Plan 2x2 Global</p>
                            </div>

                            {/* Binary Millionaire */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-lg border-l-4 border-orange-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">💎 Binario Millonario</h4>
                                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                        {earnings.binary_millionaire?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.binary_millionaire?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">27 niveles 2x2</p>
                            </div>

                            {/* Unilevel */}
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-lg border-l-4 border-indigo-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">🌳 Unilevel</h4>
                                    <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">
                                        {earnings.unilevel?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.unilevel?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">7 niveles (27%)</p>
                            </div>

                            {/* Matching Bonus */}
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-lg border-l-4 border-pink-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">🎁 Matching Bonus</h4>
                                    <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full">
                                        {earnings.matching_bonus?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.matching_bonus?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">50% de directos</p>
                            </div>

                            {/* Forced Matrix */}
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-lg border-l-4 border-teal-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">⚡ Matrices Forzadas</h4>
                                    <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full">
                                        {earnings.forced_matrix?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.forced_matrix?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">9 matrices (3x7)</p>
                            </div>

                            {/* Qualified Ranks */}
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">🏆 Bonos de Calificación</h4>
                                    <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                                        {earnings.qualified_ranks?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.qualified_ranks?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Matrices cerradas</p>
                            </div>

                            {/* Honor Ranks */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">👑 Rangos de Honor</h4>
                                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                                        {earnings.honor_ranks?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">Ver detalles</p>
                                <p className="text-xs text-gray-600 mt-1">Reconocimientos</p>
                            </div>

                            {/* Global Pool */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">🌍 Pool Global</h4>
                                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                        {earnings.global_pool?.count || 0}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${earnings.global_pool?.total?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">7% distribuido</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'special' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">🎁 Bonos Especiales</h2>

                        {/* Bono para Compra de Productos */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">🛒 Bono para Compra de Productos</h3>
                                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {walletData.special_bonuses?.product_purchase?.count || 0} bonos
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-green-600 mb-2">
                                ${walletData.special_bonuses?.product_purchase?.total_value?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">Disponible para comprar productos en la tienda</p>

                            {walletData.special_bonuses?.product_purchase?.bonuses?.map((bonus, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg mt-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">${bonus.value.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">{bonus.awarded_for}</p>
                                            <p className="text-xs text-gray-500">{new Date(bonus.awarded_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bonus.status === 'active' ? 'bg-green-100 text-green-800' :
                                                bonus.status === 'used' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {bonus.status === 'active' ? 'Activo' : bonus.status === 'used' ? 'Usado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {!walletData.special_bonuses?.product_purchase?.bonuses?.length && (
                                <p className="text-center text-gray-500 py-4">No has ganado bonos de productos aún</p>
                            )}
                        </div>

                        {/* Bono Compra de Auto */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-l-4 border-red-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">🚗 Bono Compra de Auto</h3>
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {walletData.special_bonuses?.car_purchase?.count || 0} bonos
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-red-600 mb-2">
                                ${walletData.special_bonuses?.car_purchase?.total_value?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">Disponible para la compra de un vehículo</p>

                            {walletData.special_bonuses?.car_purchase?.bonuses?.map((bonus, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg mt-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-lg">🚗 ${bonus.value.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">{bonus.description}</p>
                                            <p className="text-sm font-medium text-red-600 mt-1">{bonus.awarded_for}</p>
                                            <p className="text-xs text-gray-500">{new Date(bonus.awarded_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bonus.status === 'active' ? 'bg-green-100 text-green-800' :
                                                bonus.status === 'used' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {bonus.status === 'active' ? 'Disponible' : bonus.status === 'used' ? 'Usado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {!walletData.special_bonuses?.car_purchase?.bonuses?.length && (
                                <p className="text-center text-gray-500 py-4">No has ganado bonos de auto aún. ¡Sigue avanzando!</p>
                            )}
                        </div>

                        {/* Bono Compra de Apartamento */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">🏠 Bono Compra de Apartamento</h3>
                                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {walletData.special_bonuses?.apartment_purchase?.count || 0} bonos
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-blue-600 mb-2">
                                ${walletData.special_bonuses?.apartment_purchase?.total_value?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">Disponible para la compra de propiedad</p>

                            {walletData.special_bonuses?.apartment_purchase?.bonuses?.map((bonus, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg mt-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-lg">🏠 ${bonus.value.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">{bonus.description}</p>
                                            <p className="text-sm font-medium text-blue-600 mt-1">{bonus.awarded_for}</p>
                                            <p className="text-xs text-gray-500">{new Date(bonus.awarded_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bonus.status === 'active' ? 'bg-green-100 text-green-800' :
                                                bonus.status === 'used' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {bonus.status === 'active' ? 'Disponible' : bonus.status === 'used' ? 'Usado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {!walletData.special_bonuses?.apartment_purchase?.bonuses?.length && (
                                <p className="text-center text-gray-500 py-4">No has ganado bonos de apartamento aún. ¡Alcanza el siguiente rango!</p>
                            )}
                        </div>

                        {/* Bono de Viajes */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-l-4 border-purple-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">✈️ Bono de Viajes</h3>
                                <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {walletData.special_bonuses?.travel?.count || 0} bonos
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-purple-600">{walletData.special_bonuses?.travel?.total_trips || 0}</p>
                                    <p className="text-xs text-gray-600 mt-1">Total Viajes</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-green-600">{walletData.special_bonuses?.travel?.trips_available || 0}</p>
                                    <p className="text-xs text-gray-600 mt-1">Disponibles</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-gray-600">{walletData.special_bonuses?.travel?.trips_used || 0}</p>
                                    <p className="text-xs text-gray-600 mt-1">Usados</p>
                                </div>
                            </div>

                            {walletData.special_bonuses?.travel?.bonuses?.map((bonus, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg mt-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">✈️</span>
                                                <p className="font-semibold text-lg">
                                                    {bonus.trips_count} {bonus.trips_count === 1 ? 'Viaje' : 'Viajes'}
                                                </p>
                                            </div>
                                            {bonus.destination_category && (
                                                <p className="text-sm text-purple-600 font-medium mb-1">📍 {bonus.destination_category}</p>
                                            )}
                                            {bonus.estimated_value_per_trip && (
                                                <p className="text-sm text-gray-600">Valor estimado: ${bonus.estimated_value_per_trip.toFixed(2)} por viaje</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">Otorgado: {new Date(bonus.awarded_at).toLocaleDateString()}</p>
                                            {bonus.expires_at && (
                                                <p className="text-xs text-red-600 mt-1">Expira: {new Date(bonus.expires_at).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">
                                                {bonus.trips_remaining} disponibles
                                            </p>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bonus.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    bonus.status === 'used' ? 'bg-gray-100 text-gray-800' :
                                                        bonus.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {bonus.status === 'active' ? 'Activo' :
                                                    bonus.status === 'used' ? 'Completo' :
                                                        bonus.status === 'expired' ? 'Expirado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!walletData.special_bonuses?.travel?.bonuses?.length && (
                                <p className="text-center text-gray-500 py-4">No has ganado bonos de viajes aún. ¡Alcanza rangos más altos!</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Historial de Transacciones</h2>

                        {/* Mostrar transacciones de todas las fuentes */}
                        <div className="space-y-3">
                            {(earnings.binary_global?.transactions?.length > 0 ||
                                earnings.binary_millionaire?.transactions?.length > 0 ||
                                earnings.unilevel?.transactions?.length > 0 ||
                                earnings.matching_bonus?.transactions?.length > 0 ||
                                earnings.forced_matrix?.transactions?.length > 0) ? (
                                <>
                                    {/* Binary Global */}
                                    {earnings.binary_global?.transactions?.map((tx, idx) => (
                                        <div key={`bg-${idx}`} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">🔴 Binario Global - {tx.type}</p>
                                                <p className="text-sm text-gray-600">Nivel {tx.level} • {new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}

                                    {/* Binary Millionaire */}
                                    {earnings.binary_millionaire?.transactions?.map((tx, idx) => (
                                        <div key={`bm-${idx}`} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">💎 Binario Millonario</p>
                                                <p className="text-sm text-gray-600">Nivel {tx.level} • {new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}

                                    {/* Unilevel */}
                                    {earnings.unilevel?.transactions?.map((tx, idx) => (
                                        <div key={`un-${idx}`} className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">🌳 Unilevel</p>
                                                <p className="text-sm text-gray-600">Nivel {tx.level} • Venta: ${tx.sale_amount} • {new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}

                                    {/* Matching Bonus */}
                                    {earnings.matching_bonus?.transactions?.map((tx, idx) => (
                                        <div key={`mb-${idx}`} className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">🎁 Matching Bonus</p>
                                                <p className="text-sm text-gray-600">50% de directos • Venta: ${tx.sale_amount} • {new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}

                                    {/* Forced Matrix */}
                                    {earnings.forced_matrix?.transactions?.map((tx, idx) => (
                                        <div key={`fm-${idx}`} className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">⚡ Matriz {tx.matrix_level}</p>
                                                <p className="text-sm text-gray-600">{tx.reward_type} • {new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg">📭 No hay transacciones aún</p>
                                    <p className="text-sm mt-2">Tus comisiones aparecerán aquí</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'bonuses' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Bonos de Calificación (Matrices Cerradas)</h2>
                            {earnings.qualified_ranks?.bonuses?.length > 0 ? (
                                <div className="space-y-3">
                                    {earnings.qualified_ranks.bonuses.map((bonus, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">{bonus.rank}</p>
                                                <p className="text-sm text-gray-600">{new Date(bonus.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">${bonus.reward?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No has alcanzado rangos de calificación aún</p>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">👑 Rangos de Honor</h2>
                            {earnings.honor_ranks?.bonuses?.length > 0 ? (
                                <div className="space-y-3">
                                    {earnings.honor_ranks.bonuses.map((bonus, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">{bonus.rank}</p>
                                                <p className="text-sm text-gray-600">{bonus.reward}</p>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(bonus.date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-2xl">👑</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No has alcanzado rangos de honor aún</p>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">🌍 Pool Global</h2>
                            {earnings.global_pool?.transactions?.length > 0 ? (
                                <div className="space-y-3">
                                    {earnings.global_pool.transactions.map((tx, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                            <div>
                                                <p className="font-semibold text-gray-800">{tx.rank}</p>
                                                <p className="text-sm text-gray-600">Período: {tx.period}</p>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">${tx.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No has recibido comisiones del pool global aún</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletView;
