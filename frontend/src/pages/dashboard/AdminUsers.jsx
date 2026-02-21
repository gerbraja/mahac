import { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (searchQuery = '') => {
        setLoading(true);
        try {
            const params = searchQuery ? `?search=${searchQuery}` : '';
            const response = await api.get(`/api/admin/users${params}`);
            setUsers(response.data);
            setMessage(''); // Clear any previous error messages
        } catch (error) {
            console.error('Error fetching users:', error);

            if (error.response?.status === 401) {
                setMessage('Error: No estás autenticado. Por favor, inicia sesión nuevamente.');
            } else if (error.response?.status === 403) {
                setMessage('Error: No tienes permisos de administrador.');
            } else if (error.response?.data?.detail) {
                setMessage(`Error: ${error.response.data.detail}`);
            } else {
                setMessage('Error al cargar usuarios. Por favor, verifica tu conexión.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            document_id: user.document_id || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            province: user.province || '',
            postal_code: user.postal_code || '',
            status: user.status || 'pre-affiliate'
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/users/${editingUser.id}`, formData);
            setMessage('Usuario actualizado exitosamente');
            setEditingUser(null);
            fetchUsers(search);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al actualizar usuario');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await api.delete(`/api/admin/users/${userId}`);
            setMessage('Usuario eliminado exitosamente');
            fetchUsers(search);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al eliminar usuario';
            setMessage(errorMsg);
            alert('Error: ' + errorMsg);
        }
    };

    const handlePasswordReset = async (user) => {
        const newPassword = window.prompt(`Ingresa la nueva contraseña para ${user.name}:`);
        if (newPassword === null) return; // Cancelled
        if (newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            await api.put(`/api/admin/users/${user.id}/reset-password`, { newPassword });
            alert(`Contraseña actualizada exitosamente para ${user.name}`);
        } catch (error) {
            alert(error.response?.data?.detail || "Error al actualizar la contraseña");
        }
    };

    const handleToggleKYC = async (user) => {
        const newStatus = !user.is_kyc_verified;
        if (!window.confirm(`¿Estás seguro de ${newStatus ? 'VERIFICAR' : 'INVALIDAR'} el KYC de ${user.name}?`)) {
            return;
        }

        try {
            await api.put(`/api/admin/users/${user.id}/kyc`, { is_verified: newStatus });
            setMessage(`KYC ${newStatus ? 'verificado' : 'invalidado'} para ${user.name}`);
            // Update local state to avoid full reload
            setUsers(users.map(u => u.id === user.id ? { ...u, is_kyc_verified: newStatus } : u));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.detail || "Error al cambiar estado KYC");
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                    Gestión de Usuarios
                </h2>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o usuario..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        🔍 Buscar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            fetchUsers('');
                        }}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                        Limpiar
                    </button>
                </form>

                {message && (
                    <div className={`p-4 mb-4 rounded-lg border ${message.includes('Error')
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">ID</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Nombre</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Email</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Usuario</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Documento</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">KYC</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Estado</th>
                                <th className="p-4 border-b border-gray-200 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">{user.id}</td>
                                        <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                        <td className="p-4 text-gray-600">{user.email}</td>
                                        <td className="p-4 text-gray-600">{user.username || '-'}</td>
                                        <td className="p-4 text-gray-600">{user.document_id || '-'}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggleKYC(user)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${user.is_kyc_verified
                                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                title="Click para cambiar estado"
                                            >
                                                {user.is_kyc_verified ? 'Verificado' : 'No Verificado'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => handlePasswordReset(user)}
                                                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium"
                                            >
                                                🔑 Clave
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
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

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-blue-900">
                                Editar Usuario: {editingUser.name}
                            </h3>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Documento de Identidad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.document_id}
                                        onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Provincia
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.province}
                                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código Postal
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postal_code}
                                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado del Usuario
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="pre-affiliate">Pre-Afiliado (Inactivo)</option>
                                    <option value="active">Activo</option>
                                    <option value="suspended">Suspendido</option>
                                </select>
                            </div>

                            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
