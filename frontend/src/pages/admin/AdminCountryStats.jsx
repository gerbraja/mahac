import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminCountryStats() {
    const [loading, setLoading] = useState(true);
    const { globalCountry } = useAdmin();
    const [statsData, setStatsData] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Pass globalCountry as query param if needed
                const params = globalCountry && globalCountry !== 'Todos' ? { country: globalCountry } : {};

                // Fetch all data in parallel
                const [statsRes, rankingRes, splitRes] = await Promise.all([
                    api.get('/admin/reports/country-stats', { params }).catch(() => ({ data: { metrics: {} } })),
                    api.get('/admin/reports/country-ranking', { params }).catch(() => ({ data: [] })),
                    api.get('/admin/reports/income-local-vs-intl', { params }).catch(() => ({ data: [] }))
                ]);

                const m = statsRes.data.metrics || {};

                setStatsData({
                    metrics: {
                        totalUsers: m.totalUsers || 0,
                        totalRevenue: m.totalRevenue || 0,
                        unpaidCommissions: m.unpaidCommissions || 0,
                        paidCommissions: m.paidCommissions || 0,
                        totalCompanies: m.totalCompanies || 0,
                        totalProducts: m.totalProducts || 0
                    },
                    countryRanking: rankingRes.data || [],
                    revenueSplit: splitRes.data || []
                });
            } catch (error) {
                console.error("Error fetching country stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [globalCountry]);

    if (loading || !statsData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { metrics, countryRanking, revenueSplit } = statsData;

    const formatCOP = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🗺️ Estadísticas: <span className="text-blue-700">{globalCountry === 'Todos' ? 'Global' : globalCountry}</span></h1>
                    <p className="text-gray-500 text-sm">Métricas demográficas y financieras internacionales</p>
                </div>
            </div>

            {/* Tarjetas de Métricas (Fila de 6) */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <MiniCard title="Usuarios Totales" value={metrics.totalUsers} icon="👥" color="text-blue-600" />
                <MiniCard title="Empresas (Prov.)" value={metrics.totalCompanies} icon="🏭" color="text-indigo-600" />
                <MiniCard title="Productos Activos" value={metrics.totalProducts} icon="📦" color="text-green-600" />
                <MiniCard title="Ingresos Brutos" value={formatCOP(metrics.totalRevenue)} icon="💰" color="text-emerald-600" />
                <MiniCard title="Comisiones Pagadas" value={formatCOP(metrics.paidCommissions)} icon="✅" color="text-purple-600" />
                <MiniCard title="Comis. Por Cobrar" value={formatCOP(metrics.unpaidCommissions)} icon="⏳" color="text-red-500" />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

                {/* Gráfico de Barras: Ranking por Afiliados e Ingresos */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Ranking Top 5 Países (Afiliados vs Ingresos)</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countryRanking} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(val) => `$${val / 1000000}M`} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="afiliados" name="Nº Afiliados" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="ingresos" name="Ingresos (COP)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pastel: Ingresos Nacionales vs Internacionales */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-1">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Ingresos: Local vs Internacional</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueSplit}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {revenueSplit.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente para tarjetas más compactas 
function MiniCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{title}</p>
                <span className={`text-xl ${color}`}>{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 truncate">{value}</h3>
        </div>
    );
}
