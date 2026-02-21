import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
    const [filterProduct, setFilterProduct] = useState(''); // Restored state for product search

    const statusLabels = {
        reservado: 'Reservado',
        pendiente_envio: 'Pendiente de Envío',
        enviado: 'Enviado',
        completado: 'Completado'
    };

    const statusColors = {
        reservado: 'bg-yellow-100 text-yellow-800',
        pendiente_envio: 'bg-blue-100 text-blue-800',
        enviado: 'bg-purple-100 text-purple-800',
        completado: 'bg-green-100 text-green-800'
    };

    const statusDescriptions = {
        reservado: 'Productos agregados, sin pago confirmado',
        pendiente_envio: 'Pago confirmado, en alistamiento',
        enviado: 'Paquete con transportadora',
        completado: 'Entrega confirmada'
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Toggle selection of a single order
    const handleSelectOrder = (orderId) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrderIds(newSelected);
    };

    // Toggle selection of all filtered orders
    const handleSelectAll = (filteredOrders) => {
        if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrderIds(new Set()); // Deselect all
        } else {
            const allIds = new Set(filteredOrders.map(o => o.id));
            setSelectedOrderIds(allIds);
        }
    };

    // Bulk Print Function
    const handleBulkPrint = () => {
        if (selectedOrderIds.size === 0) return alert("Por favor selecciona al menos un pedido.");

        const ordersToPrint = orders.filter(o => selectedOrderIds.has(o.id));

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor permite ventanas emergentes para imprimir.');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Remisiones Masivas (${ordersToPrint.length})</title>
                <style>
                    body { font-family: sans-serif; padding: 0; margin: 0; color: #000; }
                    .remision-page { padding: 40px; box-sizing: border-box; height: 100vh; position: relative; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; }
                    .footer { text-align: center; font-size: 0.8em; margin-top: 40px; }
                    .checkbox { width: 20px; height: 20px; display: inline-block; border: 1px solid #000; margin-right: 10px; }
                    
                    @media print {
                        .remision-page { page-break-after: always; }
                        .no-print { display: none; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="padding: 20px; background: #f0f0f0; text-align: center; border-bottom: 1px solid #ccc;">
                    <h2>Vista Previa de ${ordersToPrint.length} Remisiones</h2>
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 5px;">IMPRIMIR TODO</button>
                </div>

                ${ordersToPrint.map(order => `
                    <div class="remision-page">
                        <div class="header">
                            <h1>ORDEN DE ALISTAMIENTO</h1>
                            <h2>Pedido #${order.id}</h2>
                            <p>Fecha Impresión: ${new Date().toLocaleDateString()}</p>
                            <div style="font-size: 0.8em; margin-top: 5px; color: #555;">
                                <strong>Remitente:</strong> Tu Empresa internacional <br/>
                                <strong>Dirección:</strong> Calle 6 # 8 - 06 Piso 1
                            </div>
                        </div>

                        <div class="info-grid">
                            <div style="border: 2px solid #000; padding: 15px; background: #f9f9f9;">
                                <div class="section-title" style="font-size: 1.2em; border-bottom: 2px solid #000;">DESTINATARIO (Entregar a:)</div>
                                ${(() => {
                let rName = 'Cliente General';
                let rAddress = order.shipping_address || 'No especificada';
                let rCity = '';
                let rPhone = 'N/A';

                if (order.user) {
                    rName = order.user.name || rName;
                    rAddress = order.user.address || rAddress;
                    rCity = (order.user.city || '') + ' ' + (order.user.province || '');
                    rPhone = order.user.phone || rPhone;
                } else if (order.guest_info) {
                    try {
                        const guest = typeof order.guest_info === 'string' ? JSON.parse(order.guest_info) : order.guest_info;
                        rName = guest.name || rName;
                        rPhone = guest.phone || rPhone;
                        // email?
                    } catch (e) {
                        console.error("Error parsing guest_info", e);
                    }
                }

                return `
                                        <p style="font-size: 1.3em; font-weight: bold; margin: 5px 0;">${rName}</p>
                                        <p style="font-size: 1.1em; margin: 5px 0;"><strong>Dirección:</strong> <br/> ${rAddress} <br/> ${rCity}</p>
                                        <p style="font-size: 1.2em; margin: 5px 0;"><strong>Teléfono:</strong> ${rPhone}</p>
                                    `;
            })()}
                            </div>
                            <div>
                                <div class="section-title">DETALLES PEDIDO</div>
                                <p><strong>Estado:</strong> ${order.status}</p>
                                <p><strong>Guía:</strong> ${order.tracking_number || 'Pendiente'}</p>
                                <p><strong>Método:</strong> ${order.payment_method || 'N/A'}</p>
                                <p><strong>Fecha Pedido:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div class="section-title">PRODUCTOS</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Check</th>
                                    <th>Producto</th>
                                    <th style="width: 80px; text-align: center;">Cant.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="text-align: center;"><div class="checkbox"></div></td>
                                        <td>${item.product_name}</td>
                                        <td style="text-align: center; font-weight: bold; font-size: 1.2em;">${item.quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="info-grid" style="margin-top: 40px; border: 1px solid #000; padding: 20px;">
                           <div>
                               <strong>Alistado por:</strong> _________________
                           </div>
                           <div>
                               <strong>Verificado por:</strong> _________________
                           </div>
                        </div>

                        <div class="footer">
                            <p>Centro Comercial TEI - Control Interno</p>
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleValidatePayment = async (orderId) => {
        if (!window.confirm("¿Confirmar que el pago ha sido recibido? Esto validará la orden y calculará comisiones.")) return;

        try {
            const res = await api.post(`/api/orders/${orderId}/confirm-payment`);

            if (res.data.success) {
                alert(`Pago validado. Nuevo estado: ${statusLabels[res.data.new_status]}`);
                fetchOrders();
            }
        } catch (error) {
            console.error("Error confirming payment:", error);
            alert("Error al validar el pago: " + (error.response?.data?.detail || error.message));
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/orders/');
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError(`Error: ${error.message} ${error.response ? '- ' + JSON.stringify(error.response.data) : ''}`);
            setLoading(false);
        }
    };

    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setTrackingNumber(order.tracking_number || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setTrackingNumber('');
    };

    const updateOrderStatus = async () => {
        if (!selectedOrder) return;

        // Validar que se proporcione número de guía para estado "enviado"
        if (newStatus === 'enviado' && !trackingNumber.trim()) {
            alert('El número de guía es requerido para el estado "Enviado"');
            return;
        }

        try {
            await api.put(
                `/api/orders/${selectedOrder.id}/status`,
                {
                    status: newStatus,
                    tracking_number: trackingNumber.trim() || null
                }
            );

            alert('Estado del pedido actualizado exitosamente');
            closeModal();
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert(error.response?.data?.detail || 'Error al actualizar el estado del pedido');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('¿Estás SEGURO de eliminar este pedido? Esta acción es irreversible.')) return;

        try {
            await api.delete(`/api/orders/${orderId}`);
            alert('Pedido eliminado correctamente.');
            if (selectedOrder && selectedOrder.id === orderId) closeModal();
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(`Error al eliminar: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleBulkCleanup = async () => {
        // 7 days in milliseconds
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();

        // Optional: Still do client-side check to give a better confirmation message count
        const ordersToDelete = orders.filter(order => {
            const orderTime = new Date(order.created_at).getTime();
            return order.status === 'reservado' && (now - orderTime > SEVEN_DAYS_MS);
        });

        if (ordersToDelete.length === 0) {
            alert('No se encontraron pedidos "Reservados" con más de 7 días de antigüedad.');
            return;
        }

        if (!window.confirm(`⚠️ ADVERTENCIA ⚠️\n\nSe detectaron ${ordersToDelete.length} pedidos ANTIGUOS (más de 7 días) sin pagar.\n\n¿Deseas ELIMINARLOS todos masivamente? Esta acción NO se puede deshacer.`)) return;

        // Simple loading feedback
        const originalText = document.getElementById('btn-cleanup')?.innerText;
        if (document.getElementById('btn-cleanup')) document.getElementById('btn-cleanup').innerText = 'Eliminando...';

        try {
            const res = await api.delete('/api/orders/cleanup/old');
            if (res.data.success) {
                alert(`Limpieza completada.\n\n✅ Eliminados: ${res.data.deleted_count}`);
            } else {
                alert(`Resultado: ${res.data.message || 'Operación finalizada'}`);
            }
            fetchOrders();
        } catch (error) {
            console.error("Error confirming payment:", error);
            alert("Error al limpiar pedidos: " + (error.response?.data?.detail || error.message));
        } finally {
            if (document.getElementById('btn-cleanup')) document.getElementById('btn-cleanup').innerText = originalText;
        }
    };

    const filteredOrders = orders.filter(order => {
        // 1. Filter by Status
        const matchStatus = filterStatus === 'all' || order.status === filterStatus;

        // 2. Filter by Product Name (if search term exists)
        const matchProduct = filterProduct === '' || order.items.some(item =>
            item.product_name.toLowerCase().includes(filterProduct.toLowerCase())
        );

        return matchStatus && matchProduct;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl">Cargando pedidos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 text-xl font-bold mb-4">⚠️ {error}</div>
                <button
                    onClick={fetchOrders}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>

            {/* Filtros y Acciones Globales */}
            <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-2 flex-wrap">
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

                {selectedOrderIds.size > 0 && (
                    <button
                        onClick={handleBulkPrint}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition font-medium flex items-center gap-2 shadow-sm"
                    >
                        🖨️ Imprimir Seleccionados ({selectedOrderIds.size})
                    </button>
                )}

                <button
                    id="btn-cleanup"
                    onClick={handleBulkCleanup}
                    className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-2"
                >
                    🧹 Limpiar Antiguos {">"}7 días (v2)
                </button>
            </div>

            {/* Buscador de Productos */}
            <div className="mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">🔍</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre de producto (ej: Franquicia)..."
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                    />
                </div>
            </div>

            {/* Tabla de pedidos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        onChange={() => handleSelectAll(filteredOrders)}
                                        checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PV</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método Pago</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número de Guía</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                        No hay pedidos para mostrar
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrderIds.has(order.id)}
                                                onChange={() => handleSelectOrder(order.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.user_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(order.total_cop)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.total_pv} PV
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.payment_method === 'wallet' && '💰 Billetera'}
                                            {order.payment_method === 'bank' && '🏦 Banco'}
                                            {order.payment_method === 'binance' && '🔶 Cripto'}
                                            {(!order.payment_method || order.payment_method === 'other') && '📍 Otro'}
                                            {/* Fallback for old orders if needed, though they default null */}
                                            {!order.payment_method && ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                                {statusLabels[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.tracking_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                {order.status === 'reservado' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleValidatePayment(order.id)}
                                                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded border border-green-200 text-xs"
                                                            title="Validar Pago Manualmente"
                                                        >
                                                            Validar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded border border-red-200 text-xs"
                                                            title="Borrar Pedido"
                                                        >
                                                            Borrar
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => openOrderModal(order)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Gestionar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de gestión de pedido */}
            {
                showModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold">Pedido #{selectedOrder.id}</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Información del pedido */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Usuario ID</p>
                                            <p className="font-semibold">{selectedOrder.user_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total</p>
                                            <p className="font-semibold">{formatCurrency(selectedOrder.total_cop)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">PV Total</p>
                                            <p className="font-semibold">{selectedOrder.total_pv} PV</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Fecha Creación</p>
                                            <p className="font-semibold">{formatDate(selectedOrder.created_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline de estados */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Historial de Estados</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <div>
                                                <p className="text-sm font-medium">Creado</p>
                                                <p className="text-xs text-gray-500">{formatDate(selectedOrder.created_at)}</p>
                                            </div>
                                        </div>
                                        {selectedOrder.payment_confirmed_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <div>
                                                    <p className="text-sm font-medium">Pago Confirmado</p>
                                                    <p className="text-xs text-gray-500">{formatDate(selectedOrder.payment_confirmed_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.shipped_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <div>
                                                    <p className="text-sm font-medium">Enviado</p>
                                                    <p className="text-xs text-gray-500">{formatDate(selectedOrder.shipped_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.completed_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <div>
                                                    <p className="text-sm font-medium">Completado</p>
                                                    <p className="text-xs text-gray-500">{formatDate(selectedOrder.completed_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Productos */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Productos</h3>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
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

                                {/* Cambiar estado */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Actualizar Estado</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nuevo Estado
                                            </label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {Object.entries(statusLabels).map(([status, label]) => (
                                                    <option key={status} value={status}>
                                                        {label} - {statusDescriptions[status]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {(newStatus === 'enviado' || selectedOrder.tracking_number) && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Número de Guía {newStatus === 'enviado' && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    placeholder="Ej: 123456789"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botones de acción y Utilidades */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={updateOrderStatus}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                                        >
                                            Actualizar Estado
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Cancelar
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handlePrintRemision(selectedOrder)}
                                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition font-medium flex justify-center items-center gap-2"
                                    >
                                        🖨️ Imprimir Remisión (Alistamiento)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper function to print packing slip
const handlePrintRemision = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Por favor permite ventanas emergentes para imprimir.');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Remisión de Pedido #${order.id}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: #000; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; }
                .footer { margin-top: 40px; text-align: center; font-size: 0.8em; }
                .checkbox { width: 20px; height: 20px; display: inline-block; border: 1px solid #000; margin-right: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ORDEN DE ALISTAMIENTO (REMISIÓN)</h1>
                <h2>Pedido #${order.id}</h2>
                <p>Fecha: ${new Date().toLocaleDateString()}</p>
                <div style="font-size: 0.8em; margin-top: 5px; color: #555;">
                    <strong>Remitente:</strong> Tu Empresa internacional <br/>
                    <strong>Dirección:</strong> Calle 6 # 8 - 06 Piso 1
                </div>
            </div>

            <div class="info-grid">
                <div style="border: 2px solid #000; padding: 15px; background: #f9f9f9;">
                    <div class="section-title" style="font-size: 1.2em; border-bottom: 2px solid #000;">DESTINATARIO (Entregar a:)</div>
                ${(() => {
            let rName = 'Cliente General';
            let rAddress = order.shipping_address || 'No especificada';
            let rCity = '';
            let rPhone = 'N/A';

            if (order.user) {
                rName = order.user.name || rName;
                rAddress = order.user.address || rAddress;
                rCity = (order.user.city || '') + ' ' + (order.user.province || '');
                rPhone = order.user.phone || rPhone;
            } else if (order.guest_info) {
                try {
                    const guest = typeof order.guest_info === 'string' ? JSON.parse(order.guest_info) : order.guest_info;
                    rName = guest.name || rName;
                    rPhone = guest.phone || rPhone;
                } catch (e) {
                    console.error("Error parsing guest_info", e);
                }
            }

            return `
                        <p style="font-size: 1.3em; font-weight: bold; margin: 5px 0;">${rName}</p>
                        <p style="font-size: 1.1em; margin: 5px 0;"><strong>Dirección:</strong> <br/> ${rAddress} <br/> ${rCity}</p>
                        <p style="font-size: 1.2em; margin: 5px 0;"><strong>Teléfono:</strong> ${rPhone}</p>
                    `;
        })()}
                </div>
                <div>
                    <div class="section-title">DETALLES DE ENVÍO</div>
                    <p><strong>Estado Actual:</strong> ${order.status}</p>
                    <p><strong>Guía:</strong> ${order.tracking_number || 'Pendiente'}</p>
                    <p><strong>Fecha Pedido:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div class="section-title">PRODUCTOS A DESPACHAR</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">Check</th>
                        <th>Producto</th>
                        <th style="width: 80px;">Cant.</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td style="text-align: center;"><div class="checkbox"></div></td>
                            <td>${item.product_name}</td>
                            <td style="text-align: center; font-weight: bold; font-size: 1.2em;">${item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="info-grid" style="margin-top: 20px; border: 1px solid #000; padding: 10px;">
               <div>
                   <strong>Alistado por:</strong> _________________
               </div>
               <div>
                   <strong>Verificado por:</strong> _________________
               </div>
            </div>

            <div class="footer">
                <p>Centro Comercial TEI - Control Interno de Despachos</p>
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer; margin-top: 20px;" class="no-print">IMPRIMIR ESCÁNER</button>
            </div>
            
            <style>
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export default AdminOrders;
