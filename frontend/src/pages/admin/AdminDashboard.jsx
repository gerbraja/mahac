export default function AdminDashboard() {
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
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>-</p>
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
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>-</p>
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
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>-</p>
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
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>-</p>
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
                </div>
            </div>
        </div>
    );
}
