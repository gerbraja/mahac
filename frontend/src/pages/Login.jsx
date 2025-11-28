import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/api';
import TeiLogo from '../components/TeiLogo';
import CompleteRegistration from './CompleteRegistration';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'complete-registration'); // Default view or from state
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Login endpoint expects JSON
            const response = await api.post('/auth/login', {
                username: formData.username,
                password: formData.password
            });

            // Store token
            localStorage.setItem('token', response.data.access_token);

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'complete-registration') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <TeiLogo size="medium" showSubtitle={true} />
                    </div>

                    <CompleteRegistration />

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <p style={{ color: 'white', marginBottom: '0.5rem' }}>¿Ya eres un afiliado activo?</p>
                        <button
                            onClick={() => setView('login')}
                            style={{
                                background: 'white',
                                border: 'none',
                                color: '#1e3a8a',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            Iniciar Sesión Aquí
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <TeiLogo size="medium" showSubtitle={true} />
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                    <h2 style={{ color: '#1e3a8a', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                        Iniciar Sesión
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#1e3a8a', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Usuario
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '2px solid rgba(59, 130, 246, 0.3)',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                                placeholder="admin"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#1e3a8a', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '2px solid rgba(59, 130, 246, 0.3)',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#dc2626',
                                fontSize: '0.875rem',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '0.5rem',
                                background: loading ? '#9ca3af' : 'linear-gradient(to right, #3b82f6, #1e40af)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setView('complete-registration')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '0.875rem'
                            }}
                        >
                            ¿Eres pre-afiliado? Completa tu registro aquí
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            ← Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
