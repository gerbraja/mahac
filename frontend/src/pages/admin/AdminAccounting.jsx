import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminAccounting() {
    const { globalCountry } = useAdmin();
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState(null);
    const [expensesList, setExpensesList] = useState([]);
    const [period, setPeriod] = useState('30d');

    // Form state for new expense
    const [formData, setFormData] = useState({
        concept: '',
        amount: '',
        category: 'other',
        notes: '',
        country: 'Todos'
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const EXPENSES_COLORS = ['#EF4444', '#F59E07', '#3B82F6', '#8B5CF6']; // Red (Comisiones), Amber (COGS), Blue (Fletes), Purple (Manuales)
    const ASSETS_COLORS = ['#10B981', '#6366F1', '#EC4899'];   // Emerald (Disponible), Indigo (Inventario), Pink (CxC)

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const params = { period };
            if (globalCountry && globalCountry !== 'Todos') {
                params.country = globalCountry;
            }

            // Fetch reports and expenses in parallel
            const [accResponse, expResponse] = await Promise.all([
                api.get('/api/admin/reports/accounting', { params }),
                api.get('/api/admin/expenses', { params })
            ]);

            setFinancialData(accResponse.data);
            setExpensesList(expResponse.data || []);
        } catch (error) {
            console.error("Error fetching accounting data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [period, globalCountry]);

    // Format COP Currency
    const formatCOP = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle expense submission
    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        if (!formData.concept || !formData.amount || Number(formData.amount) <= 0) {
            setMessage('Error: Ingresa un concepto y un monto válido.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                concept: formData.concept,
                amount: Number(formData.amount),
                category: formData.category,
                notes: formData.notes,
                country: formData.country === 'Todos' ? null : formData.country
            };

            await api.post('/api/admin/expenses', payload);
            setMessage('Gasto registrado exitosamente');
            setFormData({ concept: '', amount: '', category: 'other', notes: '', country: 'Todos' });
            
            // Reload financial data and list
            await fetchAllData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving operating expense", error);
            setMessage('Error al guardar el gasto operativo');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete expense
    const handleDeleteExpense = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este gasto operativo?")) {
            try {
                await api.delete(`/api/admin/expenses/${id}`);
                await fetchAllData();
            } catch (error) {
                console.error("Error deleting expense", error);
                alert("Error al eliminar el gasto operativo");
            }
        }
    };

    // Export to Excel (CSV)
    const handleExportCSV = () => {
        if (!financialData) return;

        const { pnl, balance, period_info } = financialData;
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        
        // Headers & Metadata
        csvContent += `REPORTE FINANCIERO Y CONTABLE\n`;
        csvContent += `Pais,${period_info.country}\n`;
        csvContent += `Periodo,${period_info.start_date} al ${period_info.end_date}\n\n`;
        
        // P&L Section
        csvContent += `ESTADO DE RESULTADOS (P&L)\n`;
        csvContent += `Rubro,Monto (COP)\n`;
        csvContent += `Ingresos - Ventas de Catalogo,${pnl.ingresos.ventas_catalogo}\n`;
        csvContent += `Ingresos - Membresias y Activaciones,${pnl.ingresos.ventas_activacion}\n`;
        csvContent += `INGRESOS TOTALES,${pnl.ingresos.total}\n`;
        csvContent += `Egresos - Costo de Mercancia (COGS),${pnl.egresos.cogs}\n`;
        csvContent += `Egresos - Comisiones de Red,${pnl.egresos.comisiones_red}\n`;
        csvContent += `Egresos - Fletes de Envio,${pnl.egresos.fletes}\n`;
        csvContent += `Egresos - Gastos Operativos Manuales,${pnl.egresos.gastos_manuales}\n`;
        csvContent += `EGRESOS TOTALES,${pnl.egresos.total}\n`;
        csvContent += `UTILIDAD OPERATIVA NETA,${pnl.utilidad_neta}\n\n`;

        // Balance Sheet Section
        csvContent += `BALANCE GENERAL\n`;
        csvContent += `Rubro,Monto (COP)\n`;
        csvContent += `Activo - Caja y Bancos,${balance.activos.disponible_bancos}\n`;
        csvContent += `Activo - Inventario Valorado,${balance.activos.inventario}\n`;
        csvContent += `Activo - Cuentas por Cobrar,${balance.activos.cuentas_cobrar}\n`;
        csvContent += `TOTAL ACTIVOS,${balance.activos.total}\n`;
        csvContent += `Pasivo - Saldos Billeteras,${balance.pasivos.billeteras_afiliados}\n`;
        csvContent += `Pasivo - Retiros Pendientes,${balance.pasivos.retiros_pendientes}\n`;
        csvContent += `Pasivo - IVA Acumulado Estimado,${balance.pasivos.iva_acumulado}\n`;
        csvContent += `Pasivo - Retenciones por Pagar,${balance.pasivos.retenciones_retefuente}\n`;
        csvContent += `TOTAL PASIVOS,${balance.pasivos.total}\n`;
        csvContent += `Patrimonio - Capital y Utilidades,${balance.patrimonio.total}\n`;
        csvContent += `TOTAL PASIVO Y PATRIMONIO,${balance.pasivos.total + balance.patrimonio.total}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_contable_${period_info.country}_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print PDF
    const handlePrintPDF = () => {
        window.print();
    };

    if (loading || !financialData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const { pnl, balance, period_info } = financialData;

    // Charts Data
    const expensesChartData = [
        { name: 'Comisiones de Red', value: pnl.egresos.comisiones_red },
        { name: 'Costo de Mercancía (COGS)', value: pnl.egresos.cogs },
        { name: 'Gasto de Fletes', value: pnl.egresos.fletes },
        { name: 'Gastos Administrativos', value: pnl.egresos.gastos_manuales }
    ].filter(item => item.value > 0);

    const assetsChartData = [
        { name: 'Disponible en Bancos', value: balance.activos.disponible_bancos },
        { name: 'Inventario de Mercancía', value: balance.activos.inventario },
        { name: 'Cuentas por Cobrar', value: balance.activos.cuentas_cobrar }
    ].filter(item => item.value > 0);

    const categoryNames = {
        marketing: "Marketing / Publicidad",
        hosting: "Hosting / Infraestructura",
        administrative: "Gastos Administrativos",
        salaries: "Salarios y Honorarios",
        other: "Otros Gastos"
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* CSS de impresión para maquetar el reporte PDF */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body { background: white !important; color: black !important; }
                    aside, header, nav, select, button, .no-print, .btn-action { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    .max-w-7xl { max-width: 100% !important; width: 100% !important; }
                    .shadow, .border { border: none !important; box-shadow: none !important; }
                    .bg-white { background: transparent !important; }
                    .grid { display: block !important; }
                    .grid > div { margin-bottom: 2rem !important; page-break-inside: avoid !important; }
                    .print-full-width { width: 100% !important; display: block !important; }
                }
            `}} />

            {/* Cabecera Principal */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow border border-gray-100 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🏦 Contabilidad y Finanzas</h1>
                    <p className="text-gray-500 text-sm">
                        Estado de Resultados (P&L) y Balance General consolidado — <span className="font-semibold text-indigo-600">{period_info.country}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="30d">Últimos 30 días</option>
                        <option value="this_month">Este Mes</option>
                        <option value="last_month">Mes Anterior</option>
                        <option value="this_year">Este Año</option>
                        <option value="all">Histórico Completo</option>
                    </select>

                    <button 
                        onClick={handleExportCSV}
                        className="bg-emerald-600 text-white px-4 py-2 rounded shadow hover:bg-emerald-700 transition font-bold text-sm"
                    >
                        📥 Exportar Excel
                    </button>

                    <button 
                        onClick={handlePrintPDF}
                        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition font-bold text-sm"
                    >
                        🖨️ Imprimir PDF
                    </button>
                </div>
            </div>

            {/* Cabecera versión impresa (solo visible en el PDF impreso) */}
            <div className="hidden print:block border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">REPORTE FINANCIERO Y CONTABLE</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Centro Comercial TEI — Fecha de Emisión: {new Date().toLocaleDateString('es-CO')}
                </p>
                <div className="flex justify-between text-xs text-gray-500 mt-3 font-mono">
                    <span>Filtro País: {period_info.country}</span>
                    <span>Rango del Periodo: {period_info.start_date} al {period_info.end_date}</span>
                </div>
            </div>

            {/* Metricas Clave */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Activos Totales"
                    value={formatCOP(balance.activos.total)}
                    subtitle="Disponible, inventarios y CxC"
                    icon="💵"
                    color="bg-emerald-50 text-emerald-700 border-emerald-100"
                />
                <MetricCard
                    title="Pasivos Totales"
                    value={formatCOP(balance.pasivos.total)}
                    subtitle="Billeteras, retiros e impuestos"
                    icon="🧾"
                    color="bg-red-50 text-red-700 border-red-100"
                />
                <MetricCard
                    title="Patrimonio Neto"
                    value={formatCOP(balance.patrimonio.total)}
                    subtitle="Valor residual de la empresa"
                    icon="🏛️"
                    color="bg-indigo-50 text-indigo-700 border-indigo-100"
                />
                <MetricCard
                    title="Utilidad Neta (Periodo)"
                    value={formatCOP(pnl.utilidad_neta)}
                    subtitle={`Margen de utilidad: ${pnl.utilidad_neta_percent}%`}
                    icon={pnl.utilidad_neta >= 0 ? "📈" : "📉"}
                    color={pnl.utilidad_neta >= 0 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"}
                />
            </div>

            {/* Gráficos de pastel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Composición de Activos (Balance)</h2>
                    {assetsChartData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetsChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {assetsChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ASSETS_COLORS[index % ASSETS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCOP(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400">
                            Sin datos de activos disponibles
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Composición de Egresos (P&L del Periodo)</h2>
                    {expensesChartData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expensesChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {expensesChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EXPENSES_COLORS[index % EXPENSES_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCOP(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400">
                            Sin egresos registrados en este periodo
                        </div>
                    )}
                </div>
            </div>

            {/* Balances y Estados de Resultados (Tablas Financieras) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-full-width">
                
                {/* ESTADO DE RESULTADOS (P&L) */}
                <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden print-full-width">
                    <div className="bg-indigo-900 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">📈 Estado de Resultados (P&L)</h2>
                        <p className="text-indigo-200 text-xs">Periodo: {period_info.start_date} al {period_info.end_date}</p>
                    </div>
                    <div className="p-6">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 font-semibold text-gray-800 text-base" colSpan="2">Ingresos Operacionales</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Ventas de Catálogo</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.ingresos.ventas_catalogo)}</td>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Membresías / Activaciones</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.ingresos.ventas_activacion)}</td>
                                </tr>
                                <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-800">
                                    <td className="py-3 pl-2">Ingresos Totales (A)</td>
                                    <td className="py-3 text-right">{formatCOP(pnl.ingresos.total)}</td>
                                </tr>

                                <tr className="border-b border-gray-100">
                                    <td className="py-4 font-semibold text-gray-800 text-base" colSpan="2">Costos y Gastos Operativos</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Costo de Mercancía Vendida (COGS)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.egresos.cogs)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Gastos por Comisiones Multinivel (Red)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.egresos.comisiones_red)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Costos de Logística y Fletes</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.egresos.fletes)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Gastos Operativos Registrados (Manuales)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(pnl.egresos.gastos_manuales)}</td>
                                </tr>
                                <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-800">
                                    <td className="py-3 pl-2">Gastos Totales (B)</td>
                                    <td className="py-3 text-right">{formatCOP(pnl.egresos.total)}</td>
                                </tr>

                                <tr className={`font-bold text-base ${pnl.utilidad_neta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                    <td className="py-3.5 pl-2">Utilidad Operativa Neta (A - B)</td>
                                    <td className="py-3.5 text-right">{formatCOP(pnl.utilidad_neta)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BALANCE GENERAL */}
                <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden print-full-width">
                    <div className="bg-emerald-900 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">🏛️ Balance General</h2>
                        <p className="text-emerald-200 text-xs">Situación Acumulada al día de hoy</p>
                    </div>
                    <div className="p-6">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 font-semibold text-gray-800 text-base" colSpan="2">Activos (Lo que posee la empresa)</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Caja y Bancos (Disponible)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.activos.disponible_bancos)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Inventario de Mercancía Valorado</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.activos.inventario)}</td>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Cuentas por Cobrar (Pedidos Pendientes)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.activos.cuentas_cobrar)}</td>
                                </tr>
                                <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-800">
                                    <td className="py-3 pl-2">Total Activos</td>
                                    <td className="py-3 text-right">{formatCOP(balance.activos.total)}</td>
                                </tr>

                                <tr className="border-b border-gray-100">
                                    <td className="py-4 font-semibold text-gray-800 text-base" colSpan="2">Pasivos (Obligaciones y Deudas)</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Saldos en Billeteras de Afiliados</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.pasivos.billeteras_afiliados)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Solicitudes de Retiro Pendientes</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.pasivos.retiros_pendientes)}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">IVA Acumulado Estimado</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.pasivos.iva_acumulado)}</td>
                                </tr>
                                <tr className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2.5 pl-4 text-gray-600">Retenciones por Pagar (Deducciones)</td>
                                    <td className="py-2.5 text-right font-medium text-gray-800">{formatCOP(balance.pasivos.retenciones_retefuente)}</td>
                                </tr>
                                <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-800">
                                    <td className="py-3 pl-2">Total Pasivos</td>
                                    <td className="py-3 text-right">{formatCOP(balance.pasivos.total)}</td>
                                </tr>

                                <tr className="border-b border-gray-100">
                                    <td className="py-4 font-semibold text-gray-800 text-base" colSpan="2">Patrimonio (Valor Residual)</td>
                                </tr>
                                <tr className="border-b border-gray-100 bg-gray-50 hover:bg-gray-50 font-semibold text-gray-800">
                                    <td className="py-3 pl-2">Capital Social / Utilidades Retenidas</td>
                                    <td className="py-3 text-right">{formatCOP(balance.patrimonio.total)}</td>
                                </tr>

                                <tr className="font-bold text-gray-800 bg-gray-100 border-t-2 border-gray-300">
                                    <td className="py-3.5 pl-2">Total Pasivo + Patrimonio</td>
                                    <td className="py-3.5 text-right">{formatCOP(balance.pasivos.total + balance.patrimonio.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Módulo de Gastos Operativos Manuales (No se imprime) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 no-print">
                {/* Formulario Registro Gasto */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-1">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">✍️ Registrar Gasto Operativo</h2>
                    <form onSubmit={handleSubmitExpense} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Concepto / Detalle *</label>
                            <input
                                type="text"
                                name="concept"
                                value={formData.concept}
                                onChange={handleInputChange}
                                placeholder="Ej: Pago de Servidor AWS"
                                className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monto en COP ($) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Ej: 350000"
                                className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Categoría de Gasto</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="hosting">Hosting / Infraestructura</option>
                                <option value="marketing">Marketing / Publicidad</option>
                                <option value="salaries">Nómina y Honorarios</option>
                                <option value="administrative">Gastos Administrativos</option>
                                <option value="other">Otros Gastos</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">País de Asignación</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Todos">Global (Todos los países)</option>
                                <option value="Colombia">Colombia</option>
                                <option value="Panamá">Panamá</option>
                                <option value="Ecuador">Ecuador</option>
                                <option value="Perú">Perú</option>
                                <option value="Venezuela">Venezuela</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Notas / Observaciones</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Detalles opcionales..."
                                rows="2"
                                className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {message && (
                            <div className={`text-sm font-semibold ${message.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded shadow transition text-sm"
                        >
                            {submitting ? 'Registrando...' : 'Guardar Gasto'}
                        </button>
                    </form>
                </div>

                {/* Listado de Gastos del Periodo */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">🗒️ Gastos Causados en el Periodo</h2>
                    {expensesList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 font-bold text-gray-600">
                                    <tr>
                                        <th className="py-2.5 px-4 text-left">Concepto</th>
                                        <th className="py-2.5 px-4 text-left">Categoría</th>
                                        <th className="py-2.5 px-4 text-left">País</th>
                                        <th className="py-2.5 px-4 text-right">Monto</th>
                                        <th className="py-2.5 px-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expensesList.map(exp => (
                                        <tr key={exp.id} className="hover:bg-gray-50">
                                            <td className="py-2.5 px-4 font-medium text-gray-800">
                                                {exp.concept}
                                                {exp.notes && <p className="text-xs text-gray-400 font-normal">{exp.notes}</p>}
                                            </td>
                                            <td className="py-2.5 px-4 text-gray-600">{categoryNames[exp.category] || exp.category}</td>
                                            <td className="py-2.5 px-4 text-gray-500">{exp.country}</td>
                                            <td className="py-2.5 px-4 text-right font-bold text-gray-800">{formatCOP(exp.amount)}</td>
                                            <td className="py-2.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteExpense(exp.id)}
                                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold py-1 px-2.5 rounded text-xs transition btn-action"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50 rounded">
                            <span className="text-3xl mb-2">💸</span>
                            <p className="font-medium">No hay gastos registrados en este periodo</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper component for KPI Cards
function MetricCard({ title, value, subtitle, icon, color }) {
    return (
        <div className={`bg-white p-6 rounded-lg shadow border ${color} flex items-center`}>
            <div className="text-3xl mr-4">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-extrabold mt-0.5">{value}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
