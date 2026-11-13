import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminTaxes() {
    const { globalCountry } = useAdmin();
    const [activeTab, setActiveTab] = useState('fiscal_closing'); // 'fiscal_closing' | 'withholdings' | 'sales_iva'
    const [loading, setLoading] = useState(true);
    const [executingClosing, setExecutingClosing] = useState(false);

    // Filter states for withholdings
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth); // Default to current month

    // Data states
    const [withholdingData, setWithholdingData] = useState({
        summary: {},
        by_month: [],
        records: []
    });
    const [taxData, setTaxData] = useState([]);
    const [fiscalClosingData, setFiscalClosingData] = useState(null);

    const formatCOP = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const formatCOPDecimals = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    useEffect(() => {
        fetchReports();
    }, [globalCountry, selectedYear, selectedMonth]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const withParams = { year: selectedYear };
            if (selectedMonth && selectedMonth !== 'all') {
                withParams.month = selectedMonth;
            }
            if (globalCountry && globalCountry !== 'Todos') {
                withParams.country = globalCountry;
            }

            const closingMonth = selectedMonth === 'all' ? currentMonth : selectedMonth;

            const [withRes, taxesRes, closingRes] = await Promise.all([
                api.get('/api/admin/reports/withholdings', { params: withParams }).catch(() => ({ data: null })),
                api.get('/api/admin/reports/taxes').catch(() => ({ data: [] })),
                api.get('/api/admin/fiscal-closing/preview', { params: { year: selectedYear, month: closingMonth } }).catch(() => ({ data: null }))
            ]);

            if (withRes?.data) {
                setWithholdingData(withRes.data);
            }
            if (closingRes?.data) {
                setFiscalClosingData(closingRes.data);
            }

            const allTaxes = taxesRes.data || [];
            if (globalCountry === 'Todos') {
                setTaxData(allTaxes);
            } else {
                setTaxData(allTaxes.filter(t => t.pais === globalCountry));
            }
        } catch (error) {
            console.error("Error fetching tax reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteFiscalClosing = async () => {
        const closingMonth = selectedMonth === 'all' ? currentMonth : selectedMonth;
        if (!window.confirm(`¿Deseas ejecutar el Cierre Fiscal Mensual Consolidado (${selectedYear}-${String(closingMonth).padStart(2, '0')}) y emitir 1 factura electrónica individual en Siigo -> DIAN por cada Conductor TEI RIDE y cada Negocio Aliado con movimientos en el mes?`)) {
            return;
        }
        setExecutingClosing(true);
        try {
            const res = await api.post('/api/admin/fiscal-closing/execute', {
                year: selectedYear,
                month: closingMonth,
                emit_siigo: true
            });
            alert(`✅ ${res.data?.message || 'Cierre Fiscal Mensual ejecutado exitosamente.'}`);
            fetchReports();
        } catch (err) {
            alert('Error ejecutando Cierre Fiscal Mensual: ' + (err.response?.data?.detail || err.message));
        } finally {
            setExecutingClosing(false);
        }
    };

    const handleDeleteWithholding = async (id, userName) => {
        if (!window.confirm(`¿Estás seguro de eliminar el registro de retención #${id} (${userName})? Los saldos en monedero y banco del usuario se mantendrán intactos.`)) {
            return;
        }
        try {
            await api.delete(`/api/admin/reports/withholdings/${id}`);
            alert(`✅ Registro #${id} eliminado con éxito.`);
            fetchReports();
        } catch (err) {
            alert('Error eliminando registro: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleCleanOctoberTests = async () => {
        if (!window.confirm("¿Deseas eliminar todas las retenciones de prueba de Octubre 2026 para iniciar con datos 100% reales? (Los saldos de los usuarios se mantendrán intactos).")) {
            return;
        }
        try {
            const res = await api.post('/api/admin/reports/withholdings/clean-october-tests');
            alert(`✅ ${res.data?.message || 'Registros de prueba eliminados exitosamente.'}`);
            fetchReports();
        } catch (err) {
            alert('Error limpiando registros de prueba: ' + (err.response?.data?.detail || err.message));
        }
    };

    // Export Withholding CSV for DIAN / Accountant
    const handleExportCSV = () => {
        const records = withholdingData.records || [];
        if (records.length === 0) {
            alert("No hay registros de retenciones para exportar en este período.");
            return;
        }

        const headers = [
            "ID Registro",
            "Fecha y Hora",
            "Cédula / NIT",
            "Nombre del Afiliado",
            "Correo",
            "Celular",
            "Ciudad / Municipio",
            "País",
            "Concepto / Operación",
            "Base Gravable (USD)",
            "Base Gravable (COP)",
            "% ReteFuente",
            "ReteFuente a Pagar DIAN (COP)",
            "% ReteICA",
            "ReteICA Municipal (COP)",
            "Total Retenido (COP)",
            "Neto Pagado al Banco (COP)"
        ];

        const rows = records.map(r => [
            r.id,
            r.created_at ? new Date(r.created_at).toLocaleString('es-CO') : '',
            `"${r.user_doc || ''}"`,
            `"${(r.user_name || '').replace(/"/g, '""')}"`,
            `"${r.user_email || ''}"`,
            `"${r.user_phone || ''}"`,
            `"${r.city || ''}"`,
            `"${r.country || ''}"`,
            `"${r.release_type === 'vault_to_bank' ? 'Traslado Caja Fuerte a Banco' : r.release_type}"`,
            r.gross_usd,
            r.gross_cop,
            r.retefuente_pct,
            r.retefuente_cop,
            r.reteica_pct,
            r.reteica_cop,
            r.total_withheld_cop,
            r.net_cop
        ]);

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const monthLabel = selectedMonth === 'all' ? 'Anual' : `Mes_${selectedMonth}`;
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Retenciones_DIAN_${selectedYear}_${monthLabel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const summary = withholdingData.summary || {};
    const totalIVA = taxData.reduce((acc, curr) => acc + (curr.ivaPagar || 0), 0);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4">
            {/* Header Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">🧾</span>
                        <h1 className="text-2xl font-black text-gray-900">
                            Obligaciones Fiscales, Cierre Mensual Siigo → DIAN &amp; Retenciones: <span className="text-red-700">{globalCountry === 'Todos' ? 'Global' : globalCountry}</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Facturación Electrónica Consolidada Mensual (23:00h fin de mes) para Conductores TEI RIDE y Negocios Aliados, ReteFuente (Form. 350), ReteICA e IVA
                    </p>
                </div>

                {/* Botón de Exportación / Ejecución */}
                {activeTab === 'withholdings' && (
                    <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-sm transition"
                    >
                        <span>📥</span>
                        <span>Descargar Reporte DIAN (Excel / CSV)</span>
                    </button>
                )}
                {activeTab === 'fiscal_closing' && (
                    <button
                        onClick={handleExecuteFiscalClosing}
                        disabled={executingClosing}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-2 text-sm transition disabled:opacity-50"
                    >
                        <span>⚡</span>
                        <span>{executingClosing ? 'Emitiendo a Siigo...' : 'Ejecutar Cierre Mensual & Emitir a Siigo → DIAN'}</span>
                    </button>
                )}
            </div>

            {/* Pestañas de Navegación Fiscal */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('fiscal_closing')}
                    className={`py-3 px-5 text-sm font-black rounded-t-2xl transition flex items-center gap-2 ${activeTab === 'fiscal_closing' ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    <span>🚖🏪</span>
                    <span>Cierre Fiscal Mensual Consolidado (TEI RIDE &amp; Negocios Aliados → Siigo/DIAN)</span>
                </button>
                <button
                    onClick={() => setActiveTab('withholdings')}
                    className={`py-3 px-5 text-sm font-black rounded-t-2xl transition flex items-center gap-2 ${activeTab === 'withholdings' ? 'bg-white border-t-2 border-red-600 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    <span>🏛️</span>
                    <span>Retenciones en la Fuente &amp; ReteICA (Caja Fuerte → Banco)</span>
                    {summary.records_count > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                            {summary.records_count}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sales_iva')}
                    className={`py-3 px-5 text-sm font-black rounded-t-2xl transition flex items-center gap-2 ${activeTab === 'sales_iva' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    <span>🛍️</span>
                    <span>IVA por Ventas en Tienda</span>
                </button>
            </div>

            {/* CONTENIDO PESTAÑA 0: CIERRE FISCAL MENSUAL CONSOLIDADO (TEI RIDE & NEGOCIOS ALIADOS -> SIIGO / DIAN) */}
            {activeTab === 'fiscal_closing' && (
                <div className="space-y-6">
                    {/* Selector de Periodo Mensual */}
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-black text-indigo-900 uppercase">📅 Período de Cierre Mensual (Corte Día Último 23:00h):</span>
                            <select
                                value={selectedMonth === 'all' ? currentMonth : selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none"
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={idx + 1} value={idx + 1}>
                                        🗓️ {name} ({selectedYear})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none"
                            >
                                {[currentYear - 1, currentYear, currentYear + 1].map(yr => (
                                    <option key={yr} value={yr}>{yr}</option>
                                ))}
                            </select>
                            <button
                                onClick={fetchReports}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                            >
                                🔄 Actualizar Consolidado
                            </button>
                        </div>
                        <div className="text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                            ⏰ Ejecución Automática: Último día del mes a las 23:00h (Hora Colombia)
                        </div>
                    </div>

                    {/* Resumen Gran Total a Pagar a Entidades del Estado & Cascada 5 Pasos */}
                    {fiscalClosingData?.grand_totals && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">1. Recaudo Bruto Total</p>
                                    <p className="text-lg font-black text-gray-900 mt-1">{formatCOP(fiscalClosingData.grand_totals.gross_collected_cop)}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        🚖 {fiscalClosingData.grand_totals.drivers_count} Conductores · 🏪 {fiscalClosingData.grand_totals.merchants_count} Aliados
                                    </p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-amber-800 uppercase">2. (-) Pasarela Wompi</p>
                                    <p className="text-lg font-black text-amber-900 mt-1">-{formatCOP(fiscalClosingData.grand_totals.wompi_fee_cop)}</p>
                                    <p className="text-[11px] text-amber-700 mt-1">
                                        2.65% + $700 COP ({fiscalClosingData.grand_totals.total_movements} pagos)
                                    </p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-emerald-800 uppercase">3. (-) Red 91.5% (Mandato)</p>
                                    <p className="text-lg font-black text-emerald-900 mt-1">-{formatCOP(fiscalClosingData.grand_totals.network_91_5_cop)}</p>
                                    <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                                        🔒 50% Caja: {formatCOP(fiscalClosingData.grand_totals.vault_50_pct_cop)}<br />
                                        🎁 50% Fidelización: {formatCOP(fiscalClosingData.grand_totals.loyalty_bag_50_pct_cop)}
                                    </p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-indigo-800 uppercase">4. (=) Ganancia Bruta TEI (8.5%)</p>
                                    <p className="text-lg font-black text-indigo-900 mt-1">{formatCOP(fiscalClosingData.grand_totals.tei_gross_8_5_cop)}</p>
                                    <p className="text-[11px] text-indigo-700 mt-1">
                                        Base sin IVA: {formatCOP(fiscalClosingData.grand_totals.tei_taxable_base_cop)}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-red-800 uppercase">5A. Total DIAN (IVA 19% + Renta 35%)</p>
                                    <p className="text-lg font-black text-red-900 mt-1">{formatCOP(fiscalClosingData.grand_totals.total_dian_taxes_cop)}</p>
                                    <p className="text-[10px] text-red-700 mt-1 font-semibold">
                                        IVA 19%: {formatCOP(fiscalClosingData.grand_totals.iva_19_cop)}<br />
                                        Renta 35%: {formatCOP(fiscalClosingData.grand_totals.income_tax_35_cop)}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm">
                                    <p className="text-[11px] font-bold text-blue-800 uppercase">5B. Hacienda Bogotá + Utilidad Neta</p>
                                    <p className="text-sm font-black text-blue-900 mt-1">ICA (9.66‰): {formatCOPDecimals(fiscalClosingData.grand_totals.ica_bogota_cop)}</p>
                                    <p className="text-sm font-black text-emerald-700 mt-1">
                                        Utilidad Neta: {formatCOP(fiscalClosingData.grand_totals.net_profit_tei_cop)}
                                    </p>
                                </div>
                            </div>

                            {/* Leyenda de Observaciones Legales que se imprime en la Factura Siigo */}
                            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                    <div>
                                        <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                                            📋 Observaciones Legales / Detalle de Mandato y Recaudo para Terceros (Cuerpo Factura Siigo → DIAN)
                                        </span>
                                        <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                                            Queda discriminado en el cuerpo de cada factura electrónica individual consolidada el total recaudado del Conductor o Negocio Aliado, el descuento real de pasarela Wompi (<strong>2.65% + $700 COP</strong> por transacción) y el recaudo destinado a la Comunidad de Consumidores (<strong>91.5%</strong> del remanente: <strong>50% 🔒 Caja Fuerte</strong> y <strong>50% 🎁 Bolsa Fidelización TEI</strong>), facturando como ingreso propio de TEI únicamente el <strong>8.5%</strong> de intermediación tecnológica (Base Gravable + IVA 19%).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla Consolidada de Conductores TEI RIDE */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                                            <span>🚖</span> Consolidado Mensual por Conductor TEI RIDE ({fiscalClosingData.drivers?.length || 0} facturas consolidadas)
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            1 sola factura electrónica consolidada al cierre del mes por cada conductor con movimientos
                                        </p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black border-b border-gray-200">
                                                <th className="py-3 px-3">Conductor / NIT-Cédula</th>
                                                <th className="py-3 px-3 text-center">Pagos</th>
                                                <th className="py-3 px-3 text-right">Recaudo Bruto</th>
                                                <th className="py-3 px-3 text-right">(-) Wompi</th>
                                                <th className="py-3 px-3 text-right">(-) Red 91.5% (50/50)</th>
                                                <th className="py-3 px-3 text-right">(=) TEI 8.5%</th>
                                                <th className="py-3 px-3 text-right">Base Sin IVA</th>
                                                <th className="py-3 px-3 text-right">IVA 19% (DIAN)</th>
                                                <th className="py-3 px-3 text-right">ICA Bogotá</th>
                                                <th className="py-3 px-3 text-right">Utilidad Neta TEI</th>
                                                <th className="py-3 px-3 text-center">Factura Siigo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(fiscalClosingData.drivers || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="11" className="py-8 text-center text-gray-400 font-medium">
                                                        No hay movimientos de comisiones de conductores TEI RIDE en este mes.
                                                    </td>
                                                </tr>
                                            ) : (
                                                fiscalClosingData.drivers.map((d, idx) => (
                                                    <tr key={idx} className="hover:bg-indigo-50/30">
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-gray-900">{d.entity_name}</div>
                                                            <div className="text-[11px] text-gray-500">CC/NIT: {d.entity_nit} · {d.entity_email}</div>
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-bold">{d.movements_count}</td>
                                                        <td className="py-3 px-3 text-right font-black text-gray-900">{formatCOP(d.gross_collected_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-amber-700 font-semibold">-{formatCOP(d.wompi_fee_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-emerald-700 font-semibold">-{formatCOP(d.network_91_5_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-black text-indigo-900">{formatCOP(d.tei_gross_8_5_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-gray-700">{formatCOP(d.tei_taxable_base_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-red-700">{formatCOP(d.iva_19_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-blue-700">{formatCOPDecimals(d.ica_bogota_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-black text-emerald-700">{formatCOP(d.net_profit_tei_cop)}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            {d.siigo_invoice_id ? (
                                                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">
                                                                    ✅ {d.siigo_invoice_id}
                                                                </span>
                                                            ) : (
                                                                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                                    ⏳ Pendiente Cierre
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tabla Consolidada de Negocios Aliados */}
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                                            <span>🏪</span> Consolidado Mensual por Negocio Aliado ({fiscalClosingData.merchants?.length || 0} facturas consolidadas)
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Mismo modelo escalonado (Pasarela Wompi 2.65%+$700 → 91.5% Red Consumidores 50/50 → 8.5% Ingreso Propio TEI)
                                        </p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black border-b border-gray-200">
                                                <th className="py-3 px-3">Negocio Aliado / NIT</th>
                                                <th className="py-3 px-3 text-center">Movimientos</th>
                                                <th className="py-3 px-3 text-right">Recaudo Bruto</th>
                                                <th className="py-3 px-3 text-right">(-) Wompi</th>
                                                <th className="py-3 px-3 text-right">(-) Red 91.5% (50/50)</th>
                                                <th className="py-3 px-3 text-right">(=) TEI 8.5%</th>
                                                <th className="py-3 px-3 text-right">Base Sin IVA</th>
                                                <th className="py-3 px-3 text-right">IVA 19% (DIAN)</th>
                                                <th className="py-3 px-3 text-right">ICA Bogotá</th>
                                                <th className="py-3 px-3 text-right">Utilidad Neta TEI</th>
                                                <th className="py-3 px-3 text-center">Factura Siigo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(fiscalClosingData.merchants || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="11" className="py-8 text-center text-gray-400 font-medium">
                                                        No hay movimientos de comisiones de Negocios Aliados en este mes.
                                                    </td>
                                                </tr>
                                            ) : (
                                                fiscalClosingData.merchants.map((m, idx) => (
                                                    <tr key={idx} className="hover:bg-indigo-50/30">
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-gray-900">{m.entity_name}</div>
                                                            <div className="text-[11px] text-gray-500">NIT: {m.entity_nit} · {m.entity_email}</div>
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-bold">{m.movements_count}</td>
                                                        <td className="py-3 px-3 text-right font-black text-gray-900">{formatCOP(m.gross_collected_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-amber-700 font-semibold">-{formatCOP(m.wompi_fee_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-emerald-700 font-semibold">-{formatCOP(m.network_91_5_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-black text-indigo-900">{formatCOP(m.tei_gross_8_5_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-gray-700">{formatCOP(m.tei_taxable_base_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-red-700">{formatCOP(m.iva_19_cop)}</td>
                                                        <td className="py-3 px-3 text-right text-blue-700">{formatCOPDecimals(m.ica_bogota_cop)}</td>
                                                        <td className="py-3 px-3 text-right font-black text-emerald-700">{formatCOP(m.net_profit_tei_cop)}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            {m.siigo_invoice_id ? (
                                                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">
                                                                    ✅ {m.siigo_invoice_id}
                                                                </span>
                                                            ) : (
                                                                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                                    ⏳ Pendiente Cierre
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* CONTENIDO PESTAÑA 1: RETENCIONES EN LA FUENTE (DIAN & RETEICA) */}
            {activeTab === 'withholdings' && (
                <div className="space-y-6">
                    {/* Barra de Filtros de Período Fiscal */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-gray-500 uppercase">Período Fiscal:</span>
                            
                            {/* Selector de Mes */}
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value="all">📅 Todo el Año ({selectedYear})</option>
                                {monthNames.map((name, idx) => (
                                    <option key={idx + 1} value={idx + 1}>
                                        {name} {idx + 1 === currentMonth ? '(Mes Actual)' : ''}
                                    </option>
                                ))}
                            </select>

                            {/* Selector de Año */}
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value={2026}>Año 2026</option>
                                <option value={2025}>Año 2025</option>
                            </select>

                            {selectedMonth !== currentMonth && (
                                <button
                                    onClick={() => setSelectedMonth(currentMonth)}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    Ver Mes Actual (Octubre)
                                </button>
                            )}
                        </div>

                        {/* Aviso Calendario Tributario */}
                        <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                            <span>📌</span>
                            <span>
                                Las retenciones practicadas en <strong>{selectedMonth === 'all' ? selectedYear : monthNames[selectedMonth - 1]}</strong> se declaran y pagan a la DIAN el próximo mes en el <strong>Formulario 350</strong>.
                            </span>
                        </div>
                    </div>

                    {/* TARJETAS KPI DE RETENCIONES A PAGAR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. RETEFUENTE DIAN (6%) */}
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-3xl p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-red-600 font-black uppercase tracking-wider">
                                    🏛️ ReteFuente DIAN (6%)
                                </span>
                                <span className="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    A Pagar DIAN
                                </span>
                            </div>
                            <div className="text-2xl font-black text-red-700 mt-2">
                                {formatCOP(summary.total_retefuente_cop)}
                            </div>
                            <div className="text-xs text-red-500 font-semibold mt-0.5">
                                {formatUSD(summary.total_retefuente_usd)} USD
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 border-t border-red-100 pt-2">
                                Retención nacional sobre comisiones liberadas
                            </p>
                        </div>

                        {/* 2. RETEICA MUNICIPAL */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-3xl p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-orange-600 font-black uppercase tracking-wider">
                                    🏙️ ReteICA Municipal
                                </span>
                                <span className="bg-orange-200 text-orange-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Alcaldías
                                </span>
                            </div>
                            <div className="text-2xl font-black text-orange-700 mt-2">
                                {formatCOP(summary.total_reteica_cop)}
                            </div>
                            <div className="text-xs text-orange-500 font-semibold mt-0.5">
                                {formatUSD(summary.total_reteica_usd)} USD
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 border-t border-orange-100 pt-2">
                                Retención municipal de Industria y Comercio
                            </p>
                        </div>

                        {/* 3. BASE GRAVABLE BRUTA */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 shadow-sm">
                            <span className="text-xs text-blue-600 font-black uppercase tracking-wider block">
                                💼 Base Gravable (Comisiones)
                            </span>
                            <div className="text-2xl font-black text-blue-900 mt-2">
                                {formatCOP(summary.total_gross_cop)}
                            </div>
                            <div className="text-xs text-blue-500 font-semibold mt-0.5">
                                {formatUSD(summary.total_gross_usd)} USD
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 border-t border-blue-100 pt-2">
                                Total bruto transferido de Caja Fuerte
                            </p>
                        </div>

                        {/* 4. NETO PAGADO AL BANCO */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-sm">
                            <span className="text-xs text-emerald-600 font-black uppercase tracking-wider block">
                                🏦 Neto Entregado a Afiliados
                            </span>
                            <div className="text-2xl font-black text-emerald-900 mt-2">
                                {formatCOP(summary.total_net_cop)}
                            </div>
                            <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                                {formatUSD(summary.total_net_usd)} USD
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 border-t border-emerald-100 pt-2">
                                Fondos acreditados en Banco para retiros
                            </p>
                        </div>
                    </div>

                    {/* TABLA DE RETENCIONES PRACTICADAS */}
                    <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-gray-800 text-base">
                                    Detalle de Retenciones Practicadas por Afiliado
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Registros individuales aplicados al trasladar de Caja Fuerte a Banco
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {withholdingData.records?.length > 0 && (
                                    <button
                                        onClick={handleCleanOctoberTests}
                                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                                        title="Eliminar todas las retenciones de prueba registradas antes de Noviembre"
                                    >
                                        <span>🧹</span>
                                        <span>Limpiar Pruebas (Octubre)</span>
                                    </button>
                                )}
                                <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border">
                                    {withholdingData.records?.length || 0} operaciones
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
                                <p className="text-gray-500 text-xs mt-3">Consultando retenciones tributarias...</p>
                            </div>
                        ) : withholdingData.records?.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <span className="text-4xl block mb-2">📭</span>
                                <h4 className="font-bold text-gray-700 text-sm">No hay retenciones registradas en este período</h4>
                                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                                    Las retenciones se registran automáticamente cada vez que un afiliado con comisiones liberadas realiza el traslado de Caja Fuerte hacia su Banco.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-left">
                                    <thead className="bg-gray-50 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3.5">Fecha</th>
                                            <th className="px-5 py-3.5">Afiliado / Cédula</th>
                                            <th className="px-5 py-3.5">Ciudad</th>
                                            <th className="px-5 py-3.5">Base Bruta</th>
                                            <th className="px-5 py-3.5 text-red-600">ReteFuente (6%)</th>
                                            <th className="px-5 py-3.5 text-orange-600">ReteICA</th>
                                            <th className="px-5 py-3.5 text-gray-800">Total Retenido</th>
                                            <th className="px-5 py-3.5 text-emerald-700">Neto al Banco</th>
                                            <th className="px-5 py-3.5 text-center text-gray-500">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                        {withholdingData.records.map((r) => (
                                            <tr key={r.id} className="hover:bg-red-50/30 transition">
                                                <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                                                    {r.created_at ? new Date(r.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    <span className="block text-[10px] text-gray-400">
                                                        {r.created_at ? new Date(r.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-gray-900">{r.user_name}</div>
                                                    <div className="text-[11px] text-gray-500 font-mono">
                                                        ID: {r.user_doc || 'Sin Cédula/NIT'}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                                                    📍 {r.city || 'Bogotá'}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-gray-900">{formatCOP(r.gross_cop)}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{formatUSD(r.gross_usd)} USD</div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-red-600">{formatCOP(r.retefuente_cop)}</div>
                                                    <div className="text-[10px] text-red-400">({r.retefuente_pct}%)</div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-orange-600">{formatCOP(r.reteica_cop)}</div>
                                                    <div className="text-[10px] text-orange-400">({r.reteica_pct}%)</div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">
                                                    {formatCOP(r.total_withheld_cop)}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap font-bold text-emerald-700 bg-emerald-50/50">
                                                    {formatCOP(r.net_cop)}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleDeleteWithholding(r.id, r.user_name)}
                                                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1 border border-red-200"
                                                        title="Eliminar este registro de prueba"
                                                    >
                                                        <span>🗑️</span>
                                                        <span>Borrar</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CONTENIDO PESTAÑA 2: IVA POR VENTAS EN TIENDA */}
            {activeTab === 'sales_iva' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">IVA Consolidado por Ventas de Productos</h3>
                            <p className="text-gray-500 text-xs mt-1">Impuesto a las ventas generado en órdenes de tienda virtual</p>
                        </div>
                        <div className="bg-red-50 px-5 py-2.5 border border-red-200 rounded-2xl text-right">
                            <span className="text-xs text-red-500 font-black uppercase block">Total IVA Liquidado</span>
                            <span className="text-xl text-red-700 font-black">{formatCOP(totalIVA)}</span>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">País</th>
                                        <th className="px-6 py-3 text-left">Ventas (Base)</th>
                                        <th className="px-6 py-3 text-left">Tasa IVA</th>
                                        <th className="px-6 py-3 text-left text-red-600 font-bold">IVA Liquidado</th>
                                        <th className="px-6 py-3 text-left">Estado Fiscal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {taxData.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500 text-xs">
                                                No hay registros de ventas para el país seleccionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        taxData.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">📍 {row.pais}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatCOP(row.ventas)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.tasaIva}</td>
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">{formatCOP(row.ivaPagar)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${row.estado === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {row.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
