import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const UnilevelView = () => {
    const [unilevelData, setUnilevelData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        fetchUnilevelData();
    }, []);

    const fetchUnilevelData = async () => {
        setLoading(true);
        try {
            const [statusRes, statsRes] = await Promise.all([
                api.get(`/api/unilevel/status/${userId}`),
                api.get(`/api/unilevel/stats/${userId}`)
            ]);

            console.log('Unilevel Status:', statusRes.data);
            console.log('Unilevel Stats:', statsRes.data);

            setUnilevelData(statusRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching unilevel data:', error);
            setUnilevelData({ status: 'not_registered' });
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-xl text-gray-500">
                Cargando datos de Red Unilevel...
            </div>
        );
    }

    const isRegistered = unilevelData?.status === 'active';

    // Porcentajes por nivel
    const LEVEL_PERCENTAGES = {
        1: 1,
        2: 2,
        3: 2,
        4: 4,
        5: 5,
        6: 6,
        7: 7
    };

    // Calcular totales
    const totalEarnings = stats?.total_earnings || 0;
    const quickStartBonus = stats?.quick_start_bonus || 0;
    const monthlyEarnings = stats?.monthly_earnings || 0;
    const totalDownline = stats?.total_downline || 0;
    const activeDownline = stats?.active_downline || 0;

    // Total combinado (Unilevel + Quick Start Bonus)
    const totalCombinedEarnings = totalEarnings + quickStartBonus;

    // Helper para formatear moneda (USD + COP)
    const formatCurrency = (usdValue) => {
        const value = usdValue || 0;
        const copValue = value * 4500; // Tasa fija de conversión

        const usdString = '$' + value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const copString = '$' + copValue.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return (
            <div className="flex flex-col items-center">
                <span>{usdString} USD</span>
                <span className="text-[0.6em] opacity-80 mt-0.5">
                    (≈ {copString} COP)
                </span>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    🌳 Red Unilevel
                </h1>
                <p className="text-gray-500 text-lg">
                    Sistema de comisiones en 7 niveles - Total acumulado: 27%
                </p>
            </div>

            {/* Status Card */}
            <div className={`p-6 md:p-8 rounded-2xl mb-8 shadow-lg text-center text-white ${isRegistered
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                <div className="text-5xl mb-4">
                    {isRegistered ? '✅' : '❌'}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {isRegistered ? 'Red Activa' : 'No Registrado'}
                </h2>
                <p className="text-lg opacity-90">
                    {isRegistered
                        ? 'Estás activo en la red Unilevel y recibiendo comisiones'
                        : 'Regístrate para comenzar a ganar comisiones de tu red'}
                </p>
            </div>

            {isRegistered && (
                <>
                    {/* Stats Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Total Earnings */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-emerald-500">
                            <div className="text-4xl mb-2">💰</div>
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                                Ganancias Totales
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalCombinedEarnings)}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                Incluye Quick Start + Unilevel
                            </div>
                        </div>

                        {/* Monthly Earnings */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-blue-500">
                            <div className="text-4xl mb-2">📅</div>
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                                Ganancias del Mes
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(monthlyEarnings)}
                            </div>
                        </div>

                        {/* Total Downline */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-purple-500">
                            <div className="text-4xl mb-2">👥</div>
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                                Total Red
                            </div>
                            <div className="text-2xl font-bold text-purple-600">
                                {totalDownline}
                            </div>
                        </div>

                        {/* Active Downline */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-amber-500">
                            <div className="text-4xl mb-2">⚡</div>
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                                Red Activa
                            </div>
                            <div className="text-2xl font-bold text-amber-500">
                                {activeDownline}
                            </div>
                        </div>

                        {/* Matching Bonus Earned */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-teal-500 md:col-span-2 lg:col-span-1">
                            <div className="text-4xl mb-2">🎁</div>
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                                Bono de Igualación
                            </div>
                            <div className="text-2xl font-bold text-teal-600">
                                {formatCurrency(stats?.matching_bonus)}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                50% de comisiones de directos
                            </div>
                        </div>
                    </div>

                    {/* Matching Bonus Explanation */}
                    <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white p-4 rounded-xl mb-6 shadow-md overflow-hidden">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            🎁 Bono de Igualación (Matching Bonus)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    ¿Qué es?
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Es un <strong>bono adicional del 50%</strong> de todas las comisiones que generan tus patrocinados directos (Nivel 1).
                                    Esto te recompensa por construir y apoyar a líderes fuertes en tu equipo.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    ¿Cómo funciona?
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Cuando un patrocinado directo tuyo gana comisiones Unilevel de su red,
                                    tú recibes el <strong>50% de esas comisiones como bono adicional</strong>.
                                    Es decir, ganas dos veces: tu comisión normal + el matching bonus.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    Ejemplo Práctico
                                </h4>
                                <div className="bg-white/20 p-4 rounded-lg text-sm">
                                    <p className="mb-2">
                                        • Tu directo Pedro gana <strong>$100</strong> en comisiones Unilevel
                                    </p>
                                    <p className="mb-2">
                                        • Tú recibes <strong>$50</strong> de matching bonus (50% de $100)
                                    </p>
                                    <p className="font-bold text-base mt-2">
                                        💰 Total extra: $50 por cada directo exitoso
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Levels Breakdown */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8">
                        <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                            📊 Comisiones por Nivel
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                    <tr>
                                        <th className="p-3 text-left border-b-2 border-indigo-400">Nivel</th>
                                        <th className="p-3 text-center border-b-2 border-indigo-400">%</th>
                                        <th className="p-3 text-center border-b-2 border-indigo-400">Activos</th>
                                        <th className="p-3 text-center border-b-2 border-indigo-400">Ganancias</th>
                                        {/* Removed Volume Column */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7].map((level, index) => {
                                        const levelStats = stats?.levels?.[level] || {};
                                        // const totalMembers = levelStats.total_members || 0; // Unused
                                        const activeMembers = levelStats.active_members || 0;
                                        const earnings = levelStats.total_earnings || 0;
                                        // const volume = levelStats.total_volume || 0; // Unused
                                        const percentage = LEVEL_PERCENTAGES[level];

                                        return (
                                            <tr key={level} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-amber-50' : 'bg-emerald-50'
                                                }`}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: `linear-gradient(135deg, ${getColorForLevel(level)})` }}>
                                                            {level}
                                                        </div>
                                                        <div className="font-bold text-sm text-gray-700">
                                                            Nvl {level}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="inline-block px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-bold">
                                                        {percentage}%
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${activeMembers > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {activeMembers}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center font-bold text-sm text-emerald-600">
                                                    {formatCurrency(earnings)}
                                                </td>
                                                {/* Removed Volume Column Data */}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold text-base">
                                        <td colSpan="3" className="p-3 text-right">
                                            💰 TOTAL:
                                        </td>
                                        <td className="p-3 text-center text-lg">
                                            {formatCurrency(totalCombinedEarnings)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl mb-8 shadow-md">
                        <h3 className="text-xl font-bold mb-4">
                            📚 ¿Cómo funciona la Red Unilevel?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    🎯 7 Niveles de Profundidad
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Ganas comisiones de hasta 7 niveles de profundidad en tu red. Cada nivel tiene su propio porcentaje de comisión.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    💎 Total 27% Distribuido
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    El sistema distribuye un total de 27% en comisiones: 1% + 2% + 2% + 4% + 5% + 6% + 7%
                                </p>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2">
                                    ⚡ Comisiones Automáticas
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Cada vez que alguien en tu red hace una compra, automáticamente recibes tu comisión según el nivel.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Genealogy Tree Preview */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                        <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                            🌳 Vista Rápida de tu Red
                        </h3>

                        <div className="text-center p-4">
                            {/* You */}
                            <div className="inline-block px-6 py-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl font-bold text-lg mb-8 shadow-emerald-500/30 shadow-lg">
                                👤 TÚ
                            </div>

                            {/* Level 1 */}
                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-3 font-semibold">
                                    Nivel 1 - {stats?.levels?.[1]?.total_members || 0} personas ({LEVEL_PERCENTAGES[1]}%)
                                </div>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    {renderLevelNodes(stats?.levels?.[1]?.total_members || 0, 1, 5)}
                                </div>
                            </div>

                            {/* Level 2 */}
                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-3 font-semibold">
                                    Nivel 2 - {stats?.levels?.[2]?.total_members || 0} personas ({LEVEL_PERCENTAGES[2]}%)
                                </div>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    {renderLevelNodes(stats?.levels?.[2]?.total_members || 0, 2, 10)}
                                </div>
                            </div>

                            {/* Remaining levels indicator */}
                            {totalDownline > 15 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-gray-500 font-semibold text-sm">
                                    ... y {totalDownline - 15} personas más en niveles 3-7
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Helper function to get color gradient for each level
const getColorForLevel = (level) => {
    const colors = {
        1: '#10b981 0%, #059669 100%',
        2: '#3b82f6 0%, #2563eb 100%',
        3: '#8b5cf6 0%, #7c3aed 100%',
        4: '#f59e0b 0%, #d97706 100%',
        5: '#ef4444 0%, #dc2626 100%',
        6: '#ec4899 0%, #db2777 100%',
        7: '#6366f1 0%, #4f46e5 100%'
    };
    return colors[level] || '#6b7280 0%, #4b5563 100%';
};

// Helper function to render level nodes
const renderLevelNodes = (count, level, maxShow) => {
    const nodesToShow = Math.min(count, maxShow);
    const nodes = [];

    for (let i = 0; i < nodesToShow; i++) {
        nodes.push(
            <div key={i} style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getColorForLevel(level)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                👤
            </div>
        );
    }

    if (count > maxShow) {
        nodes.push(
            <div key="more" style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 'bold'
            }}>
                +{count - maxShow}
            </div>
        );
    }

    return nodes;
};

export default UnilevelView;
