import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price_usd: 0,
        price_local: 0,
        pv: 0,
        stock: 0,
        is_activation: false
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products/');
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
        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, formData);
            } else {
                await api.post('/products/', formData);
            }
            setFormData({
                name: '', description: '', category: '', price_usd: 0, price_local: 0, pv: 0, stock: 0, is_activation: false
            });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error("Error saving product", error);
            alert("Error saving product");
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setEditingId(product.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product", error);
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard - Product Management</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
                <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="border p-2 rounded" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded col-span-2" />
                <input type="number" name="price_usd" value={formData.price_usd} onChange={handleChange} placeholder="Price USD" className="border p-2 rounded" required />
                <input type="number" name="price_local" value={formData.price_local} onChange={handleChange} placeholder="Price COP" className="border p-2 rounded" />
                <input type="number" name="pv" value={formData.pv} onChange={handleChange} placeholder="PV" className="border p-2 rounded" />
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" className="border p-2 rounded" />
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="is_activation" checked={formData.is_activation} onChange={handleChange} />
                    Is Activation Product?
                </label>
                <button type="submit" className="bg-blue-600 text-white p-2 rounded col-span-2">
                    {editingId ? 'Update Product' : 'Create Product'}
                </button>
            </form>

            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-3">Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price USD</th>
                            <th className="p-3">Activation</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{p.name}</td>
                                <td className="p-3">{p.category}</td>
                                <td className="p-3">${p.price_usd}</td>
                                <td className="p-3">{p.is_activation ? '✅' : '❌'}</td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
