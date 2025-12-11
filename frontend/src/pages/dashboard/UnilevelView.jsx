import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

const UnilevelView = () => {
    const [unilevelData, setUnilevelData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = parseInt(localStorage.getItem('userId') || '1', 10);

    useEffect(() => {
        fetchUnilevelData();
    }, []);

    const fetchUnilevelData = async () => {
        setLoading(true);
        try {
            const [statusRes, statsRes] = await Promise.all([
                api.get(`/api/unilevel/status/${userId}`),
                api.get(`/api/unilevel/stats/${userId}`)
            ]);

            console.log('Unilevel Status:', statusRes.data);
            console.log('Unilevel Stats:', statsRes.data);

            setUnilevelData(statusRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching unilevel data:', error);
            setUnilevelData({ status: 'not_registered' });
            setStats({});
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
                Cargando datos de Red Unilevel...
            </div>
        );
    }

    const isRegistered = unilevelData?.status === 'active';
    
    // Porcentajes por nivel
    const LEVEL_PERCENTAGES = {
        1: 1,
        2: 2,
        3: 2,
        4: 4,
        5: 5,
        6: 6,
        7: 7
    };

    // Calcular totales
    const totalEarnings = stats?.total_earnings || 0;
    const monthlyEarnings = stats?.monthly_earnings || 0;
    const totalDownline = stats?.total_downline || 0;
    const activeDownline = stats?.active_downline || 0;

    return (
        <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    🌳 Red Unilevel
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Sistema de comisiones en 7 niveles - Total acumulado: 27%
                </p>
            </div>

            {/* Status Card */}
            <div style={{
                background: isRegistered 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {isRegistered ? '✅' : '❌'}
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {isRegistered ? 'Red Activa' : 'No Registrado'}
                </h2>
                <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
                    {isRegistered 
                        ? 'Estás activo en la red Unilevel y recibiendo comisiones'
                        : 'Regístrate para comenzar a ganar comisiones de tu red'}
                </p>
            </div>

            {isRegistered && (
                <>
                    {/* Stats Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '3rem'
                    }}>
                        {/* Total Earnings */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid #10b981'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Ganancias Totales
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                ${totalEarnings.toLocaleString()}
                            </div>
                        </div>

                        {/* Monthly Earnings */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid #3b82f6'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Ganancias del Mes
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                ${monthlyEarnings.toLocaleString()}
                            </div>
                        </div>

                        {/* Total Downline */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid #8b5cf6'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Total Red
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {totalDownline}
                            </div>
                        </div>

                        {/* Active Downline */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid #f59e0b'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Red Activa
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {activeDownline}
                            </div>
                        </div>

                        {/* Matching Bonus Earned */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid #ec4899'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Bono de Igualación
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899' }}>
                                ${(stats?.matching_bonus || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                50% de comisiones de directos
                            </div>
                        </div>
                    </div>

                    {/* Matching Bonus Explanation */}
                    <div style={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 15px rgba(236,72,153,0.3)'
                    }}>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🎁 Bono de Igualación (Matching Bonus)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    ¿Qué es?
                                </h4>
                                <p style={{ opacity: 0.95, lineHeight: '1.6', fontSize: '1rem' }}>
                                    Es un <strong>bono adicional del 50%</strong> de todas las comisiones que generan tus patrocinados directos (Nivel 1). 
                                    Esto te recompensa por construir y apoyar a líderes fuertes en tu equipo.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    ¿Cómo funciona?
                                </h4>
                                <p style={{ opacity: 0.95, lineHeight: '1.6', fontSize: '1rem' }}>
                                    Cuando un patrocinado directo tuyo gana comisiones Unilevel de su red, 
                                    tú recibes el <strong>50% de esas comisiones como bono adicional</strong>. 
                                    Es decir, ganas dos veces: tu comisión normal + el matching bonus.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    Ejemplo Práctico
                                </h4>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
                                    <p style={{ marginBottom: '0.5rem' }}>
                                        • Tu directo Pedro gana <strong>$100</strong> en comisiones Unilevel
                                    </p>
                                    <p style={{ marginBottom: '0.5rem' }}>
                                        • Tú recibes <strong>$50</strong> de matching bonus (50% de $100)
                                    </p>
                                    <p style={{ marginBottom: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        💰 Total extra: $50 por cada directo exitoso
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Levels Breakdown */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        marginBottom: '3rem'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1e3a8a',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📊 Comisiones por Nivel
                        </h3>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'white', borderBottom: '2px solid #5a67d8' }}>Nivel</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Porcentaje</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Personas</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Activos</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Comisiones Ganadas</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Matching Bonus</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'white', borderBottom: '2px solid #5a67d8' }}>Volumen del Nivel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7].map((level, index) => {
                                        const levelStats = stats?.levels?.[level] || {};
                                        const totalMembers = levelStats.total_members || 0;
                                        const activeMembers = levelStats.active_members || 0;
                                        const earnings = levelStats.total_earnings || 0;
                                        const volume = levelStats.total_volume || 0;
                                        const percentage = LEVEL_PERCENTAGES[level];

                                        return (
                                            <tr key={level} style={{
                                                borderBottom: '1px solid #e5e7eb',
                                                background: index % 2 === 0 ? '#fef3c7' : '#d1fae5'
                                            }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: `linear-gradient(135deg, ${getColorForLevel(level)})`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '1.125rem'
                                                        }}>
                                                            {level}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                                                                Nivel {level}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                Generación {level}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '0.5rem 1rem',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        borderRadius: '9999px',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.125rem'
                                                    }}>
                                                        {percentage}%
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1.125rem' }}>
                                                    {totalMembers}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '9999px',
                                                        background: activeMembers > 0 ? '#d1fae5' : '#f3f4f6',
                                                        color: activeMembers > 0 ? '#065f46' : '#6b7280',
                                                        fontWeight: '700'
                                                    }}>
                                                        {activeMembers}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.125rem', color: '#10b981' }}>
                                                    ${earnings.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.125rem', color: '#ec4899' }}>
                                                    {level === 1 ? `$${(levelStats.matching_bonus || 0).toLocaleString()}` : 'N/A'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#6b7280' }}>
                                                    ${volume.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{
                                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.25rem'
                                    }}>
                                        <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'right' }}>
                                            💰 TOTAL ACUMULADO:
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1.75rem' }}>
                                            ${totalEarnings.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1.75rem', color: '#fce7f3' }}>
                                            ${(stats?.matching_bonus || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                                            ${(stats?.total_volume || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            📚 ¿Cómo funciona la Red Unilevel?
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    🎯 7 Niveles de Profundidad
                                </h4>
                                <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                                    Ganas comisiones de hasta 7 niveles de profundidad en tu red. Cada nivel tiene su propio porcentaje de comisión.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    💎 Total 27% Distribuido
                                </h4>
                                <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                                    El sistema distribuye un total de 27% en comisiones: 1% + 2% + 2% + 4% + 5% + 6% + 7%
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    ⚡ Comisiones Automáticas
                                </h4>
                                <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                                    Cada vez que alguien en tu red hace una compra, automáticamente recibes tu comisión según el nivel.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Genealogy Tree Preview */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1e3a8a',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            🌳 Vista Rápida de tu Red
                        </h3>
                        
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            {/* You */}
                            <div style={{
                                display: 'inline-block',
                                padding: '1rem 2rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                borderRadius: '1rem',
                                fontWeight: 'bold',
                                fontSize: '1.25rem',
                                marginBottom: '2rem',
                                boxShadow: '0 4px 6px rgba(16,185,129,0.3)'
                            }}>
                                👤 TÚ
                            </div>

                            {/* Level 1 */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: '600' }}>
                                    Nivel 1 - {stats?.levels?.[1]?.total_members || 0} personas ({LEVEL_PERCENTAGES[1]}%)
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {renderLevelNodes(stats?.levels?.[1]?.total_members || 0, 1, 5)}
                                </div>
                            </div>

                            {/* Level 2 */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: '600' }}>
                                    Nivel 2 - {stats?.levels?.[2]?.total_members || 0} personas ({LEVEL_PERCENTAGES[2]}%)
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {renderLevelNodes(stats?.levels?.[2]?.total_members || 0, 2, 10)}
                                </div>
                            </div>

                            {/* Remaining levels indicator */}
                            {totalDownline > 15 && (
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: '#f3f4f6',
                                    borderRadius: '0.5rem',
                                    color: '#6b7280',
                                    fontWeight: '600'
                                }}>
                                    ... y {totalDownline - 15} personas más en niveles 3-7
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Helper function to get color gradient for each level
const getColorForLevel = (level) => {
    const colors = {
        1: '#10b981 0%, #059669 100%',
        2: '#3b82f6 0%, #2563eb 100%',
        3: '#8b5cf6 0%, #7c3aed 100%',
        4: '#f59e0b 0%, #d97706 100%',
        5: '#ef4444 0%, #dc2626 100%',
        6: '#ec4899 0%, #db2777 100%',
        7: '#6366f1 0%, #4f46e5 100%'
    };
    return colors[level] || '#6b7280 0%, #4b5563 100%';
};

// Helper function to render level nodes
const renderLevelNodes = (count, level, maxShow) => {
    const nodesToShow = Math.min(count, maxShow);
    const nodes = [];
    
    for (let i = 0; i < nodesToShow; i++) {
        nodes.push(
            <div key={i} style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getColorForLevel(level)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                👤
            </div>
        );
    }
    
    if (count > maxShow) {
        nodes.push(
            <div key="more" style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 'bold'
            }}>
                +{count - maxShow}
            </div>
        );
    }
    
    return nodes;
};

export default UnilevelView;
