import React from 'react';

const EarningsCard = ({ title, totalEarnings, monthlyEarnings, totalNetwork, icon, color, gradient, onClick, description = "", labelNetwork = "Red", labelEarnings = "Ganancias Totales", customEarningsValue = null, customStyle = null }) => {

    // Helper para formatear solo USD string
    const formatUSD = (usdValue) => {
        const value = usdValue || 0;
        return '$' + value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Helper para renderizar bloque de moneda (USD + COP)
    const formatCurrencyBlock = (usdValue) => {
        const value = usdValue || 0;
        const copValue = value * 4500; // Tasa fija de conversión
        const usdString = formatUSD(value);
        const copString = '$' + copValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{usdString} USD</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    (≈ {copString} COP)
                </span>
            </div>
        );
    };

    if (gradient || customStyle) {
        return (
            <div
                role="button"
                onClick={onClick}
                style={{ ...customStyle, cursor: 'pointer' }}
                className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl w-full text-left ${(!customStyle && gradient) ? (gradient.includes('gradient') ? gradient : `bg-gradient-to-br ${gradient}`) : ''}`}
            >
                <div className="p-6 text-white h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="text-2xl">{icon}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs opacity-75 font-medium uppercase tracking-wider">{labelNetwork}</div>
                            <div className="font-bold text-lg">{totalNetwork}</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-lg font-bold mb-1 opacity-90">{title}</h3>
                        {description && <p className="text-xs opacity-75 mb-3 line-clamp-1">{description}</p>}

                        <div className="mt-2">
                            <div className="text-xs opacity-75 mb-1">{labelEarnings}</div>
                            {customEarningsValue ? (
                                <div className="font-bold text-xl">{customEarningsValue}</div>
                            ) : (
                                formatCurrencyBlock(totalEarnings)
                            )}
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${color}`,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{
                    fontSize: '2rem',
                    background: `${color}20`, // 20% opacity using hex
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>{title}</h3>
                    {description && <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{description}</p>}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gap: '1rem', marginTop: 'auto' }}>

                {/* Ganancias Totales */}
                <div style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    borderLeft: `3px solid ${color}`
                }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Ganancias Totales
                    </div>
                    <div style={{ color: color }}>
                        {formatCurrencyBlock(totalEarnings)}
                    </div>
                </div>

                {/* Second Row: Monthly + Network */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Monthly */}
                    <div style={{
                        background: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '0.75rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            📅 Del Mes
                        </div>
                        <div style={{ fontWeight: '600', color: '#374151' }}>
                            {formatUSD(monthlyEarnings)} <span style={{ fontSize: '0.6em' }}>USD</span>
                        </div>
                    </div>

                    {/* Network */}
                    <div style={{
                        background: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '0.75rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            👥 Red
                        </div>
                        <div style={{ fontWeight: '600', color: '#374151', fontSize: '1.125rem' }}>
                            {totalNetwork}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsCard;
