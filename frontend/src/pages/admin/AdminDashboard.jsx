import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: '-',
        activeUsers: '-',
        totalProducts: '-',
        pendingPayments: '-'
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [activationData, setActivationData] = useState({ userId: '', packageAmount: '100' });
    const [activating, setActivating] = useState(false);
    const [activationResult, setActivationResult] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
            const [usersRes, productsRes, paymentsRes] = await Promise.allSettled([
                api.get('/api/admin/users'),
                api.get('/api/products/'),
                api.get('/api/admin/pending-payments')
            ]);

            const newStats = { ...stats };

            if (usersRes.status === 'fulfilled') {
                const users = usersRes.value.data;
                newStats.totalUsers = users.length;
                newStats.activeUsers = users.filter(u => u.status === 'active').length;
            } else {
                console.error("Error fetching users for stats:", usersRes.reason);
            }

            if (productsRes.status === 'fulfilled') {
                newStats.totalProducts = productsRes.value.data.length;
            } else {
                console.error("Error fetching products for stats:", productsRes.reason);
            }

            if (paymentsRes.status === 'fulfilled') {
                newStats.pendingPayments = paymentsRes.value.data.length;
            } else {
                console.error("Error fetching payments for stats:", paymentsRes.reason);
            }

            setStats(newStats);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStatsError("Error loading statistics");
        } finally {
            setLoadingStats(false);
        }
    };

    const handleActivateUser = async () => {
        if (!activationData.userId) {
            alert('Por favor ingresa el ID del usuario');
            return;
        }

        setActivating(true);
        setActivationResult(null);

        try {
            const response = await api.post('/api/admin/activate-user', {
                user_id: parseInt(activationData.userId),
                package_amount: parseFloat(activationData.packageAmount)
            });

            setActivationResult({
                success: true,
                message: response.data.message,
                data: response.data
            });

            // Refresh stats
            fetchStats();
        } catch (error) {
            setActivationResult({
                success: false,
                message: error.response?.data?.detail || 'Error al activar usuario'
            });
        } finally {
            setActivating(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    Bienvenido al Panel de Administración
                </h2>
                <p style={{ color: '#6b7280' }}>
                    Gestiona usuarios, productos y pagos desde aquí.
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Usuarios</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>{stats.totalUsers}</p>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>👥</div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Productos</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>{stats.totalProducts}</p>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>📦</div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pagos Pendientes</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingPayments}</p>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>💳</div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Usuarios Activos</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.activeUsers}</p>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>✅</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1rem' }}>
                    Acciones Rápidas
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowActivationModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        ✅ Activar Usuario
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/users'}
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
                        👥 Gestionar Usuarios
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/products'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        📦 Gestionar Productos
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/payments'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        💳 Ver Pagos Pendientes
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/qualified-ranks'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        🏆 Rangos de Calificación
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/honor-ranks'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        💎 Rangos de Honor
                    </button>
                </div>
            </div>

            {/* Activation Modal */}
            {showActivationModal && (
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
                        borderRadius: '1rem',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1.5rem' }}>
                            Activar Usuario Manualmente
                        </h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                                ID del Usuario
                            </label>
                            <input
                                type="number"
                                value={activationData.userId}
                                onChange={(e) => setActivationData({ ...activationData, userId: e.target.value })}
                                placeholder="Ej: 2"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Monto del Paquete (USD)
                            </label>
                            <input
                                type="number"
                                value={activationData.packageAmount}
                                onChange={(e) => setActivationData({ ...activationData, packageAmount: e.target.value })}
                                placeholder="100"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {activationResult && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                background: activationResult.success ? '#d1fae5' : '#fee2e2',
                                border: `1px solid ${activationResult.success ? '#10b981' : '#ef4444'}`,
                                color: activationResult.success ? '#065f46' : '#991b1b'
                            }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{activationResult.message}</p>
                                {activationResult.success && activationResult.data && (
                                    <div style={{ fontSize: '0.875rem' }}>
                                        <p>Membresía: {activationResult.data.membership_code}</p>
                                        <p>Comisiones generadas: {activationResult.data.total_commissions_generated}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowActivationModal(false);
                                    setActivationResult(null);
                                    setActivationData({ userId: '', packageAmount: '100' });
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
                                Cerrar
                            </button>
                            <button
                                onClick={handleActivateUser}
                                disabled={activating}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: activating ? '#9ca3af' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: activating ? 'not-allowed' : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {activating ? 'Activando...' : 'Activar Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
