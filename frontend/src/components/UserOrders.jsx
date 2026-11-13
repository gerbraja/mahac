import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import ProductReviewModal from './ProductReviewModal';

const UserOrders = () => {
    const [orders, setOrders] = useState([]);
    const [storeOrders, setStoreOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [reviewModalData, setReviewModalData] = useState(null);
    const [orderType, setOrderType] = useState('tei'); // 'tei' or 'store'

    const statusLabels = {
        reservado: 'Reservado',
        en_preparacion: 'En Preparación',
        en_transito_a_punto: 'En Tránsito al Punto',
        listo_para_entrega: 'Listo para Entrega',
        enviado: 'Enviado',
        completado: 'Completado'
    };

    const statusColors = {
        reservado: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        en_preparacion: 'bg-blue-100 text-blue-800 border-blue-300',
        en_transito_a_punto: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        listo_para_entrega: 'bg-orange-100 text-orange-800 border-orange-300',
        enviado: 'bg-purple-100 text-purple-800 border-purple-300',
        completado: 'bg-green-100 text-green-800 border-green-300'
    };

    const statusDescriptions = {
        reservado: 'Tu pedido está reservado. Completa el pago para continuar.',
        en_preparacion: 'Pago confirmado. Tu pedido está en alistamiento.',
        en_transito_a_punto: 'Tu pedido viaja en un envío consolidado hacia tu ciudad.',
        listo_para_entrega: '📍 Por favor, pasar por su pedido al lugar de entrega por favor.',
        enviado: 'Tu pedido ha sido enviado y está en camino.',
        completado: 'Tu pedido ha sido entregado exitosamente.'
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const [teiRes, storeRes] = await Promise.all([
                api.get('/api/orders/my'),
                api.get('/api/store/orders/my-purchases').catch(() => ({ data: [] }))
            ]);
            setOrders(teiRes.data);
            setStoreOrders(storeRes.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };
    
    const handleReceiveStoreOrder = async (orderId) => {
        if(!window.confirm('¿Confirmas que recibiste el paquete en buenas condiciones?')) return;
        try {
            await api.post(`/api/store/orders/${orderId}/receive`);
            alert('¡Excelente! El pago ha sido liberado al comercio.');
            setReviewModalData({ orderId });
            fetchOrders();
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) return;

        try {
            await api.delete(`/api/orders/${orderId}`);
            alert('Pedido eliminado correctamente.');
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(`Error al eliminar el pedido: ${error.message}\nIntentando conectar a: ${api.defaults.baseURL}\nEndpoint: /api/orders/${orderId}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusProgress = (status) => {
        const statuses = ['reservado', 'en_preparacion', 'en_transito_a_punto', 'listo_para_entrega', 'enviado', 'completado'];
        const currentIndex = statuses.indexOf(status);
        if (currentIndex === -1) return 20; // Default for unknown
        return ((currentIndex + 1) / statuses.length) * 100;
    };

    // Filtrar pedidos según el estado seleccionado
    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(order => order.status === filterStatus);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl">Cargando tus pedidos...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6">Mis Pedidos (V2)</h1>

            {/* Tipo de Pedidos (TEI vs Tienda Virtual) */}
            <div className="flex gap-4 mb-6 border-b pb-4">
                <button 
                    onClick={() => setOrderType('tei')}
                    className={`text-xl font-bold pb-2 ${orderType === 'tei' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    🏢 Pedidos Corporativos TEI
                </button>
                <button 
                    onClick={() => setOrderType('store')}
                    className={`text-xl font-bold pb-2 ${orderType === 'store' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    🛍️ Tienda Virtual (Comercios Aliados)
                </button>
            </div>

            {orderType === 'tei' ? (
                <>
                    {/* Pestañas de filtro por estado - SIEMPRE VISIBLES */}
                    <div className="mb-6 flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Todos ({orders.length})
                        </button>
                        {Object.entries(statusLabels).map(([status, label]) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {label} ({orders.filter(o => o.status === status).length})
                            </button>
                        ))}
                    </div>
                </>
            ) : null}

            {/* Mensaje cuando NO hay pedidos */}
            {orderType === 'tei' && orders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold mb-2">No tienes pedidos corporativos aún</h2>
                    <p className="text-gray-600 mb-6">Visita nuestra tienda para realizar tu primer pedido</p>
                    <a
                        href="/dashboard/store"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        🛍️ Ir a la Tienda
                    </a>
                </div>
            )}
            
            {orderType === 'store' && storeOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h2 className="text-2xl font-bold mb-2">No has comprado en la Tienda Virtual</h2>
                    <p className="text-gray-600 mb-6">Apoya a nuestros Comercios Aliados</p>
                    <a
                        href="/comercios-virtuales"
                        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        🏢 Ver Directorio de Comercios
                    </a>
                </div>
            )}

            {/* Mensaje si hay pedidos pero ninguno en el filtro actual */}
            {orderType === 'tei' && orders.length > 0 && filteredOrders.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No tienes pedidos en estado "{statusLabels[filterStatus]}"</p>
                </div>
            )}

            {orderType === 'tei' && filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header del pedido */}
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h3 className="text-lg font-semibold">Pedido #{order.id}</h3>
                                <p className="text-sm text-gray-600">
                                    Realizado el {formatDate(order.created_at)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">{formatCurrency(order.total_cop)}</p>
                                <p className="text-sm text-gray-600">{order.total_pv} PV</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado actual */}
                    <div className="px-6 py-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`px-4 py-2 rounded-full font-semibold border-2 ${statusColors[order.status]}`}>
                                {statusLabels[order.status]}
                            </span>
                            <span className="text-sm text-gray-600">
                                {Math.round(getStatusProgress(order.status))}% completado
                            </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${getStatusProgress(order.status)}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-gray-700 mt-2">
                            {statusDescriptions[order.status]}
                        </p>

                        {/* Número de guía si está enviado */}
                        {order.tracking_number && (
                            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm font-medium text-purple-900 mb-1">
                                    📦 Número de Guía
                                </p>
                                <p className="text-lg font-bold text-purple-700">
                                    {order.tracking_number}
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                    Usa este número para rastrear tu paquete con la transportadora
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Timeline de estados */}
                    <div className="px-6 py-4 border-b">
                        <h4 className="font-semibold mb-3 text-gray-700">Historial del Pedido</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <div>
                                    <p className="font-medium">Pedido Creado</p>
                                    <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                                </div>
                            </div>

                            {order.payment_confirmed_at && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Pago Confirmado</p>
                                        <p className="text-sm text-gray-600">{formatDate(order.payment_confirmed_at)}</p>
                                    </div>
                                </div>
                            )}

                            {order.shipped_at && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Enviado</p>
                                        <p className="text-sm text-gray-600">{formatDate(order.shipped_at)}</p>
                                    </div>
                                </div>
                            )}

                            {order.completed_at && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Entregado</p>
                                        <p className="text-sm text-gray-600">{formatDate(order.completed_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="px-6 py-4">
                        <h4 className="font-semibold mb-3 text-gray-700">Productos</h4>
                        <div className="space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.product_name}</p>
                                        {item.selected_options && (
                                            <p className="text-xs font-semibold text-blue-600 mb-1">
                                                Opción: {Object.entries(JSON.parse(item.selected_options)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div>
                                            <p className="font-medium">{formatCurrency(item.subtotal_cop)}</p>
                                            <p className="text-sm text-gray-600">{item.subtotal_pv} PV</p>
                                        </div>
                                        {order.status === 'completado' && (
                                            <button
                                                onClick={() => setReviewModalData(item)}
                                                className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1.5 rounded-full font-bold shadow-sm transition flex items-center gap-1"
                                            >
                                                <span>⭐</span> Calificar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dirección de envío si existe */}
                    {order.shipping_address && (
                        <div className="px-6 py-4 bg-gray-50">
                            <h4 className="font-semibold mb-2 text-gray-700">Dirección de Envío</h4>
                            <p className="text-sm text-gray-600">{order.shipping_address}</p>
                        </div>
                    )}

                    {/* Botones de acción según el estado */}
                    <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 flex-wrap">
                        {order.status === 'reservado' && (
                            <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium w-full sm:w-auto text-center"
                            >
                                🗑️ Borrar Pedido
                            </button>
                        )}

                        {order.status === 'en_preparacion' && (
                            <div className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-center font-medium">
                                ⏳ En preparación para envío
                            </div>
                        )}

                        {order.status === 'listo_para_entrega' && (
                             <div className="flex-1 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-center font-bold animate-pulse">
                                📍 ¡LISTO PARA ENTREGA! FAVOR PASAR POR ÉL
                             </div>
                        )}

                        {order.status === 'enviado' && order.tracking_number && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(order.tracking_number);
                                    alert(`Número de guía copiado: ${order.tracking_number}`);
                                }}
                                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                            >
                                📦 Copiar Número de Guía
                            </button>
                        )}

                        {order.status === 'completado' && (
                            <div className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-center font-medium">
                                ✅ Pedido recibido y completado
                            </div>
                        )}

                        {/* Botón de ayuda disponible para todos los estados */}
                        <button
                            onClick={() => {
                                alert('Para ayuda, contacta a soporte@tuempresainternacional.com');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                        >
                            ❓ Ayuda
                        </button>
                    </div>
                </div>
            ))}
            
            {orderType === 'store' && storeOrders.map((order) => (
                <div key={`store-${order.id}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Pedido #{order.id} en Tienda Virtual</h3>
                                <p className="text-sm text-gray-600">Comercio: <span className="font-bold">{order.merchant_name}</span></p>
                                <p className="text-sm text-gray-500">Realizado el {formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-green-700">{formatCurrency(order.total_amount_cop + order.shipping_cost_cop)}</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                                    order.status === 'escrow_funded' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {order.status === 'escrow_funded' && 'Pagado (El comercio lo está preparando)'}
                                    {order.status === 'shipped' && 'Enviado'}
                                    {order.status === 'delivered' && 'Entregado (Pago Liberado)'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4">
                        <h4 className="font-semibold mb-3 text-gray-700">Productos del Comercio</h4>
                        <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                    <span>{item.qty}x {item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price)} c/u</span>
                                </div>
                            ))}
                        </div>
                        
                        {order.tracking_number && (
                            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm font-medium text-purple-900 mb-1">📦 Número de Guía (Transportadora)</p>
                                <p className="text-lg font-bold text-purple-700">{order.tracking_number}</p>
                            </div>
                        )}
                        
                        {order.status === 'shipped' && (
                            <div className="mt-6 border-t pt-4">
                                <p className="text-sm text-gray-600 mb-3 text-center">Si ya tienes el paquete en tus manos y todo está perfecto, presiona el botón para liberar el dinero al comercio.</p>
                                <button 
                                    onClick={() => handleReceiveStoreOrder(order.id)}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                                >
                                    ✅ YA RECIBÍ MI PRODUCTO CONFORME
                                </button>
                            </div>
                        )}
                        
                        {order.status === 'delivered' && (
                            <div className="mt-6 border-t pt-4 text-center">
                                <button 
                                    onClick={() => setReviewModalData({ orderId: order.id, merchant_name: order.merchant_name, isStore: true })}
                                    className="px-6 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-full font-bold shadow-sm transition"
                                >
                                    ⭐ Calificar Comercio
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            <ProductReviewModal
                isOpen={!!reviewModalData}
                onClose={() => setReviewModalData(null)}
                orderItem={reviewModalData}
                onReviewSubmitted={fetchOrders}
            />
        </div >
    );
};

export default UserOrders;
