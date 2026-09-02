import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminCountryManagers() {
    const { isSuperAdmin, countries } = useAdmin();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    // Assignment state
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCountries, setSelectedCountries] = useState([]); // Array of countries

    useEffect(() => {
        if (isSuperAdmin) {
            fetchManagers();
        }
    }, [isSuperAdmin]);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/users?role=country_admin');
            setManagers(response.data);
            setMessage('');
        } catch (error) {
            console.error('Error fetching managers:', error);
            setMessage('Error al cargar la lista de gerentes.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setSearching(true);
        try {
            const response = await api.get(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data);
            if (response.data.length === 0) {
                setMessage('No se encontraron usuarios con esa búsqueda.');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            setMessage('Error al buscar usuarios.');
        } finally {
            setSearching(false);
        }
    };

    const toggleCountrySelection = (country) => {
        setSelectedCountries(prev => 
            prev.includes(country) 
                ? prev.filter(c => c !== country)
                : [...prev, country]
        );
    };

    const handleAssignManager = async (e) => {
        e.preventDefault();
        if (!selectedUser || selectedCountries.length === 0) {
            setMessage('Debe seleccionar un usuario y al menos un país.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            await api.put(`/api/admin/users/${selectedUser.id}`, {
                ...selectedUser,
                admin_role: 'country_admin',
                admin_country: selectedCountries.join(',')
            });
            
            setMessage(`¡Usuario ${selectedUser.username} nombrado como gerente de ${selectedCountries.join(', ')}!`);
            setShowModal(false);
            resetModal();
            fetchManagers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error assigning manager:', error);
            setMessage('Error al nombrar gerente.');
        }
    };

    const handleRevoke = async (manager) => {
        if (!window.confirm(`¿Estás seguro de revocar el cargo de Gerente de País a ${manager.name}? Perderá el acceso al Panel de Administración.`)) {
            return;
        }

        try {
            await api.put(`/api/admin/users/${manager.id}`, {
                ...manager,
                admin_role: 'user',
                admin_country: ''
            });
            
            setMessage(`Cargo revocado a ${manager.name}`);
            fetchManagers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error revoking manager:', error);
            setMessage('Error al revocar cargo.');
        }
    };

    const resetModal = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setSelectedCountries([]);
    };

    if (!isSuperAdmin) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#dc2626' }}>Acceso Denegado</h2>
                <p>Solo el Super Admin puede acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                    👨‍💼 Gerentes de País
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        background: '#2563eb',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span>➕</span> Nombrar / Editar Gerente
                </button>
            </div>

            {message && (
                <div style={{ padding: '1rem', marginBottom: '1rem', background: '#dbeafe', color: '#1e40af', borderRadius: '0.5rem' }}>
                    {message}
                </div>
            )}

            {loading ? (
                <div>Cargando gerentes...</div>
            ) : managers.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No hay gerentes asignados actualmente.</p>
                </div>
            ) : (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Usuario</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569' }}>Países Asignados</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#475569' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managers.map(manager => (
                                <tr key={manager.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>{manager.name}</td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>@{manager.username}</td>
                                    <td style={{ padding: '1rem' }}>{manager.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {(manager.admin_country || 'Desconocido').split(',').map(c => c.trim()).filter(c => c).map((c, i) => (
                                                <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(manager);
                                                setSelectedCountries((manager.admin_country || '').split(',').map(c => c.trim()).filter(c => c));
                                                setShowModal(true);
                                            }}
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#3b82f6',
                                                border: '1px solid #cbd5e1',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontWeight: '500',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleRevoke(manager)}
                                            style={{
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontWeight: '500',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Revocar Todo
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Nuevo/Editar Gerente */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '0.5rem',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedUser && selectedCountries.length > 0 ? 'Editar Países de Gerente' : 'Nombrar Nuevo Gerente'}</h2>
                            <button onClick={() => { setShowModal(false); resetModal(); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {!selectedUser ? (
                            <div>
                                <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, usuario o email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                                    />
                                    <button type="submit" disabled={searching} style={{ padding: '0.75rem 1.5rem', background: '#e5e7eb', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                        {searching ? 'Buscando...' : 'Buscar'}
                                    </button>
                                </form>

                                {searchResults.length > 0 && (
                                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                        {searchResults.map(user => (
                                            <div key={user.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: user.admin_role === 'country_admin' ? '#f3f4f6' : 'white' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{user.name} <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(@{user.username})</span></div>
                                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
                                                    {user.admin_role === 'country_admin' && <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>Ya es gerente de {user.admin_country}</div>}
                                                    {user.admin_role === 'superadmin' && <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '0.25rem' }}>Es Super Admin</div>}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedCountries(user.admin_role === 'country_admin' && user.admin_country ? user.admin_country.split(',').map(c => c.trim()).filter(c=>c) : []);
                                                    }}
                                                    disabled={user.admin_role === 'superadmin'}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: user.admin_role === 'superadmin' ? '#e5e7eb' : '#3b82f6',
                                                        color: user.admin_role === 'superadmin' ? '#9ca3af' : 'white',
                                                        border: 'none',
                                                        borderRadius: '0.25rem',
                                                        cursor: user.admin_role === 'superadmin' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Seleccionar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleAssignManager}>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Usuario Seleccionado:</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedUser.name}</div>
                                    <div style={{ color: '#64748b' }}>{selectedUser.email}</div>
                                    <button type="button" onClick={() => {setSelectedUser(null); setSelectedCountries([]);}} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}>
                                        Cambiar usuario
                                    </button>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Seleccionar Países a Administrar:</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#f9fafb' }}>
                                        {countries.filter(c => c !== 'Todos').map(c => (
                                            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCountries.includes(c)}
                                                    onChange={() => toggleCountrySelection(c)}
                                                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                                />
                                                {c}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => { setShowModal(false); resetModal(); }} style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={selectedCountries.length === 0} style={{ padding: '0.75rem 1.5rem', background: selectedCountries.length > 0 ? '#10b981' : '#a7f3d0', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: selectedCountries.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                        Confirmar Cambios
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
