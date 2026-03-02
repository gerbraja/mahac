import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { globalCountry, setGlobalCountry, countries } = useAdmin();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'Usuarios', icon: '👥' },
        { path: '/admin/products', label: 'Productos', icon: '📦' },
        { path: '/admin/suppliers', label: 'Proveedores', icon: '🏭' },
        { path: '/admin/supplier-orders', label: 'Pedidos a Fábrica', icon: '🛒' },
        { path: '/admin/payments', label: 'Pagos Pendientes', icon: '💳' },
        { path: '/admin/kyc', label: 'Validaciones KYC', icon: '🆔' },
        { path: '/admin/withdrawals', label: 'Retiros', icon: '🏦' },
        { path: '/admin/sponsorship-commissions', label: 'Comisiones Patrocinio', icon: '💰' },
        { path: '/admin/pickup-points', label: 'Puntos de Recogida', icon: '📍' },
        { path: '/admin/reports', label: 'Reportes', icon: '📈' },
        { path: '/admin/country-stats', label: 'Estad. por País', icon: '🗺️' },
        { path: '/admin/taxes', label: 'Impuestos y Retenciones', icon: '🧾' },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '90px' : '45px',
                background: '#ffffff', // Fondo claro
                color: '#1f2937', // Letra oscura
                borderRight: '1px solid #e5e7eb',
                transition: 'width 0.3s',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 1000,
                overflow: 'hidden'
            }}>
                {/* Logo */}
                <div style={{
                    padding: '0.375rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {sidebarOpen && (
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                            TEI Admin
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1f2937',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                {/* Global Country Selector */}
                {sidebarOpen && (
                    <div style={{ padding: '0.375rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Filtro Global:</label>
                        <select
                            value={globalCountry}
                            onChange={(e) => setGlobalCountry(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-800 text-sm py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            {countries.map(c => <option key={c} value={c}>{c === 'Todos' ? '🌍 Todos los países' : `📍 ${c}`}</option>)}
                        </select>
                    </div>
                )}

                {/* Menu Items */}
                <nav style={{
                    flex: 1,
                    padding: '0.25rem 0',
                    overflowY: 'auto',
                    minHeight: 0,
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                width: '100%',
                                padding: '0.25rem 0.55rem', // Compacto -10% adicional
                                background: isActive(item.path) ? '#eff6ff' : 'transparent',
                                border: 'none',
                                borderLeft: isActive(item.path) ? '4px solid #1d4ed8' : '4px solid transparent',
                                color: isActive(item.path) ? '#1d4ed8' : '#374151',
                                fontWeight: isActive(item.path) ? '600' : 'normal',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.72rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = '#f3f4f6';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Logout */}
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '0.5rem',
                            color: '#b91c1c',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.target.style.background = '#fee2e2'}
                    >
                        <span>🚪</span>
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{
                flex: 1,
                marginLeft: sidebarOpen ? '90px' : '45px',
                transition: 'margin-left 0.3s'
            }}>
                {/* Header */}
                <header style={{
                    background: 'white',
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: 'bold',
                        color: '#1e3a8a',
                        margin: 0
                    }}>
                        Panel de Administración
                    </h1>
                </header>

                {/* Page Content */}
                <main style={{ padding: '2rem' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
