import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/api';

export default function AdminReports() {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    // Colores para gráficos de pastel
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Función para obtener datos verdaderos en la FASE 2
    // En FASE 1 usaremos mockups para armar el Layout
    useEffect(() => {
        // Simulando una llamada al backend que implementaremos luego
        setTimeout(() => {
            setReportData({
                metrics: {
                    totalSales: 45000000,
                    totalCommissions: 12500000,
                    netProfit: 32500000,
                    newUsersThisMonth: 124,
                    activePackages: 380,
                    pendingOrders: 15
                },
                monthlySales: [
                    { name: 'Ene', ventas: 4000000, comisiones: 1200000 },
                    { name: 'Feb', ventas: 6500000, comisiones: 1800000 },
                    { name: 'Mar', ventas: 2000000, comisiones: 500000 },
                ],
                packageDistribution: [
                    { name: 'Gratuito', value: 400 },
                    { name: 'Franquicia 1', value: 250 },
                    { name: 'Franquicia 2', value: 100 },
                    { name: 'Franquicia 3', value: 30 }
                ],
                topProducts: [
                    { name: 'Zapatos Deportivos', ventas: 120 },
                    { name: 'Camisa Polo', ventas: 85 },
                    { name: 'Pantalón Jean', ventas: 60 }
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading || !reportData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { metrics, monthlySales, packageDistribution, topProducts } = reportData;

    // Formatear pesos colombianos
    const formatCOP = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">📊 Reportes y Analíticas (Fase 1)</h1>
                <div className="flex space-x-2">
                    <select className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Últimos 30 días</option>
                        <option>Este Mes</option>
                        <option>Mes Anterior</option>
                        <option>Este Año</option>
                    </select>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                        Descargar Excel
                    </button>
                </div>
            </div>

            {/* Tarjetas de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Ventas Totales Brutas"
                    value={formatCOP(metrics.totalSales)}
                    subtitle="+15% este mes"
                    icon="💰"
                    color="bg-green-100 text-green-800"
                />
                <MetricCard
                    title="Comisiones Repartidas"
                    value={formatCOP(metrics.totalCommissions)}
                    subtitle="Payout rátio: 27%"
                    icon="💸"
                    color="bg-red-100 text-red-800"
                />
                <MetricCard
                    title="Flujo Neto (Profit)"
                    value={formatCOP(metrics.netProfit)}
                    subtitle="Ganancia operativa"
                    icon="🏦"
                    color="bg-blue-100 text-blue-800"
                />
                <MetricCard
                    title="Nuevos Registros"
                    value={metrics.newUsersThisMonth}
                    subtitle="Afiliados inscritos este mes"
                    icon="👥"
                    color="bg-purple-100 text-purple-800"
                />
                <MetricCard
                    title="Paquetes Activos"
                    value={metrics.activePackages}
                    subtitle="Usuarios pagados en el sistema"
                    icon="📦"
                    color="bg-yellow-100 text-yellow-800"
                />
                <MetricCard
                    title="Órdenes de Fábrica Pendientes"
                    value={metrics.pendingOrders}
                    subtitle="Requieren atención"
                    icon="🛒"
                    color="bg-orange-100 text-orange-800"
                />
            </div>

            {/* Gráficos Centrales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

                {/* Gráfico de Barras: Ventas vs Comisiones */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Ingresos vs Comisiones (Mensual)</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(val) => `$${val / 1000000}M`} />
                                <Tooltip formatter={(value) => formatCOP(value)} />
                                <Legend />
                                <Bar dataKey="ventas" name="Ventas Brutas" fill="#0088FE" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="comisiones" name="Comisiones Pagadas" fill="#FF8042" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pastel: Distribución de Paquetes */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Distribución de Paquetes Activos</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={packageDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {packageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Gráficos Inferiores */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Top Productos Dispuestos en Lista/Barra horizontal */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-1">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Top Productos Vendidos</h2>
                    <div className="space-y-4">
                        {topProducts.map((prod, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl font-bold text-gray-400">#{idx + 1}</span>
                                    <span className="font-medium text-gray-700">{prod.name}</span>
                                </div>
                                <span className="font-bold text-blue-600">{prod.ventas} ud.</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Próximo gráfico de crecimiento de red */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-2 flex items-center justify-center flex-col text-center">
                    <h2 className="text-lg font-bold text-gray-700 mb-2">Crecimiento de Red Unilevel y Binaria</h2>
                    <p className="text-gray-500 mb-4">El gráfico de líneas poblacional se implementará en la FASE 2.</p>
                    <div className="w-full h-48 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-3xl">📈 Espacio Reservado Fase 2</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

// Componente auxiliar para tarjetitas de métricas
function MetricCard({ title, value, subtitle, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex items-center">
            <div className={`p-4 rounded-full mr-5 ${color} text-2xl`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {subtitle && <p className="text-xs text-green-600 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
