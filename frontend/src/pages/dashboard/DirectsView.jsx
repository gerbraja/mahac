import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';

/* ─── Mini animated progress bar ─────────────────────────────── */
function RankProgressBar({ label, icon, current, next, pct, colorFrom, colorTo, achieved }) {
    const [animated, setAnimated] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setAnimated(pct), 200);
        return () => clearTimeout(t);
    }, [pct]);

    const displayPct = achieved ? 100 : animated;

    return (
        <div style={{ marginBottom: '0.85rem' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {icon} {label}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6b7280' }}>
                    {achieved
                        ? <span style={{ color: '#059669' }}>✅ {current?.name || current?.name} alcanzado</span>
                        : current
                            ? <span style={{ color: '#7c3aed' }}>{current.emoji} {current.name} → {next?.emoji} {next?.name}</span>
                            : <span style={{ color: '#9ca3af' }}>Sin rango aún · Meta: {next?.name}</span>
                    }
                </span>
            </div>

            {/* Bar */}
            <div style={{
                position: 'relative', height: '10px', borderRadius: '999px',
                background: '#e5e7eb', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${displayPct}%`,
                    background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                    borderRadius: '999px',
                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: `0 0 6px ${colorTo}80`
                }} />
                {/* Glow dot at tip */}
                {displayPct > 3 && (
                    <div style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        left: `calc(${displayPct}% - 6px)`,
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: 'white', border: `2px solid ${colorTo}`,
                        boxShadow: `0 0 4px ${colorTo}`,
                        transition: 'left 1s cubic-bezier(0.4,0,0.2,1)'
                    }} />
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>
                    {achieved ? '¡Rango alcanzado! 🎉' : `${displayPct.toFixed(1)}% completado`}
                </span>
                {!achieved && next && (
                    <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>
                        Meta: {next.name}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─── Confetti burst for newly achieved ranks ─────────────────── */
function CelebrationBadge({ rank }) {
    if (!rank) return null;
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
            color: 'white', borderRadius: '999px',
            padding: '0.2rem 0.7rem', fontSize: '0.7rem', fontWeight: '800',
            boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
            animation: 'pulse 2s infinite'
        }}>
            🏆 {rank.emoji} {rank.name}
        </div>
    );
}

/* ─── Single affiliate card ───────────────────────────────────── */
function AffiliateCard({ direct, index }) {
    const [expanded, setExpanded] = useState(false);

    const hasQualRank = !!direct.qualification_rank;
    const hasHonorRank = !!direct.honor_rank;
    const isActive = direct.status === 'active';

    // Colour avatar based on status
    const avatarGrad = isActive
        ? 'linear-gradient(135deg,#10b981,#059669)'
        : 'linear-gradient(135deg,#9ca3af,#6b7280)';

    return (
        <div style={{
            background: 'white',
            borderRadius: '1rem',
            border: `1px solid ${isActive ? '#d1fae5' : '#e5e7eb'}`,
            boxShadow: expanded ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'box-shadow 0.3s',
            overflow: 'hidden',
            marginBottom: '0.75rem'
        }}>
            {/* ── Card Header ── */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '1rem 1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: '0.85rem',
                    textAlign: 'left'
                }}
            >
                {/* Avatar */}
                <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: avatarGrad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '1.1rem',
                    flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {direct.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + Double progress bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem', lineHeight: 1.2 }}>
                            {direct.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '500', color: '#6b7280', background: '#f3f4f6', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                            ID: {direct.user_id}
                        </span>
                    </div>

                    {/* Double progress bar: Upper shows Qualification, Lower shows Honor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.4rem', width: '100%', maxWidth: '260px' }} onClick={(e) => { e.stopPropagation(); }}>
                        {/* Qualification Progress (Upper) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#6d28d9', minWidth: '42px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                🏆 Cal.
                            </span>
                            <div style={{ flex: 1, position: 'relative', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, height: '100%',
                                    width: `${direct.qualification_progress_pct || 0}%`,
                                    background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                                    borderRadius: '999px'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#4b5563', minWidth: '26px', textAlign: 'right' }}>
                                {Math.round(direct.qualification_progress_pct || 0)}%
                            </span>
                        </div>

                        {/* Honor Progress (Lower) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#d97706', minWidth: '42px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                💎 Hon.
                            </span>
                            <div style={{ flex: 1, position: 'relative', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, height: '100%',
                                    width: `${direct.honor_progress_pct || 0}%`,
                                    background: 'linear-gradient(90deg, #fbbf24, #d97706)',
                                    borderRadius: '999px'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#4b5563', minWidth: '26px', textAlign: 'right' }}>
                                {Math.round(direct.honor_progress_pct || 0)}%
                            </span>
                        </div>
                    </div>

                    {/* Rank badges inline */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {hasHonorRank && (
                            <span style={{
                                fontSize: '0.62rem', fontWeight: '700', padding: '0.1rem 0.5rem',
                                borderRadius: '999px', background: '#fef3c7', color: '#92400e'
                            }}>
                                {direct.honor_rank.emoji} {direct.honor_rank.name}
                            </span>
                        )}
                        {hasQualRank && (
                            <span style={{
                                fontSize: '0.62rem', fontWeight: '700', padding: '0.1rem 0.5rem',
                                borderRadius: '999px', background: '#ede9fe', color: '#5b21b6'
                            }}>
                                {direct.qualification_rank.emoji} {direct.qualification_rank.name}
                            </span>
                        )}
                        {!hasHonorRank && !hasQualRank && (
                            <span style={{
                                fontSize: '0.62rem', padding: '0.1rem 0.5rem',
                                borderRadius: '999px', background: '#f3f4f6', color: '#9ca3af'
                            }}>
                                Sin rangos aún
                            </span>
                        )}
                    </div>
                </div>

                {/* Status badge */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    background: isActive ? '#d1fae5' : '#f3f4f6',
                    color: isActive ? '#065f46' : '#6b7280',
                    whiteSpace: 'nowrap'
                }}>
                    {isActive ? '✅ Activo' : '⏸️ Inactivo'}
                </span>

                {/* Expand chevron */}
                <span style={{
                    fontSize: '0.9rem', color: '#9ca3af',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.25s'
                }}>▼</span>
            </button>

            {/* ── Expanded Progress Panel ── */}
            {expanded && (
                <div style={{
                    borderTop: '1px solid #f3f4f6',
                    padding: '1rem 1.25rem 1.25rem',
                    background: 'linear-gradient(180deg,#fafafa,#ffffff)'
                }}>
                    {/* Stats row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '0.75rem', marginBottom: '1.25rem'
                    }}>
                        <StatPill label="Comisiones acumuladas" value={`$${(direct.total_earned_usd || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })} USD`} color="#f59e0b" />
                        <StatPill label="Matrices completadas" value={direct.matrix_count ?? 0} color="#8b5cf6" />
                        <StatPill label="Estado red" value={isActive ? 'Activo' : 'Inactivo'} color={isActive ? '#10b981' : '#9ca3af'} />
                    </div>

                    {/* ── Honor Rank Bar ── */}
                    <div style={{
                        background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
                        border: '1px solid #fde68a', borderRadius: '0.75rem',
                        padding: '0.85rem 1rem', marginBottom: '0.75rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400e', marginBottom: '0.6rem' }}>
                            💎 Rango de Honor
                        </div>
                        <RankProgressBar
                            label="Progreso Honor"
                            icon="💰"
                            current={direct.honor_rank}
                            next={direct.next_honor_rank}
                            pct={direct.honor_progress_pct || 0}
                            colorFrom="#f59e0b"
                            colorTo="#d97706"
                            achieved={!direct.next_honor_rank && direct.honor_rank}
                        />
                        {direct.next_honor_rank && (
                            <p style={{ fontSize: '0.68rem', color: '#92400e', margin: 0 }}>
                                Faltan{' '}
                                <strong>${((direct.next_honor_rank.commission) - (direct.total_earned_usd || 0)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} USD</strong>
                                {' '}para{' '}<strong>{direct.next_honor_rank.emoji} {direct.next_honor_rank.name}</strong>
                            </p>
                        )}
                        {!direct.next_honor_rank && direct.honor_rank && (
                            <p style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: '700', margin: 0 }}>
                                🎉 ¡Ha alcanzado el máximo Rango de Honor! ¡Felicitaciones {direct.name.split(' ')[0]}!
                            </p>
                        )}
                    </div>

                    {/* ── Qualification Rank Bar ── */}
                    <div style={{
                        background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                        border: '1px solid #ddd6fe', borderRadius: '0.75rem',
                        padding: '0.85rem 1rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#5b21b6', marginBottom: '0.6rem' }}>
                            🏆 Rango de Calificación
                        </div>
                        <RankProgressBar
                            label="Progreso Calificación"
                            icon="📊"
                            current={direct.qualification_rank}
                            next={direct.next_qualification_rank}
                            pct={direct.qualification_progress_pct || 0}
                            colorFrom="#8b5cf6"
                            colorTo="#6d28d9"
                            achieved={!direct.next_qualification_rank && direct.qualification_rank}
                        />
                        {direct.next_qualification_rank && (
                            <p style={{ fontSize: '0.68rem', color: '#5b21b6', margin: 0 }}>
                                Necesita{' '}
                                <strong>{((direct.next_qualification_rank.matrix_id) - (direct.matrix_count || 0)).toLocaleString()} matrices</strong>
                                {' '}más para{' '}<strong>{direct.next_qualification_rank.emoji} {direct.next_qualification_rank.name}</strong>
                            </p>
                        )}
                        {!direct.next_qualification_rank && direct.qualification_rank && (
                            <p style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: '700', margin: 0 }}>
                                🎉 ¡Ha alcanzado el Rango Diamante! ¡Extraordinario {direct.name.split(' ')[0]}!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Tiny stat pill ──────────────────────────────────────────── */
function StatPill({ label, value, color }) {
    return (
        <div style={{
            background: '#f9fafb', borderRadius: '0.6rem',
            padding: '0.5rem 0.75rem', textAlign: 'center',
            border: '1px solid #f3f4f6'
        }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color }}>{value}</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.15rem', lineHeight: 1.2 }}>{label}</div>
        </div>
    );
}

/* ─── Main page ───────────────────────────────────────────────── */
const DirectsView = () => {
    const [directs, setDirects] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDirects();
    }, []);

    const fetchDirects = async () => {
        setLoading(true);
        try {
            const userRes = await api.get('/auth/me');
            const currentUserId = userRes.data.id;
            const res = await api.get(`/api/unilevel/directs/${currentUserId}`);
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    border: '4px solid #d1fae5', borderTopColor: '#10b981',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ color: '#6b7280', fontWeight: '600' }}>Cargando afiliados y rangos...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const totalActive = directs?.directs?.filter(d => d.status === 'active').length ?? 0;
    const totalWithHonor = directs?.directs?.filter(d => d.honor_rank).length ?? 0;
    const totalWithQual = directs?.directs?.filter(d => d.qualification_rank).length ?? 0;

    return (
        <div style={{ padding: '1.5rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* ── Page Header ── */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeIn 0.5s ease' }}>
                <h1 style={{
                    fontSize: '2rem', fontWeight: '900', marginBottom: '0.35rem',
                    background: 'linear-gradient(135deg,#10b981,#059669)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    👥 Mis Afiliados Directos
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                    Personas que has afiliado personalmente · Progreso de rangos en tiempo real
                </p>
            </div>

            {/* ── Stats Summary ── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
                gap: '1rem', marginBottom: '2rem'
            }}>
                {[
                    { icon: '👤', label: 'Afiliados Directos', value: directs?.total_directs ?? 0, color: '#10b981', sub: 'Nivel 1' },
                    { icon: '🌐', label: 'Total Red', value: directs?.total_network ?? 0, color: '#6366f1', sub: 'Todos los niveles' },
                    { icon: '✅', label: 'Activos', value: totalActive, color: '#059669', sub: 'Con franquicia' },
                    { icon: '💎', label: 'Con Honor Rank', value: totalWithHonor, color: '#f59e0b', sub: 'Honor alcanzado' },
                    { icon: '🏆', label: 'Con Calificación', value: totalWithQual, color: '#8b5cf6', sub: 'Calif. alcanzada' },
                ].map(({ icon, label, value, color, sub }) => (
                    <div key={label} style={{
                        background: 'white', borderRadius: '1rem', padding: '1.25rem 1rem',
                        textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        borderBottom: `4px solid ${color}`, animation: 'fadeIn 0.5s ease'
                    }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>{icon}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '900', color }}>{value}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#374151', marginTop: '0.2rem' }}>{label}</div>
                        <div style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Affiliate List ── */}
            <div style={{
                background: 'white', borderRadius: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                padding: '1.5rem', border: '1px solid #e5e7eb'
            }}>
                <h2 style={{
                    fontSize: '1.15rem', fontWeight: '800', color: '#111827',
                    marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    📋 Lista de Afiliados
                    <span style={{
                        fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '600'
                    }}>
                        Haz clic en una fila para ver rangos
                    </span>
                </h2>

                {directs && directs.total_directs > 0 ? (
                    <div>
                        {directs.directs.map((direct, index) => (
                            <AffiliateCard key={direct.user_id} direct={direct} index={index} />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '3rem 1rem',
                        background: '#f9fafb', borderRadius: '1rem',
                        border: '2px dashed #e5e7eb'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                        <h3 style={{ fontWeight: '800', color: '#374151', marginBottom: '0.5rem' }}>
                            No tienes afiliados directos aún
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            Comienza a invitar personas y construye tu red
                        </p>
                        <div style={{
                            background: 'linear-gradient(135deg,#10b981,#059669)',
                            color: 'white', borderRadius: '0.75rem', padding: '1rem 1.5rem',
                            display: 'inline-block'
                        }}>
                            🎯 Comparte tu código de referido para comenzar
                        </div>
                    </div>
                )}
            </div>

            {/* ── Info Section ── */}
            <div style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: 'white', borderRadius: '1.25rem',
                padding: '1.75rem', marginTop: '1.5rem',
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)'
            }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1.25rem' }}>
                    ℹ️ Rangos y Beneficios de tus Afiliados
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
                    {[
                        { title: '💰 Rango de Honor', body: 'Basado en comisiones acumuladas. Desde $1,000 USD (Silver) hasta $37.7M USD (Diamante Corona Negro). Desbloquea premios exclusivos.' },
                        { title: '🏆 Rango de Calificación', body: 'Basado en matrices completadas. Desde 27 (Consumidor) hasta 100,000 (Diamante). Define cuánto ganan por cada ciclo.' },
                        { title: '🎁 Bono Matching', body: 'Recibes el 50% extra de las comisiones de tus directos. Si ellos ganan $100, tú ganas $50 adicionales.' },
                    ].map(({ title, body }) => (
                        <div key={title} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '0.75rem', padding: '1rem', backdropFilter: 'blur(4px)' }}>
                            <h4 style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{title}</h4>
                            <p style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, margin: 0 }}>{body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DirectsView;
