import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { globalCountry } = useAdmin();
    const [stats, setStats] = useState({
        totalUsers: '-',
        activeUsers: '-',
        totalProducts: '-',
        pendingPayments: '-',
        pendingShipments: '-'
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [activationData, setActivationData] = useState({ userId: '', selectedPackage: null });
    const [activating, setActivating] = useState(false);
    const [activationResult, setActivationResult] = useState(null);
    const [activationPackages, setActivationPackages] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    // User search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [pendingOrders, setPendingOrders] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // Store all users for lookup fallback

    useEffect(() => {
        fetchStats();
        fetchActivationPackages();
    }, [globalCountry]);

    const fetchStats = async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
            const queryParams = new URLSearchParams();
            if (globalCountry && globalCountry !== 'Todos') {
                queryParams.append('country', globalCountry);
            }
            const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

            const [usersRes, productsRes, paymentsRes, ordersRes] = await Promise.allSettled([
                api.get(`/api/admin/users${queryStr}`),
                api.get('/api/products/'),
                api.get(`/api/admin/pending-payments${queryStr}`),
                api.get(`/api/orders/${queryStr}`)
            ]);

            const newStats = { ...stats };

            if (usersRes.status === 'fulfilled') {
                const users = usersRes.value.data;
                setAllUsers(users); // Save users for lookup
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

            if (ordersRes.status === 'fulfilled') {
                const orders = ordersRes.value.data;
                const pending = orders.filter(o => o.status === 'pendiente_envio');
                newStats.pendingShipments = pending.length;
                setPendingOrders(pending);
            } else {
                console.error("Error fetching orders for stats:", ordersRes.reason);
            }

            setStats(newStats);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStatsError("Error loading statistics");
        } finally {
            setLoadingStats(false);
        }
    };

    const handlePrintPendingOrders = () => {
        if (pendingOrders.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor permite ventanas emergentes para imprimir.');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Remisiones Pendientes (${pendingOrders.length})</title>
                <style>
                    body { font-family: sans-serif; padding: 0; margin: 0; color: #000; }
                    .remision-page { padding: 40px; box-sizing: border-box; height: 100vh; position: relative; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; }
                    .footer { text-align: center; font-size: 0.8em; margin-top: 40px; }
                    .checkbox { width: 20px; height: 20px; display: inline-block; border: 1px solid #000; margin-right: 10px; }
                    
                    @media print {
                        .remision-page { page-break-after: always; }
                        .no-print { display: none; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="padding: 20px; background: #f0f0f0; text-align: center; border-bottom: 1px solid #ccc;">
                    <h2>Vista Previa de ${pendingOrders.length} Remisiones Pendientes</h2>
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer; background: #ec4899; color: #fff; border: none; border-radius: 5px;">IMPRIMIR TODAS</button>
                </div>

                ${pendingOrders.map(order => `
                    <div class="remision-page">
                        <div class="header">
                            <h1>ORDEN DE ALISTAMIENTO (PENDIENTE)</h1>
                            <h2>Pedido #${order.id}</h2>
                            <p>Fecha Impresión: ${new Date().toLocaleDateString()}</p>
                        </div>

                        <div class="info-grid">
                            <div>
                                <div class="section-title">CLIENTE</div>
                                ${(() => {
                let rName = 'Cliente General';
                let rAddress = order.shipping_address || 'No especificada';
                let rCity = '';
                let rPhone = 'N/A';
                let rId = order.user_id || 'N/A';

                if (order.user) {
                    rName = order.user.name || rName;
                    rAddress = order.user.address || rAddress;
                    rCity = (order.user.city || '') + ' ' + (order.user.province || '');
                    rPhone = order.user.phone || rPhone;
                    if (order.user.document_id) rId = order.user.document_id;
                } else if (order.user_id && allUsers.length > 0) {
                    // FALLBACK: Lookup user in allUsers list
                    const foundUser = allUsers.find(u => u.id === order.user_id);
                    if (foundUser) {
                        rName = foundUser.name || rName;
                        rAddress = foundUser.address || rAddress;
                        rCity = (foundUser.city || '') + ' ' + (foundUser.province || '') + ' ' + (foundUser.postal_code || '');
                        rPhone = foundUser.phone || rPhone;
                        if (foundUser.document_id) rId = foundUser.document_id;
                    }
                } else if (order.guest_info) {
                    try {
                        const guest = typeof order.guest_info === 'string' ? JSON.parse(order.guest_info) : order.guest_info;
                        rName = guest.name || rName;
                        rPhone = guest.phone || rPhone;
                    } catch (e) { console.error(e); }
                }

                return `
                                        <p style="font-size: 1.1em; font-weight: bold; margin: 3px 0;">${rName}</p>
                                        <p style="margin: 3px 0;"><strong>Dirección:</strong> ${rAddress} <br/> ${rCity}</p>
                                        <p style="margin: 3px 0;"><strong>Teléfono:</strong> ${rPhone}</p>
                                    `;
            })()}
                            </div>
                            <div>
                                <div class="section-title">DETALLES</div>
                                <p><strong>Estado:</strong> ${order.status}</p>
                                <p><strong>Guía:</strong> ${order.tracking_number || 'Pendiente'}</p>
                            </div>
                        </div>

                        <div class="section-title">PRODUCTOS</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Check</th>
                                    <th>Producto</th>
                                    <th style="width: 80px; text-align: center;">Cant.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="text-align: center;"><div class="checkbox"></div></td>
                                        <td>${item.product_name}</td>
                                        <td style="text-align: center; font-weight: bold; font-size: 1.2em;">${item.quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="info-grid" style="margin-top: 40px; border: 1px solid #000; padding: 20px;">
                           <div>
                               <strong>Alistado por:</strong> _________________
                           </div>
                           <div>
                               <strong>Verificado por:</strong> _________________
                           </div>
                        </div>

                        <div class="footer">
                            <p>Centro Comercial TEI - Control Interno</p>
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const fetchActivationPackages = async () => {
        setLoadingPackages(true);
        try {
            const response = await api.get('/api/products/');
            const packages = response.data.filter(p => p.is_activation === true);
            setActivationPackages(packages);
            // Select first package by default
            if (packages.length > 0) {
                setActivationData(prev => ({ ...prev, selectedPackage: packages[0].id }));
            }
        } catch (error) {
            console.error('Error loading activation packages:', error);
        } finally {
            setLoadingPackages(false);
        }
    };

    const handleSearchUsers = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;

        setSearching(true);
        setSearchResults([]);
        try {
            const res = await api.get(`/api/admin/users?search=${searchTerm}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Error searching users", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSearchResults([]);
        setSearchTerm('');
    };

    const handleActivateUser = async () => {
        const userIdToActivate = selectedUser ? selectedUser.id : activationData.userId;

        if (!userIdToActivate) {
            alert('Por favor selecciona un usuario o ingresa el ID');
            return;
        }

        if (!activationData.selectedPackage) {
            alert('Por favor selecciona un paquete de activación');
            return;
        }

        setActivating(true);
        setActivationResult(null);

        const selectedPkg = activationPackages.find(p => p.id === parseInt(activationData.selectedPackage));

        try {
            const response = await api.post('/api/admin/activate-user', {
                user_id: parseInt(userIdToActivate),
                package_amount: selectedPkg.price_usd
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

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #ec4899',
                    position: 'relative'
                }}>
                    {stats.pendingShipments > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                        }}>
                            ¡Acción Requerida!
                        </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pedidos por Despachar</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899' }}>{stats.pendingShipments}</p>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>🚚</div>
                    </div>
                </div>
            </div>

            {/* Pending Shipments Section - DIRECT ACTION */}
            {pendingOrders.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        background: '#fdf2f8',
                        border: '1px solid #fbcfe8',
                        borderRadius: '0.75rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #fbcfe8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#db2777', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>⚠️</span> Atención: {pendingOrders.length} Pedidos Listos para Alistamiento
                                </h3>
                                <p style={{ color: '#be185d', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    Estos pedidos ya tienen pago confirmado y están esperando envío.
                                </p>
                            </div>
                            <button
                                onClick={handlePrintPendingOrders}
                                style={{
                                    background: '#db2777',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(219, 39, 119, 0.4)'
                                }}
                            >
                                🖨️ IMPRIMIR TODAS LAS REMISIONES
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead style={{ background: 'white' }}>
                                    <tr style={{ borderBottom: '1px solid #fbcfe8' }}>
                                        <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#9d174d' }}>ID</th>
                                        <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#9d174d' }}>Usuario</th>
                                        <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#9d174d' }}>Fecha Pago</th>
                                        <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#9d174d' }}>Productos</th>
                                        <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', color: '#9d174d' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody style={{ background: 'white' }}>
                                    {pendingOrders.slice(0, 5).map(order => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>#{order.id}</td>
                                            <td style={{ padding: '0.75rem 1.5rem', color: '#4b5563' }}>{order.user_id}</td>
                                            <td style={{ padding: '0.75rem 1.5rem', color: '#4b5563' }}>
                                                {new Date(order.payment_confirmed_at || order.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem 1.5rem', color: '#1f2937' }}>
                                                {order.items.length} items (Total: {order.total_pv} PV)
                                            </td>
                                            <td style={{ padding: '0.75rem 1.5rem' }}>
                                                <button
                                                    onClick={() => navigate('/admin/orders')}
                                                    style={{ color: '#db2777', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }}
                                                >
                                                    Gestionar &gt;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingOrders.length > 5 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', background: '#fdf2f8', color: '#9d174d' }}>
                                                ... y {pendingOrders.length - 5} pedidos más.
                                                <button
                                                    onClick={() => navigate('/admin/orders')}
                                                    style={{ marginLeft: '0.5rem', fontWeight: 'bold', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#db2777' }}
                                                >
                                                    Ver Todos
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


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
                        onClick={() => navigate('/admin/users')}
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
                        onClick={() => navigate('/admin/products')}
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
                        onClick={() => navigate('/admin/payments')}
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
                        onClick={() => navigate('/admin/qualified-ranks')}
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
                        onClick={() => navigate('/admin/honor-ranks')}
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
                    <button
                        onClick={() => navigate('/admin/orders')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#ec4899',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        📋 Gestión de Pedidos
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
                                Buscar Usuario (Nombre, Usuario o Email)
                            </label>

                            {!selectedUser ? (
                                <div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers(e)}
                                            placeholder="Ej: Juan Perez"
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.5rem',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <button
                                            onClick={handleSearchUsers}
                                            disabled={searching}
                                            style={{
                                                padding: '0 1rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {searching ? '...' : '🔍'}
                                        </button>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div style={{
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {searchResults.map(u => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => handleSelectUser(u)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                    className="hover:bg-blue-50"
                                                >
                                                    <strong>{u.name}</strong> (@{u.username}) <br />
                                                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{u.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searching && <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Buscando...</p>}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1rem',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ fontWeight: 'bold', color: '#1e40af' }}>{selectedUser.name}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>ID: {selectedUser.id} | @{selectedUser.username}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>{selectedUser.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fee2e2',
                                            color: '#991b1b',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            )}

                            {/* Fallback ID input */}
                            {!selectedUser && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>O ingresa el ID directamente:</p>
                                    <input
                                        type="number"
                                        value={activationData.userId}
                                        onChange={(e) => setActivationData({ ...activationData, userId: e.target.value })}
                                        placeholder="ID Usuario"
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.9rem',
                                            marginTop: '0.25rem'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Paquete de Activación
                            </label>
                            {loadingPackages ? (
                                <p style={{ color: '#6b7280' }}>Cargando paquetes...</p>
                            ) : activationPackages.length === 0 ? (
                                <p style={{ color: '#ef4444' }}>No hay paquetes de activación disponibles</p>
                            ) : (
                                <select
                                    value={activationData.selectedPackage || ''}
                                    onChange={(e) => setActivationData({ ...activationData, selectedPackage: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {activationPackages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} - ${pkg.price_usd} USD / ${pkg.price_local.toLocaleString()} COP - {pkg.pv} PV
                                        </option>
                                    ))}
                                </select>
                            )}
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
