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
            console.error('Error response:', error.response);

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

    const handleDelete = async (user) => {
        const confirmMsg = `⚠️ ¿Desea BORRAR este usuario?

Nombre: ${user.name}
Usuario: ${user.username}
Email: ${user.email}

❌ Esta acción NO se puede deshacer.`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            await api.delete(`/api/admin/users/${user.id}`);
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

    const handlePinReset = async (user) => {
        const newPin = window.prompt(`Ingresa el nuevo PIN de transacciones (6 dígitos) para ${user.name}:`);
        if (newPin === null) return; // Cancelled
        if (!newPin.match(/^\d{6}$/)) {
            alert("El PIN debe ser exactamente 6 dígitos numéricos.");
            return;
        }

        try {
            const response = await api.put(`/api/admin/users/${user.id}/reset-transaction-pin`, { new_pin: newPin });
            alert(`PIN de transacciones actualizado exitosamente para ${user.name}.\nNuevo PIN: ${newPin}`);
        } catch (error) {
            alert(error.response?.data?.detail || "Error al actualizar el PIN de transacciones");
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1rem' }}>
                    Gestión de Usuarios
                </h2>

                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o usuario..."
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        🔍 Buscar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            fetchUsers('');
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Limpiar
                    </button>
                </form>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: '0.5rem',
                        background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                        color: message.includes('Error') ? '#dc2626' : '#065f46',
                        border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#6ee7b7'}`
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Usuario</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Documento</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    Cargando...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{user.id}</td>
                                    <td style={{ padding: '1rem' }}>{user.name}</td>
                                    <td style={{ padding: '1rem' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>{user.username || '-'}</td>
                                    <td style={{ padding: '1rem' }}>{user.document_id || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.875rem',
                                            background: user.status === 'active' ? '#d1fae5' : '#fef3c7',
                                            color: user.status === 'active' ? '#065f46' : '#92400e'
                                        }}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => handlePasswordReset(user)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#8b5cf6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            🔑 Clave
                                        </button>
                                        <button
                                            onClick={() => handlePinReset(user)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            🔢 PIN
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            disabled={user.is_admin}
                                            title={
                                                user.is_admin
                                                    ? 'No se puede eliminar un administrador'
                                                    : 'Eliminar usuario'
                                            }
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: user.is_admin ? '#d1d5db' : '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                cursor: user.is_admin ? 'not-allowed' : 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            🗑️ Borrar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1.5rem' }}>
                            Editar Usuario: {editingUser.name}
                        </h3>

                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Documento de Identidad
                                </label>
                                <input
                                    type="text"
                                    value={formData.document_id}
                                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.5rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                        Provincia
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.province}
                                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.5rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Código Postal
                                </label>
                                <input
                                    type="text"
                                    value={formData.postal_code}
                                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Estado del Usuario
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem',
                                        background: 'white'
                                    }}
                                >
                                    <option value="pre-affiliate">Pre-Afiliado (Inactivo)</option>
                                    <option value="active">Activo</option>
                                    <option value="suspended">Suspendido</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Guardar Cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
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
