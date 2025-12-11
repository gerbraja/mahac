import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const UserOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const statusLabels = {
        reservado: 'Reservado',
        pendiente_envio: 'Pendiente de Envío',
        enviado: 'Enviado',
        completado: 'Completado'
    };

    const statusColors = {
        reservado: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        pendiente_envio: 'bg-blue-100 text-blue-800 border-blue-300',
        enviado: 'bg-purple-100 text-purple-800 border-purple-300',
        completado: 'bg-green-100 text-green-800 border-green-300'
    };

    const statusDescriptions = {
        reservado: 'Tu pedido está reservado. Completa el pago para continuar.',
        pendiente_envio: 'Pago confirmado. Tu pedido está siendo preparado para envío.',
        enviado: 'Tu pedido ha sido enviado y está en camino.',
        completado: 'Tu pedido ha sido entregado exitosamente.'
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/orders/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
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
        const statuses = ['reservado', 'pendiente_envio', 'enviado', 'completado'];
        const currentIndex = statuses.indexOf(status);
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
            <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>

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

            {/* Mensaje cuando NO hay pedidos */}
            {orders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold mb-2">No tienes pedidos aún</h2>
                    <p className="text-gray-600 mb-6">Visita nuestra tienda para realizar tu primer pedido</p>
                    <a
                        href="/dashboard/store"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        🛍️ Ir a la Tienda
                    </a>
                </div>
            )}

            {/* Mensaje si hay pedidos pero ninguno en el filtro actual */}
            {orders.length > 0 && filteredOrders.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No tienes pedidos en estado "{statusLabels[filterStatus]}"</p>
                </div>
            )}

            {filteredOrders.map((order) => (
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
                                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(item.subtotal_cop)}</p>
                                        <p className="text-sm text-gray-600">{item.subtotal_pv} PV</p>
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
                            <>
                                <button
                                    onClick={() => window.location.href = `/order-confirmation/${order.id}`}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                                >
                                    💳 Proceder al Pago
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
                                            alert('Funcionalidad de eliminación en desarrollo');
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                                >
                                    🗑️ Borrar Pedido
                                </button>
                            </>
                        )}

                        {order.status === 'pendiente_envio' && (
                            <div className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-center font-medium">
                                ⏳ En preparación para envío
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
        </div>
    );
};

export default UserOrders;
