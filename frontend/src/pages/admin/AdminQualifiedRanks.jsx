import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function AdminQualifiedRanks() {
    const [ranks, setRanks] = useState([]);
    const [userRanks, setUserRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('ranks'); // 'ranks' or 'users'

    useEffect(() => {
        fetchRanks();
        fetchUserRanks();
    }, []);

    const fetchRanks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/admin/qualified-ranks');
            setRanks(response.data);
        } catch (err) {
            console.error('Error fetching qualified ranks:', err);
            setError('Error al cargar los rangos de calificación');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRanks = async () => {
        try {
            const response = await api.get('/api/admin/qualified-ranks/users');
            setUserRanks(response.data);
        } catch (err) {
            console.error('Error fetching user qualified ranks:', err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    🏆 Rangos de Calificación
                </h2>
                <p style={{ color: '#6b7280' }}>
                    Gestiona los rangos de calificación basados en Matrix ID completados.
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <button
                    onClick={() => setActiveTab('ranks')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'ranks' ? '#7c3aed' : 'transparent',
                        color: activeTab === 'ranks' ? 'white' : '#6b7280',
                        border: 'none',
                        borderBottom: activeTab === 'ranks' ? '3px solid #7c3aed' : 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    Rangos
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'users' ? '#7c3aed' : 'transparent',
                        color: activeTab === 'users' ? 'white' : '#6b7280',
                        border: 'none',
                        borderBottom: activeTab === 'users' ? '3px solid #7c3aed' : 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    Usuarios con Rangos
                </button>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando...</p>}
            {error && <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>}

            {/* Ranks Table */}
            {!loading && activeTab === 'ranks' && (
                <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Matrix ID Requerido</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Recompensa</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Límite Mensual</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Límite Anual</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Usuarios</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranks.map((rank, index) => (
                                <tr
                                    key={rank.id}
                                    style={{
                                        borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                                    }}
                                >
                                    <td style={{ padding: '1rem', fontWeight: '500', color: '#1e3a8a' }}>{rank.name}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>{rank.matrix_id_required.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>{formatCurrency(rank.reward_amount)}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>{rank.monthly_limit || '-'}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>{rank.yearly_limit || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: '#dbeafe',
                                            color: '#1e40af',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {rank.users_achieved}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ranks.length === 0 && (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            No hay rangos de calificación configurados.
                        </p>
                    )}
                </div>
            )}

            {/* User Ranks Table */}
            {!loading && activeTab === 'users' && (
                <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Usuario</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Rango</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Fecha Logro</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Recompensa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userRanks.map((ur, index) => (
                                <tr
                                    key={`${ur.user_id}-${ur.rank_id}`}
                                    style={{
                                        borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                                    }}
                                >
                                    <td style={{ padding: '1rem', fontWeight: '500', color: '#1e3a8a' }}>{ur.user_name}</td>
                                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{ur.user_email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: '#f3e8ff',
                                            color: '#7c3aed',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {ur.rank_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#6b7280' }}>{formatDate(ur.achieved_at)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: ur.reward_granted ? '#d1fae5' : '#fee2e2',
                                            color: ur.reward_granted ? '#065f46' : '#991b1b',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {ur.reward_granted ? '✓ Otorgada' : '✗ Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {userRanks.length === 0 && (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            Ningún usuario ha alcanzado rangos de calificación aún.
                        </p>
                    )}
                </div>
            )}

            {/* Back Button */}
            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => window.location.href = '/admin'}
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
                    ← Volver al Panel
                </button>
            </div>
        </div>
    );
}
