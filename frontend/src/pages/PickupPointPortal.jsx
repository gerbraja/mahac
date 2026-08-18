import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/api';

const PickupPointPortal = () => {
    const { token } = useParams();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchBatchInfo();
    }, [token]);

    const fetchBatchInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/logistics/public-batch/${token}`);
            setBatch(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching batch:", err);
            setError(err.response?.data?.detail || "Enlace inválido o expirado");
        } finally {
            setLoading(false);
        }
    };

    const handleReportArrival = async () => {
        if (!confirm("¿Confirmas que el cargamento de 40kg ha llegado físicamente al punto? Esto notificará a todos los clientes.")) return;
        
        try {
            setActionLoading(true);
            await api.post(`/api/logistics/public-batch/${token}/arrive`);
            alert("¡Llegada confirmada! Los clientes han sido notificados.");
            fetchBatchInfo();
        } catch (err) {
            alert("Error al reportar llegada: " + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliverOrder = async (orderId, customerName) => {
        if (!confirm(`¿Confirmas la entrega física del paquete a ${customerName}?`)) return;

        try {
            setActionLoading(true);
            await api.post(`/api/logistics/public-batch/${token}/deliver/${orderId}`);
            alert(`Pedido #${orderId} marcado como ENTREGADO.`);
            fetchBatchInfo();
        } catch (err) {
            alert("Error al marcar entrega: " + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">Cargando información del cargamento...</div>;
    if (error) return (
        <div className="p-10 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600">{error}</h1>
            <p className="text-gray-600 mt-2">Por favor contacta al administrador central.</p>
        </div>
    );

    const isArrived = batch.status === 'recibido';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Mobile Optimized */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 shadow-lg">
                <h1 className="text-xl font-bold mb-1">📦 Punto de Entrega</h1>
                <p className="text-blue-100 text-lg font-bold">{batch.point_name}</p>
                <div className="mt-4 bg-white/10 p-3 rounded-lg border border-white/20">
                    <p className="text-xs uppercase tracking-wider opacity-80">Guía Maestra del Bulto</p>
                    <p className="text-2xl font-mono font-bold">{batch.master_tracking || "SÍN GUÍA"}</p>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Arrival Status Card */}
                {!isArrived ? (
                    <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl shadow-sm text-center">
                        <p className="text-orange-800 font-bold text-lg mb-4">El cargamento está en camino</p>
                        <button
                            onClick={handleReportArrival}
                            disabled={actionLoading}
                            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-orange-700 active:scale-95 transition-all"
                        >
                            {actionLoading ? "Procesando..." : "✅ REPORTAR LLEGADA AHORA"}
                        </button>
                    </div>
                ) : (
                    <div className="bg-green-100 border-2 border-green-500 p-4 rounded-2xl text-center">
                        <p className="text-green-800 font-black text-xl">✅ CARGA RECIBIDA</p>
                        <p className="text-green-700 text-sm">Los clientes ya pueden pasar por sus paquetes.</p>
                    </div>
                )}

                {/* Orders List */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-2">
                        <h2 className="text-lg font-bold text-gray-800">Lista de Paquetes ({batch.orders.length})</h2>
                        <a 
                            href={`${api.defaults.baseURL}/api/logistics/public-batch/${token}/manifest`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 text-sm font-bold underline"
                        >
                            Descargar Manifiesto
                        </a>
                    </div>
                    
                    {batch.orders.map(order => (
                        <div key={order.id} className={`bg-white rounded-2xl p-5 shadow-md border-l-8 ${order.status === 'completado' ? 'border-green-500' : 'border-blue-500'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold font-mono">ORDEN #{order.id}</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase">{order.customer_name}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {order.status === 'completado' ? 'ENTREGADO' : 'PENDIENTE'}
                                </span>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <a 
                                    href={`tel:${order.customer_phone}`}
                                    className="flex-1 bg-gray-100 p-3 rounded-xl flex items-center justify-center gap-2 text-gray-700 font-bold shadow-sm"
                                >
                                    📞 Llamar
                                </a>
                                <a 
                                    href={`https://wa.me/${order.customer_phone.replace(/\+/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-green-100 p-3 rounded-xl flex items-center justify-center gap-2 text-green-700 font-bold shadow-sm"
                                >
                                    💬 WhatsApp
                                </a>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Guía Individual del Paquete</p>
                                <p className="text-lg font-mono font-bold text-gray-600">{order.tracking_number || "Sin Guía"}</p>
                            </div>

                            {isArrived && order.status !== 'completado' && (
                                <button
                                    onClick={() => handleDeliverOrder(order.id, order.customer_name)}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:bg-blue-700 transition-all"
                                >
                                    🚀 ENTREGAR PAQUETE
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                <p className="text-center text-xs text-gray-400 font-medium">TEI Logistics System v2.0 - Oficina Central</p>
            </footer>
        </div>
    );
};

export default PickupPointPortal;
