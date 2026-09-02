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
            try {
                const res = await api.post('/auth/magic-merchant', { token });
                
                localStorage.setItem('access_token', res.data.access_token);
                // Also setting user info to give context
                localStorage.setItem('user', JSON.stringify({
                    id: res.data.merchant_id,
                    name: res.data.name,
                    admin_role: res.data.role
                }));
                
                setStatus('✅ Ingreso exitoso. Redirigiendo al portal...');
                
                // Redirecting directly to the portal after a short delay
                setTimeout(() => {
                    window.location.href = '/merchant';
                }, 1500);
            } catch (err) {
                setError(err.response?.data?.detail || 'Enlace inválido o expirado.');
                setStatus('');
            }
        };

        if (token) {
            authenticateMagicLink();
        } else {
            setError('No se proporcionó token.');
        }
    }, [token]);

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
                maxWidth: '400px',
                width: '100%'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                    🏪 Portal de Cajero
                </h2>
                
                {error ? (
                    <div>
                        <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                        >
                            Ir al Login Normal
                        </button>
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
