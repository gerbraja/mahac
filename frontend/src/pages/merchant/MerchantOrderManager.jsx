
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const MerchantOrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/merchants/my-orders');
            setOrders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleShipOrder = async (orderId) => {
        const tracking = window.prompt("Ingrese el número de guía de la transportadora para el pedido #" + orderId);
        if (!tracking) return;
        
        try {
            await api.post(`/api/store/orders/${orderId}/ship`, { tracking_number: tracking });
            alert("Pedido marcado como enviado exitosamente.");
            fetchOrders();
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || 'No se pudo despachar el pedido.'}`);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📦 Gestión de Pedidos Web</h2>
                    <button onClick={fetchOrders} className="text-blue-600 hover:underline">↻ Refrescar</button>
                </div>
                
                {loading && <p className="text-gray-500">Cargando pedidos...</p>}
                
                {!loading && orders.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Aún no tienes pedidos en tu tienda virtual.</p>
                )}

                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">Pedido #{order.id}</h3>
                                    <p className="text-sm text-gray-500">Cliente: {order.user_name}</p>
                                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-green-700">${order.total_amount_cop.toLocaleString()} COP</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
                                        order.status === 'escrow_funded' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {order.status === 'escrow_funded' && 'Fondos Retenidos (Listo para despachar)'}
                                        {order.status === 'shipped' && `Enviado (Guía: ${order.tracking_number || 'N/A'})`}
                                        {order.status === 'delivered' && 'Entregado (Fondos Liberados)'}
                                        {order.status === 'disputed' && 'En Disputa'}
                                        {order.status === 'cancelled_refunded' && 'Cancelado y Reembolsado'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="font-bold text-sm mb-2">Productos:</p>
                                <ul className="text-sm">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{item.qty}x {item.name}</span>
                                            <span>${item.price.toLocaleString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {order.status === 'escrow_funded' && (
                                <div className="border-t pt-4 mt-4">
                                    <p className="text-sm text-gray-600 mb-3">TEI ya tiene el dinero retenido. Prepara el paquete y envíalo.</p>
                                    <button 
                                        onClick={() => handleShipOrder(order.id)}
                                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                                    >
                                        📦 INGRESAR GUÍA Y MARCAR COMO ENVIADO
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MerchantOrderManager;
