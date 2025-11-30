import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function RequireAdmin({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                const res = await api.get('/auth/me');
                if (res.data.is_admin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f3f4f6',
                color: '#1e3a8a',
                fontSize: '1.5rem',
                fontWeight: 'bold'
            }}>
                Verificando permisos...
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f3f4f6',
                color: '#1e3a8a',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⛔ Acceso Denegado</h1>
                <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
                    No tienes permisos de administrador para ver esta página.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Volver al Dashboard
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return children;
}
