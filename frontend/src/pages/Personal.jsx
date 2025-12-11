import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';
import TeiLogo from '../components/TeiLogo';
import CompleteRegistration from './CompleteRegistration';

export default function Personal() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [referralCode, setReferralCode] = useState("");
    const [referrerName, setReferrerName] = useState("");

    useEffect(() => {
        const refCode = searchParams.get("ref");
        if (refCode) {
            setReferralCode(refCode);
            api.get(`/auth/verify-referral/${refCode}`)
                .then(response => {
                    if (response.data && response.data.valid) {
                        setReferrerName(response.data.referrer_name || "");
                    }
                })
                .catch(error => {
                    // Invalid referral code or network error - continue anyway
                    console.log("Referral code verification failed:", error.message);
                });
        }
    }, [searchParams]);

    if (showRegistrationForm) {
        return (
            <CompleteRegistration 
                referralCode={referralCode} 
                onBack={() => setShowRegistrationForm(false)}
            />
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <TeiLogo size="large" showSubtitle={true} />
                </div>

                <div style={{ background: 'white', borderRadius: '1.5rem', padding: '3rem 2rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
                    <h2 style={{ color: '#1e3a8a', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
                        Área Personal
                    </h2>
                    <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1rem' }}>
                        Selecciona una opción para continuar
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <button
                            onClick={() => setShowRegistrationForm(true)}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1.125rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>📝</span>
                            Registro Nuevo Distribuidor
                        </button>

                        <button
                            onClick={() => navigate('/login', { state: { view: 'login' } })}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(to right, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1.125rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🔐</span>
                            Acceso del Distribuidor
                        </button>

                        <button
                            onClick={() => alert('La aplicación móvil estará disponible próximamente.')}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1.125rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>📱</span>
                            Descargar APP
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            marginTop: '2rem',
                            borderRadius: '0.75rem',
                            background: 'transparent',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#f1f5f9';
                            e.target.style.color = '#1e3a8a';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#64748b';
                        }}
                    >
                        ← Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
