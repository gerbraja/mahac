import { useNavigate } from 'react-router-dom';
import TeiLogo from '../components/TeiLogo';

export default function Personal() {
    const navigate = useNavigate();

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
                        {/* Button 1: Registro Nuevo Distribuidor */}
                        <button
                            onClick={() => navigate('/login')}
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

                        {/* Button 2: Acceso del Distribuidor */}
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

                        {/* Button 3: Descargar APP */}
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

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                textDecoration: 'underline'
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
