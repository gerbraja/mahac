import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const PersonalView = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
                setFormData(response.data);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        try {
            await api.put('/auth/profile', formData);
            setUser(formData);
            setEditing(false);
            alert('Perfil actualizado exitosamente');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('Error al actualizar el perfil');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando perfil...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500">Error al cargar perfil</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent mb-2">
                        👤 Información Personal
                    </h1>
                    <p className="text-gray-600">Gestiona tu información de perfil</p>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                    >
                        ✏️ Editar
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
                        >
                            💾 Guardar
                        </button>
                        <button
                            onClick={() => {
                                setEditing(false);
                                setFormData(user);
                            }}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-300"
                        >
                            ✕ Cancelar
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">{user.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900 text-lg font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de Usuario</label>
                        <p className="text-gray-900 text-lg font-medium">{user.username}</p>
                        <p className="text-xs text-gray-500 mt-1">El username no se puede cambiar</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                        {editing ? (
                            <input
                                type="tel"
                                value={formData.phone_number || ''}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">{user.phone_number || 'No especificado'}</p>
                        )}
                    </div>

                    {/* Document ID */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Documento de Identidad</label>
                        <p className="text-gray-900 text-lg font-medium">{user.document_id || 'No especificado'}</p>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                        {editing ? (
                            <select
                                value={formData.gender || ''}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccionar</option>
                                <option value="male">Masculino</option>
                                <option value="female">Femenino</option>
                                <option value="other">Otro</option>
                            </select>
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">
                                {user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Femenino' : user.gender || 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Birth Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento</label>
                        <p className="text-gray-900 text-lg font-medium">
                            {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'No especificado'}
                        </p>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">País</label>
                        <p className="text-gray-900 text-lg font-medium">{user.country || 'No especificado'}</p>
                    </div>

                    {/* Full Address */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Completa</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.full_address || ''}
                                onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">{user.full_address || 'No especificado'}</p>
                        )}
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ciudad</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">{user.city || 'No especificado'}</p>
                        )}
                    </div>

                    {/* Province */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia/Estado</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.province || ''}
                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <p className="text-gray-900 text-lg font-medium">{user.province || 'No especificado'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Información de Cuenta</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Estado</p>
                        <p className="text-lg font-bold text-green-600">{user.status === 'active' ? 'Activo' : 'Pre-Afiliado'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Rango</p>
                        <p className="text-lg font-bold text-blue-600">{user.rank || 'Nuevo'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Miembro desde</p>
                        <p className="text-lg font-bold text-gray-800">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalView;
