import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';
import TeiLogo from '../components/TeiLogo';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('El enlace de recuperación no es válido. Por favor solicita uno nuevo.');
        }
    }, [token]);

    // Password strength
    const getStrength = (pwd) => {
        if (!pwd) return { level: 0, label: '', color: '#e5e7eb' };
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return { level: score, label: 'Débil', color: '#ef4444' };
        if (score <= 3) return { level: score, label: 'Media', color: '#f59e0b' };
        return { level: score, label: 'Fuerte', color: '#22c55e' };
    };

    const strength = getStrength(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token: token,
                new_password: newPassword
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'El enlace es inválido o ha expirado. Por favor solicita uno nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
        borderRadius: '0.5rem',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        outline: 'none',
        fontSize: '1rem',
        boxSizing: 'border-box'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '420px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <TeiLogo size="medium" showSubtitle={true} />
                </div>

                <div style={{
                    background: 'white', borderRadius: '1rem',
                    padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>

                    {/* ── Success State ─────────────────────────────────── */}
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                            <h2 style={{ color: '#166534', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                ¡Contraseña restablecida!
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
                                    background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                    color: 'white', border: 'none', fontSize: '1rem',
                                    fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                Ir al Login
                            </button>
                        </div>
                    ) : (
                        /* ── Form State ───────────────────────────────── */
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
                                <h2 style={{ color: '#1e3a8a', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                                    Crear nueva contraseña
                                </h2>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    Ingresa y confirma tu nueva contraseña.
                                </p>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem',
                                    background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626',
                                    fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                    ❌ {error}
                                </div>
                            )}

                            {!token ? null : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Nueva contraseña */}
                                    <div>
                                        <label style={{ display: 'block', color: '#1e3a8a', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                            Nueva contraseña
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                style={inputStyle}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute', right: '0.75rem', top: '50%',
                                                    transform: 'translateY(-50%)', background: 'none',
                                                    border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem'
                                                }}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        {/* Strength bar */}
                                        {newPassword && (
                                            <div style={{ marginTop: '0.4rem' }}>
                                                <div style={{ height: '4px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: '2px',
                                                        width: `${(strength.level / 5) * 100}%`,
                                                        background: strength.color,
                                                        transition: 'all 0.3s'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: '500' }}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirmar contraseña */}
                                    <div>
                                        <label style={{ display: 'block', color: '#1e3a8a', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                            Confirmar contraseña
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            style={{
                                                ...inputStyle,
                                                border: confirmPassword
                                                    ? confirmPassword === newPassword
                                                        ? '2px solid #22c55e'
                                                        : '2px solid #ef4444'
                                                    : '2px solid rgba(59, 130, 246, 0.3)'
                                            }}
                                            placeholder="Repite la contraseña"
                                        />
                                        {confirmPassword && confirmPassword !== newPassword && (
                                            <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.25rem 0 0' }}>
                                                Las contraseñas no coinciden
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !token}
                                        style={{
                                            width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
                                            background: loading ? '#9ca3af' : 'linear-gradient(to right, #3b82f6, #1e40af)',
                                            color: 'white', border: 'none', fontSize: '1rem',
                                            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                                    </button>
                                </form>
                            )}

                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem'
                                    }}
                                >
                                    ← Volver al Login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
