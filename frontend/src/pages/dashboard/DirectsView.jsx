import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const DirectsView = () => {
    const [directs, setDirects] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchUserIdAndDirects();
    }, []);

    const fetchUserIdAndDirects = async () => {
        setLoading(true);
        try {
            // Always fetch fresh userId from API to ensure correct data
            const userResponse = await api.get('/auth/me');
            const currentUserId = userResponse.data.id;

            setUserId(currentUserId);

            // Now fetch directs with the correct userId
            const res = await api.get(`/api/unilevel/directs/${currentUserId}`);
            console.log('Directs:', res.data);
            setDirects(res.data);
        } catch (error) {
            console.error('Error fetching directs:', error);
            setDirects({ total_directs: 0, total_network: 0, directs: [] });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                fontSize: '1.25rem',
                color: '#6b7280'
            }}>
                Cargando datos de afiliados...
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    👥 Mis Afiliados Directos
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Personas que has afiliado personalmente a tu red
                </p>
            </div>

            {/* Stats Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {/* Total Directs */}
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '3px solid #10b981',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                        Afiliados Directos (Nivel 1)
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981' }}>
                        {directs?.total_directs || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                        Personas que afiliaste directamente
                    </div>
                </div>

                {/* Total Network */}
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '3px solid #667eea'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem', textAlign: 'center' }}>🌐</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', textAlign: 'center' }}>
                        Total Red (Todos los Niveles)
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>
                        {directs?.total_network || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center' }}>
                        Todas las personas en tu red
                    </div>
                </div>
            </div>

            {/* List of Directs */}
            <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    📋 Lista de Afiliados
                </h2>

                {directs && directs.total_directs > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <tr>
                                    <th style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        color: 'white',
                                        borderBottom: '2px solid #10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        #
                                    </th>
                                    <th style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        color: 'white',
                                        borderBottom: '2px solid #10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        Nombre
                                    </th>
                                    <th style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        color: 'white',
                                        borderBottom: '2px solid #10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        Email
                                    </th>
                                    <th style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: 'white',
                                        borderBottom: '2px solid #10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {directs.directs.map((direct, index) => (
                                    <tr key={direct.user_id} style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        background: index % 2 === 0 ? '#f9fafb' : 'white',
                                        transition: 'background 0.2s hover'
                                    }}>
                                        <td style={{
                                            padding: '1rem',
                                            fontWeight: '600',
                                            color: '#6b7280',
                                            fontSize: '0.95rem'
                                        }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.125rem',
                                                    flexShrink: 0
                                                }}>
                                                    {direct.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>
                                                        {direct.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                        ID: {direct.user_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '1rem',
                                            color: '#6b7280',
                                            fontSize: '0.9rem',
                                            wordBreak: 'break-word'
                                        }}>
                                            {direct.email}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.5rem 1rem',
                                                background: direct.status === 'active' ? '#d1fae5' : '#f3f4f6',
                                                color: direct.status === 'active' ? '#065f46' : '#6b7280',
                                                borderRadius: '9999px',
                                                fontWeight: '600',
                                                fontSize: '0.875rem'
                                            }}>
                                                {direct.status === 'active' ? '✅ Activo' : '⏸️ Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: '#f9fafb',
                        borderRadius: '0.75rem',
                        color: '#6b7280'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            No tienes afiliados directos aún
                        </h3>
                        <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                            Comienza a invitar personas a tu red para construir tu negocio y ganar comisiones
                        </p>
                        <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '1.5rem',
                            borderRadius: '0.75rem',
                            display: 'inline-block'
                        }}>
                            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                🎯 Próximo Paso
                            </div>
                            <p style={{ fontSize: '0.95rem', marginTop: '0.5rem', opacity: 0.9 }}>
                                Invita a personas a unirse a tu red y comienza a generar ingresos
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                marginTop: '3rem',
                boxShadow: '0 10px 15px rgba(16,185,129,0.3)'
            }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    ℹ️ Información sobre Afiliados
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                            ¿Qué son tus afiliados directos?
                        </h4>
                        <p style={{ opacity: 0.95, lineHeight: '1.6' }}>
                            Son las personas que patrocinaste personalmente al unirse a la red. Ellos son tu Nivel 1 y son los que generan comisiones para ti a través del sistema Unilevel.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                            ¿Cuáles son tus beneficios?
                        </h4>
                        <p style={{ opacity: 0.95, lineHeight: '1.6' }}>
                            Recibes el 1% de comisión de sus compras. Además, si ellos patrocina a otros, tú recibes comisiones de hasta 7 niveles de profundidad.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                            🎁 Bono Matching
                        </h4>
                        <p style={{ opacity: 0.95, lineHeight: '1.6' }}>
                            Recibe el 50% extra de las comisiones que generan tus directs. Si tus directs ganan $100 en comisiones, tú ganas $50 adicionales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectsView;
