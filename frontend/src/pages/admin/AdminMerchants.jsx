import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const AdminMerchants = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/api/admin/merchants/invoices');
            setPeriods(res.data);
        } catch (error) {
            console.error("Error fetching merchant invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (merchantId, merchantName, period, amount, count) => {
        const confirmPay = window.confirm(`¿Estás seguro que el comercio "${merchantName}" ya transfirió a TEI la comisión de $${amount.toLocaleString()} COP por las ${count} ventas del periodo ${period}?\n\nAl darle Aceptar, el sistema repartirá estas comisiones masivamente a la red. Esta acción no se puede deshacer.`);
        
        if (!confirmPay) return;
        
        setActionLoading(true);
        try {
            await api.post(`/api/admin/merchants/invoices/pay_period`, {
                merchant_id: merchantId,
                period: period
            });
            alert('✅ Comisiones repartidas a la red exitosamente.');
            fetchInvoices();
        } catch (error) {
            alert(`❌ Error: ${error.response?.data?.detail || 'No se pudo procesar el pago'}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando cortes de facturación...</div>;

    const pendingPeriods = periods.filter(p => p.status === 'pending_merchant_payment');
    const paidPeriods = periods.filter(p => p.status !== 'pending_merchant_payment');

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">🏪 Comercios Aliados (Cortes Mensuales)</h1>
                <p className="text-gray-600 mt-2">
                    Las ventas de los comercios se agrupan automáticamente en cortes mensuales (Ciclo: del día 4 al día 3 del mes siguiente).
                    Aprueba el pago del periodo cerrado con un solo clic.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-yellow-50">
                    <h2 className="text-xl font-bold text-yellow-800">⚠️ Periodos Pendientes de Cobro ({pendingPeriods.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-4">Comercio</th>
                                <th className="p-4">Periodo (Quincena)</th>
                                <th className="p-4">Cant. Ventas</th>
                                <th className="p-4">Total Vendido</th>
                                <th className="p-4">Comisión que deben a TEI</th>
                                <th className="p-4">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingPeriods.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No hay periodos pendientes de cobro.</td></tr>
                            ) : (
                                pendingPeriods.map(p => (
                                    <tr key={`${p.merchant_id}_${p.period}`} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{p.merchant_name}</td>
                                        <td className="p-4 font-medium text-blue-600">{p.period}</td>
                                        <td className="p-4">{p.transaction_count}</td>
                                        <td className="p-4">${p.total_sales.toLocaleString()}</td>
                                        <td className="p-4 font-bold text-red-600">${p.total_commission.toLocaleString()}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleMarkAsPaid(p.merchant_id, p.merchant_name, p.period, p.total_commission, p.transaction_count)}
                                                disabled={actionLoading}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Procesando...' : 'Pagar Quincena Completa'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 opacity-80 mt-8">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-700">✓ Historial de Periodos Pagados</h2>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0">
                            <tr>
                                <th className="p-3">Comercio</th>
                                <th className="p-3">Periodo (Quincena)</th>
                                <th className="p-3">Cant. Ventas</th>
                                <th className="p-3">Total Vendido</th>
                                <th className="p-3">Comisión Cobrada</th>
                                <th className="p-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paidPeriods.length === 0 ? (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-400">Sin historial</td></tr>
                            ) : (
                                paidPeriods.map(p => (
                                    <tr key={`${p.merchant_id}_${p.period}`}>
                                        <td className="p-3 font-bold">{p.merchant_name}</td>
                                        <td className="p-3">{p.period}</td>
                                        <td className="p-3">{p.transaction_count}</td>
                                        <td className="p-3">${p.total_sales.toLocaleString()}</td>
                                        <td className="p-3 font-bold text-green-600">${p.total_commission.toLocaleString()}</td>
                                        <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Completado ✓</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminMerchants;
