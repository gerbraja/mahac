import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

import AdminPayments from './AdminPayments';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price_usd: 0,
        price_local: 0,
        pv: 0,
        stock: 0,
        weight_grams: 500,
        is_activation: false,
        image_url: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products/');
            setProducts(res.data);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure numeric values are numbers
        const payload = {
            ...formData,
            price_usd: parseFloat(formData.price_usd),
            price_local: parseFloat(formData.price_local || 0),
            pv: parseInt(formData.pv || 0),
            stock: parseInt(formData.stock || 0),
            weight_grams: parseInt(formData.weight_grams || 500)
        };

        try {
            if (editingId) {
                await api.put(`/api/products/${editingId}`, payload);
            } else {
                await api.post('/api/products/', payload);
            }
            setFormData({
                name: '', description: '', category: '', price_usd: 0, price_local: 0, pv: 0, stock: 0, weight_grams: 500, is_activation: false, image_url: ''
            });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error("Error saving product", error);
            const errorMessage = error.response?.data?.detail || error.message || "Error saving product";
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setEditingId(product.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/api/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product", error);
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            <div className="flex gap-4 mb-6 border-b">
                <button
                    className={`pb-2 px-4 ${activeTab === 'products' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
                <button
                    className={`pb-2 px-4 ${activeTab === 'payments' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('payments')}
                >
                    Payment Approvals
                </button>
            </div>

            {activeTab === 'payments' ? (
                <AdminPayments />
            ) : (
                <>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">{editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <input
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Precio (USD)</label>
                                <input
                                    type="number"
                                    name="price_usd"
                                    value={formData.price_usd}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Precio (COP - Opcional)</label>
                                <input
                                    type="number"
                                    name="price_local"
                                    value={formData.price_local}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Puntos (PV)</label>
                                <input
                                    type="number"
                                    name="pv"
                                    value={formData.pv}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Peso (gramos)</label>
                                <input
                                    type="number"
                                    name="weight_grams"
                                    value={formData.weight_grams}
                                    onChange={handleChange}
                                    placeholder="500"
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="https://i.imgur.com/ejemplo.jpg"
                                    className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sube tu imagen a Imgur y pega la URL aquí</p>
                                {formData.image_url && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Vista Previa:</p>
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded border border-gray-300"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <p className="text-xs text-red-500 mt-1" style={{ display: 'none' }}>No se pudo cargar la imagen. Verifica la URL.</p>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
                                <input
                                    type="checkbox"
                                    id="is_activation"
                                    name="is_activation"
                                    checked={formData.is_activation}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_activation" className="text-gray-700 font-medium cursor-pointer">
                                    ¿Es un Producto de Activación? (Paquete de Inicio)
                                </label>
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <button
                                    type="submit"
                                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition shadow-md ${editingId
                                        ? 'bg-yellow-500 hover:bg-yellow-600'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {editingId ? '💾 Actualizar Producto' : '➕ Crear Producto'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({
                                                name: '', description: '', category: '', price_usd: 0, price_local: 0, pv: 0, stock: 0, is_activation: false, image_url: '', weight_grams: 500
                                            });
                                        }}
                                        className="w-full mt-2 py-2 px-4 rounded-lg font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition"
                                    >
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-700">Lista de Productos</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="p-4 border-b">Imagen</th>
                                        <th className="p-4 border-b">Nombre</th>
                                        <th className="p-4 border-b">Categoría</th>
                                        <th className="p-4 border-b">Precio USD</th>
                                        <th className="p-4 border-b">PV</th>
                                        <th className="p-4 border-b text-center">Activación</th>
                                        <th className="p-4 border-b text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                No hay productos registrados aún.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map(p => (
                                            <tr key={p.id} className="hover:bg-blue-50 transition">
                                                <td className="p-4">
                                                    {p.image_url ? (
                                                        <img
                                                            src={p.image_url}
                                                            alt={p.name}
                                                            className="w-16 h-16 object-cover rounded border border-gray-200"
                                                            onError={(e) => {
                                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3E📦%3C/text%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
                                                            📦
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                                <td className="p-4 text-gray-600">
                                                    <span className="bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs">
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-green-600 font-bold">${p.price_usd}</td>
                                                <td className="p-4 text-gray-600">{p.pv}</td>
                                                <td className="p-4 text-center">
                                                    {p.is_activation ? (
                                                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs font-bold">
                                                            SI
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition"
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
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
    );
};

export default AdminDashboard;
