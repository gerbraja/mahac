import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { motion } from 'framer-motion';

export default function AdminPickupPoints() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPoints();
    }, []);

    const fetchPoints = async () => {
        try {
            // Fetch ALL points (active and inactive if we implemented that filter, currently API returns active by default or all)
            // Ideally backend should have a param, but for now we fetch what we have.
            const res = await api.get('/api/pickup-points/?active_only=false');
            setPoints(res.data);
        } catch (err) {
            setError("Error al cargar puntos de recogida");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.address || !formData.city) {
            setError("Todos los campos son obligatorios");
            return;
        }

        try {
            if (editingId) {
                // Update
                const res = await api.put(`/api/pickup-points/${editingId}`, formData);
                setPoints(points.map(p => p.id === editingId ? res.data : p));
                setEditingId(null);
            } else {
                // Create
                const res = await api.post('/api/pickup-points/', formData);
                setPoints([...points, res.data]);
            }
            // Reset Form
            setFormData({ name: '', address: '', city: '' });
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este punto?")) return;
        try {
            await api.delete(`/api/pickup-points/${id}`);
            setPoints(points.filter(p => p.id !== id));
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    const handleEdit = (point) => {
        setFormData({
            name: point.name,
            address: point.address,
            city: point.city
        });
        setEditingId(point.id);
    };

    const handleCancel = () => {
        setFormData({ name: '', address: '', city: '' });
        setEditingId(null);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">📍 Gestión de Puntos de Recogida</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Column */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">{editingId ? 'Editar Punto' : 'Nuevo Punto'}</h2>

                    {error && <p className="text-red-500 mb-4 bg-red-50 p-2 rounded">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre del Lugar</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                placeholder="Ej: Sede Principal"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                placeholder="Ej: Bogotá"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                placeholder="Ej: Calle 123 # 45-67"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className={`flex-1 py-2 px-4 rounded text-white font-bold ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {editingId ? 'Actualizar' : 'Crear Punto'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Column */}
                <div className="space-y-4">
                    {loading ? <p>Cargando...</p> : (
                        points.length === 0 ? <p className="text-gray-500">No hay puntos registrados.</p> : (
                            points.map(point => (
                                <motion.div
                                    key={point.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-bold text-gray-800">{point.name}</h3>
                                        <p className="text-sm text-gray-600">{point.address}</p>
                                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                            {point.city}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(point)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(point.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
