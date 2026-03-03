import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminUsers() {
    const { globalCountry, isSuperAdmin, countries } = useAdmin();
    const [users, setUsers] = useState([]);
    const [countryStats, setCountryStats] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchCountryStats();
    }, [globalCountry]);

    const fetchCountryStats = async () => {
        try {
            const response = await api.get('/api/admin/users/stats/countries');
            setCountryStats(response.data);
        } catch (error) {
            console.error('Error fetching country stats:', error);
        }
    };

    const fetchUsers = async (searchQuery = '') => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const response = await api.get(`/api/admin/users?${queryParams.toString()}`);
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
            status: user.status || 'pre-affiliate',
            package_level: user.package_level || 0,
            admin_role: user.admin_role || 'user',
            admin_country: user.admin_country || ''
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

    const handleImpersonate = async (user) => {
        const confirmMsg = `🕵️‍♂️ MODO IMPERSONACIÓN \n\nEstás a punto de iniciar sesión como: ${user.name} (${user.username})\n\n⚠️ Podrás ver y hacer todo lo que este usuario puede hacer.\n¿Deseas continuar?`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            const response = await api.post(`/api/admin/users/${user.id}/impersonate`);
            const { access_token } = response.data;

            if (access_token) {
                // Logout Current Admin (technically nice to save it but simple replacement is fine for now)
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('userId', user.id); // Fix: Update userId to impersonated user

                // Optional: Save admin token to session storage to "return" later? 
                // For now, simpler is creating a clean session for the user.

                alert(`¡Éxito! Redirigiendo al dashboard de ${user.name}...`);
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error("Impersonation error:", error);
            alert(error.response?.data?.detail || "Error al iniciar sesión como usuario.");
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1rem' }}>
                    Gestión de Usuarios
                </h2>

                {/* Country Stats */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1rem' }}>
                        Estadísticas por País
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {countryStats.map((stat, index) => (
                            <div key={index} style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#334155' }}>{stat.country || 'Sin País'}</div>
                                    <div style={{ fontSize: '0.875rem', color: stat.count >= 500 ? '#16a34a' : '#64748b' }}>
                                        {stat.status}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>{stat.count}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Usuarios</div>
                                </div>
                            </div>
                        ))}
                        {countryStats.length === 0 && !loading && (
                            <div style={{ color: '#64748b', fontStyle: 'italic' }}>No hay datos disponibles</div>
                        )}
                    </div>
                </div>

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
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Paquete</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    Cargando...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
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
                                    <td style={{ padding: '1rem' }}>
                                        {user.package_level ? (
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                background: user.package_level === 3 ? '#fef3c7' : (user.package_level === 2 ? '#e5e7eb' : '#dbeafe'),
                                                color: user.package_level === 3 ? '#b45309' : (user.package_level === 2 ? '#374151' : '#1e40af'),
                                                border: `1px solid ${user.package_level === 3 ? '#fcd34d' : (user.package_level === 2 ? '#d1d5db' : '#93c5fd')}`
                                            }}>
                                                {user.package_level === 1 && 'FDI 1'}
                                                {user.package_level === 2 && 'FDI 2'}
                                                {user.package_level === 3 && 'FDI 3'}
                                                {![1, 2, 3].includes(user.package_level) && `Nivel ${user.package_level}`}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                                        )}
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

                                        {!user.is_admin && (
                                            <button
                                                onClick={() => handleImpersonate(user)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#10b981', // Emerald green
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                                title="Iniciar sesión como este usuario"
                                            >
                                                🕵️‍♂️ Acceder
                                            </button>
                                        )}
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

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                                    Nivel de Paquete (Franquicia)
                                </label>
                                <select
                                    value={formData.package_level || 0}
                                    onChange={(e) => setFormData({ ...formData, package_level: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem',
                                        background: 'white'
                                    }}
                                >
                                    <option value={0}>0 - Sin Paquete / N/A</option>
                                    <option value={1}>1 - Franquicia 1 ($68.7 USD)</option>
                                    <option value={2}>2 - Franquicia 2 / Otro</option>
                                    <option value={3}>3 - Franquicia 3</option>
                                </select>
                                <p style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                    * Define el nivel para cálculo de Upgrades (descuentos).
                                </p>
                            </div>

                            {/* Admin Role Section - only visible to superadmin */}
                            {isSuperAdmin && (
                                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#92400e' }}>
                                        👑 Rol de Administrador
                                    </label>
                                    <select
                                        value={formData.admin_role}
                                        onChange={(e) => setFormData({ ...formData, admin_role: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #fcd34d',
                                            borderRadius: '0.5rem',
                                            background: 'white',
                                            marginBottom: '0.75rem'
                                        }}
                                    >
                                        <option value="user">👤 Usuario Normal (sin rol admin)</option>
                                        <option value="superadmin">🌟 Super Admin (acceso global)</option>
                                        <option value="country_admin">🗺️ Admin por País (acceso restringido)</option>
                                    </select>

                                    {formData.admin_role === 'country_admin' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#92400e' }}>
                                                📍 País Asignado
                                            </label>
                                            <select
                                                value={formData.admin_country}
                                                onChange={(e) => setFormData({ ...formData, admin_country: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #fcd34d',
                                                    borderRadius: '0.5rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="">-- Seleccionar País --</option>
                                                {countries.filter(c => c !== 'Todos').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem' }}>
                                        ⚠️ Cambiar el rol también requiere marcar <strong>is_admin = true</strong> manualmente en la base de datos si el usuario aún no lo es.
                                    </p>
                                </div>
                            )}

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
