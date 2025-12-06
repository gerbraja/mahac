import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'Usuarios', icon: '👥' },
        { path: '/admin/products', label: 'Productos', icon: '📦' },
        { path: '/admin/payments', label: 'Pagos Pendientes', icon: '💳' },
        { path: '/admin/sponsorship-commissions', label: 'Comisiones Patrocinio', icon: '💰' },
        { path: '/admin/reports', label: 'Reportes', icon: '📈' },
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
                width: sidebarOpen ? '250px' : '70px',
                background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
                color: 'white',
                transition: 'width 0.3s',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 1000
            }}>
                {/* Logo */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {sidebarOpen && (
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            TEI Admin
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                {/* Menu Items */}
                <nav style={{ flex: 1, padding: '1rem 0' }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                width: '100%',
                                padding: '1rem 1.5rem',
                                background: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                                border: 'none',
                                borderLeft: isActive(item.path) ? '4px solid white' : '4px solid transparent',
                                color: 'white',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Logout */}
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>🚪</span>
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{
                flex: 1,
                marginLeft: sidebarOpen ? '250px' : '70px',
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
