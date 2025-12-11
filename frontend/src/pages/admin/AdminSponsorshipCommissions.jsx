import { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function AdminSponsorshipCommissions() {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchCommissions();
    }, [filter]);

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await api.get(`/api/admin/sponsorship-commissions${params}`);
            setCommissions(response.data);
        } catch (error) {
            console.error('Error fetching commissions:', error);
            setMessage('Error al cargar las comisiones');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (commissionId, newStatus) => {
        try {
            await api.put(`/api/admin/sponsorship-commissions/${commissionId}/status?status=${newStatus}`);
            setMessage(`Comisión marcada como ${newStatus}`);
            fetchCommissions();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error al actualizar el estado');
            console.error(error);
        }
    };

    const totalPending = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0);

    const totalPaid = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0);

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    💰 Comisiones de Patrocinio Directo
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Comisiones de $9.7 USD pagadas al patrocinador directo cuando un nuevo miembro compra un paquete de activación
                </p>
            </div>

            {/* Statistics Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1.5rem', 
                marginBottom: '2rem' 
            }}>
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #fbbf24'
                }}>
                    <p style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Comisiones Pendientes
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        ${totalPending.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                        {commissions.filter(c => c.status === 'pending').length} pendientes
                    </p>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #10b981'
                }}>
                    <p style={{ color: '#065f46', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Comisiones Pagadas
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                        ${totalPaid.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#065f46' }}>
                        {commissions.filter(c => c.status === 'paid').length} pagadas
                    </p>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #3b82f6'
                }}>
                    <p style={{ color: '#1e40af', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Total General
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        ${(totalPending + totalPaid).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                        {commissions.length} comisiones
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e5e7eb'
            }}>
                {['all', 'pending', 'paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: filter === status ? '#1e3a8a' : 'transparent',
                            color: filter === status ? 'white' : '#6b7280',
                            border: 'none',
                            borderBottom: filter === status ? '3px solid #1e3a8a' : 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendientes' : 'Pagadas'}
                    </button>
                ))}
            </div>

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

            {/* Commissions Table */}
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
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Patrocinador</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nuevo Miembro</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Paquete</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Comisión</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
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
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No hay comisiones de patrocinio registradas
                                </td>
                            </tr>
                        ) : (
                            commissions.map((comm) => (
                                <tr key={comm.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{comm.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{comm.sponsor_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{comm.sponsor_email}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{comm.new_member_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{comm.new_member_email}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>${comm.package_amount.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#10b981' }}>
                                        ${comm.commission_amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: 
                                                comm.status === 'paid' ? '#d1fae5' : 
                                                comm.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                            color: 
                                                comm.status === 'paid' ? '#065f46' : 
                                                comm.status === 'pending' ? '#92400e' : '#dc2626'
                                        }}>
                                            {comm.status === 'paid' ? '✓ Pagada' : 
                                             comm.status === 'pending' ? '⏳ Pendiente' : '✗ Cancelada'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        {new Date(comm.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {comm.status === 'pending' && (
                                            <button
                                                onClick={() => updateStatus(comm.id, 'paid')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ✓ Marcar como Pagada
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
