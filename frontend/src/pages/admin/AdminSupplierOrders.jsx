import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Archive, RefreshCw, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const AdminSupplierOrders = () => {
    const { globalCountry } = useAdmin();
    const [supplierGroups, setSupplierGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingIds, setProcessingIds] = useState([]);

    const fetchSupplierOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const queryParams = new URLSearchParams();
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const response = await axios.get(`${baseUrl}/api/admin/supplier-orders?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSupplierGroups(response.data);
        } catch (err) {
            console.error('Error fetching supplier orders:', err);
            setError('Error al cargar los pedidos de fabricantes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierOrders();
    }, [globalCountry]);

    const handleArchiveItems = async (supplierId, orderItemIds) => {
        if (!window.confirm(`¿Estás seguro de archivar y marcar estos productos como "solicitados al fabricante"?`)) {
            return;
        }

        setProcessingIds(prev => [...prev, supplierId]);

        try {
            const token = localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await axios.post(`${baseUrl}/api/admin/supplier-orders/archive`,
                { order_item_ids: orderItemIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refetch after successful archive
            fetchSupplierOrders();
            alert('Productos marcados como enviados al fabricante exitosamente.');
        } catch (err) {
            console.error('Error archiving items:', err);
            alert('Hubo un error al archivar los productos.');
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== supplierId));
        }
    };

    if (loading && supplierGroups.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Reporte Diario para Fabricantes
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Visualiza los productos vendidos pendientes por solicitar a los fabricantes/proveedores.
                    </p>
                </div>
                <button
                    onClick={fetchSupplierOrders}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                    <span className="font-medium">Error:</span> {error}
                </div>
            )}

            {supplierGroups.length === 0 && !loading && !error ? (
                <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">¡Todo al día!</h3>
                    <p className="text-gray-500">
                        No hay productos pendientes por solicitar a los fabricantes en este momento.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {supplierGroups.map((group) => {
                        // Gather all order_item_ids for this supplier to archive them all at once
                        const allSupplierItemIds = group.products.flatMap(p => p.order_item_ids);
                        const isProcessing = processingIds.includes(group.supplier_id);

                        return (
                            <div key={group.supplier_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-800">
                                        Proveedor: <span className="text-blue-600">{group.supplier_name}</span>
                                    </h2>
                                    <button
                                        onClick={() => handleArchiveItems(group.supplier_id, allSupplierItemIds)}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isProcessing
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Archive className="w-4 h-4" />
                                        )}
                                        {isProcessing ? 'Procesando...' : 'Marcar como Solicitado (Archivar)'}
                                    </button>
                                </div>

                                {/* Products List */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {group.products.map((product) => (
                                            <div key={product.product_id} className="bg-white border text-center border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="aspect-square w-full rounded-md bg-gray-50 flex items-center justify-center overflow-hidden mb-4 border border-gray-100">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="w-12 h-12 text-gray-300" />
                                                    )}
                                                </div>

                                                <h3 className="font-medium text-gray-800 line-clamp-2 min-h-[40px] mb-1" title={product.product_name}>
                                                    {product.product_name}
                                                </h3>

                                                {product.selected_options && (
                                                    <p className="text-sm font-semibold text-blue-600 mb-2">
                                                        Opción: {Object.entries(JSON.parse(product.selected_options)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                    </p>
                                                )}

                                                {product.sku && (
                                                    <p className="text-xs text-gray-500 mb-3">Ref: {product.sku}</p>
                                                )}

                                                <div className="bg-blue-50 text-blue-700 py-2 px-4 rounded-md font-bold text-lg inline-flex items-center gap-2">
                                                    <span>x{product.total_quantity}</span>
                                                    <span className="text-sm font-normal text-blue-600">vendidos</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminSupplierOrders;
