import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

const MagicMerchantLogin = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Iniciando sesión segura...');
    const [error, setError] = useState('');

    useEffect(() => {
        const authenticateMagicLink = async () => {
            // 1. Si el token es nulo o inválido
            if (!token || token === 'null' || token === 'undefined') {
                const existingToken = localStorage.getItem('access_token');
                if (existingToken) {
                    try {
                        const meRes = await api.get('/auth/me');
                        if (meRes.data && (meRes.data.is_merchant || meRes.data.admin_role === 'merchant' || meRes.data.admin_role === 'comercio_aliado')) {
                            setStatus('✅ Sesión activa de comercio detectada. Ingresando al portal...');
                            setTimeout(() => {
                                window.location.href = '/merchant';
                            }, 600);
                            return;
                        }
                    } catch (_) {}
                }
                setError('El enlace de caja no contiene un token válido.');
                setStatus('');
                return;
            }

            // 2. Si hay token, autenticar con el backend
            try {
                const res = await api.post('/auth/magic-merchant', { token });
                
                localStorage.setItem('access_token', res.data.access_token);
                localStorage.setItem('user', JSON.stringify({
                    id: res.data.merchant_id,
                    name: res.data.name,
                    admin_role: res.data.role
                }));
                
                setStatus('✅ Ingreso exitoso. Redirigiendo al portal...');
                
                setTimeout(() => {
                    window.location.href = '/merchant';
                }, 1000);
            } catch (err) {
                // Si falla pero el usuario ya tenía sesión iniciada en TEI
                const existingToken = localStorage.getItem('access_token');
                if (existingToken) {
                    try {
                        const meRes = await api.get('/auth/me');
                        if (meRes.data && (meRes.data.is_merchant || meRes.data.admin_role === 'merchant')) {
                            setStatus('✅ Sesión activa detectada. Ingresando al portal...');
                            setTimeout(() => {
                                window.location.href = '/merchant';
                            }, 600);
                            return;
                        }
                    } catch (_) {}
                }
                setError(err.response?.data?.detail || 'Enlace inválido o expirado.');
                setStatus('');
            }
        };

        authenticateMagicLink();
    }, [token, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                maxWidth: '420px',
                width: '100%'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                    🏪 Portal de Cajero
                </h2>
                
                {error ? (
                    <div>
                        <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '1rem' }}>{error}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => navigate('/merchant')}
                                style={{ padding: '0.6rem 1.2rem', background: '#059669', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Ir a Mi Portal de Comercio
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Ir al Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite', marginBottom: '1rem' }}>⏳</div>
                        <p style={{ color: '#059669', fontWeight: '500' }}>{status}</p>
                        <style>{`
                            @keyframes spin { 100% { transform: rotate(360deg); } }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MagicMerchantLogin;
