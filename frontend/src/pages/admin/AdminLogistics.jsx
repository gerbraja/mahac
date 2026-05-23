import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/api';

// ─── Status badge helper ───────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        preparando:  { label: 'Preparando',  cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        en_transito: { label: 'En Tránsito', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
        recibido:    { label: 'Recibido',    cls: 'bg-green-100 text-green-700 border-green-200' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
    return (
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.cls}`}>
            {s.label}
        </span>
    );
};

// ─── Main Component ────────────────────────────────────────────────────
const AdminLogistics = () => {
    // ── State: batches panel ──────────────────────────────
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    // ── State: create-batch form ──────────────────────────
    const [pickupPoints, setPickupPoints]     = useState([]);
    const [selectedPoint, setSelectedPoint]   = useState('');
    const [masterTracking, setMasterTracking] = useState('');
    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [loadingOrders, setLoadingOrders]   = useState(false);
    const [creating, setCreating]             = useState(false);

    // ── State: general ────────────────────────────────────
    const [toast, setToast]   = useState(null);   // { type: 'ok'|'err', msg }
    const [error, setError]   = useState('');

    // ── Toast helper ──────────────────────────────────────
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch all batches ─────────────────────────────────
    const fetchBatches = useCallback(async () => {
        setLoadingBatches(true);
        try {
            const res = await api.get('/api/logistics/batches');
            setBatches(res.data);
        } catch {
            setError('No se pudieron cargar los bultos.');
        } finally {
            setLoadingBatches(false);
        }
    }, []);

    // ── Fetch pickup points (all active) ──────────────────
    const fetchPickupPoints = useCallback(async () => {
        try {
            const res = await api.get('/api/pickup-points/?active_only=true');
            setPickupPoints(res.data);
        } catch {
            setError('No se pudieron cargar los puntos de recogida.');
        }
    }, []);

    // ── Fetch eligible orders when point changes ──────────
    const fetchEligibleOrders = useCallback(async (pointId) => {
        if (!pointId) { setEligibleOrders([]); return; }
        setLoadingOrders(true);
        setSelectedOrders(new Set());
        try {
            const res = await api.get(`/api/logistics/orders-for-batch?pickup_point_id=${pointId}`);
            setEligibleOrders(res.data);
        } catch {
            showToast('err', 'Error al cargar las órdenes para ese punto.');
            setEligibleOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    useEffect(() => {
        fetchBatches();
        fetchPickupPoints();
    }, [fetchBatches, fetchPickupPoints]);

    useEffect(() => {
        fetchEligibleOrders(selectedPoint);
    }, [selectedPoint, fetchEligibleOrders]);

    // ── Toggle order selection ────────────────────────────
    const toggleOrder = (id) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedOrders.size === eligibleOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(eligibleOrders.map(o => o.id)));
        }
    };

    // ── Create batch ──────────────────────────────────────
    const handleCreateBatch = async () => {
        if (!selectedPoint) { showToast('err', 'Selecciona un punto de recogida.'); return; }
        if (selectedOrders.size === 0) { showToast('err', 'Selecciona al menos una orden.'); return; }

        setCreating(true);
        try {
            const payload = {
                pickup_point_id: Number(selectedPoint),
                order_ids: Array.from(selectedOrders),
                master_tracking: masterTracking || null,
            };
            await api.post('/api/logistics/batches', payload);
            showToast('ok', '✅ Bulto creado exitosamente.');
            setSelectedPoint('');
            setMasterTracking('');
            setSelectedOrders(new Set());
            setEligibleOrders([]);
            fetchBatches();
        } catch (err) {
            showToast('err', err.response?.data?.detail || 'Error al crear el bulto.');
        } finally {
            setCreating(false);
        }
    };

    // ── Ship batch ────────────────────────────────────────
    const handleShipBatch = async (batchId) => {
        try {
            await api.post(`/api/logistics/batches/${batchId}/ship`);
            showToast('ok', '🚀 Bulto marcado como EN TRÁNSITO.');
            fetchBatches();
        } catch (err) {
            showToast('err', err.response?.data?.detail || err.message);
        }
    };

    const copyPublicLink = (token) => {
        const link = `${window.location.origin}/punto-de-entrega/${token}`;
        navigator.clipboard.writeText(link);
        showToast('ok', '🔗 Enlace copiado. Envíalo al encargado del punto.');
    };

    // ─── Group pickup points by country for the dropdown ──
    const groupedPoints = pickupPoints.reduce((acc, p) => {
        const key = p.country || 'Colombia';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const selectedPointData = pickupPoints.find(p => p.id === Number(selectedPoint));

    // ─── JSX ───────────────────────────────────────────────
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
                    padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600,
                    fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    background: toast.type === 'ok' ? '#dcfce7' : '#fee2e2',
                    color: toast.type === 'ok' ? '#166534' : '#991b1b',
                    border: `1px solid ${toast.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
                    transition: 'all 0.3s ease',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        📦 Gestión de Bultos Consolidados
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Agrupa pedidos por zona y punto de recogida
                    </p>
                </div>
                <button
                    onClick={fetchBatches}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                    🔄 Refrescar
                </button>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* ══════════════ LEFT: Create Batch Form ══════════════ */}
                <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>NUEVO</span>
                        Crear Bulto
                    </h2>

                    {/* 1. Pickup Point selector */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📍 Punto de Recogida (Zona)
                        </label>
                        <select
                            value={selectedPoint}
                            onChange={e => setSelectedPoint(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="">— Selecciona un punto —</option>
                            {Object.entries(groupedPoints).map(([country, pts]) => (
                                <optgroup key={country} label={`🌎 ${country}`}>
                                    {pts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — {p.city}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {selectedPointData && (
                            <div style={{ marginTop: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#166534' }}>
                                📌 {selectedPointData.address} · {selectedPointData.city}, {selectedPointData.country}
                            </div>
                        )}
                    </div>

                    {/* 2. Master tracking */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🏷️ Guía Maestra <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={masterTracking}
                            onChange={e => setMasterTracking(e.target.value)}
                            placeholder="Ej: IRR-20250522-001"
                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* 3. Eligible orders */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📋 Órdenes Elegibles
                            </label>
                            {eligibleOrders.length > 0 && (
                                <button
                                    onClick={toggleAll}
                                    style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {selectedOrders.size === eligibleOrders.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                </button>
                            )}
                        </div>

                        {!selectedPoint ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.85rem' }}>
                                ☝️ Selecciona un punto de recogida para ver las órdenes disponibles
                            </div>
                        ) : loadingOrders ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                                ⏳ Buscando órdenes...
                            </div>
                        ) : eligibleOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#fefce8', borderRadius: '12px', border: '2px dashed #fde68a', color: '#92400e', fontSize: '0.85rem' }}>
                                😕 No hay órdenes elegibles para esta zona.<br />
                                <span style={{ fontSize: '0.75rem', color: '#b45309' }}>Las órdenes deben tener el punto de recogida asignado y estar sin bulto.</span>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                                {eligibleOrders.map((order, idx) => {
                                    const isSelected = selectedOrders.has(order.id);
                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => toggleOrder(order.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.65rem 0.9rem',
                                                borderBottom: idx < eligibleOrders.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                cursor: 'pointer',
                                                background: isSelected ? '#eff6ff' : 'transparent',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                                                border: isSelected ? '2px solid #2563eb' : '2px solid #cbd5e1',
                                                background: isSelected ? '#2563eb' : '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {isSelected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                                                    #{order.id} · {order.customer_name}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                                                    {order.items_count} ítem(s) · {order.status}
                                                    {order.total_cop > 0 && ` · $${Number(order.total_cop).toLocaleString('es-CO')}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Selected count */}
                        {selectedOrders.size > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textAlign: 'right' }}>
                                {selectedOrders.size} orden(es) seleccionada(s)
                            </div>
                        )}
                    </div>

                    {/* Create button */}
                    <button
                        onClick={handleCreateBatch}
                        disabled={creating || !selectedPoint || selectedOrders.size === 0}
                        style={{
                            marginTop: '1.25rem', width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none',
                            fontWeight: 700, fontSize: '0.95rem', cursor: (creating || !selectedPoint || selectedOrders.size === 0) ? 'not-allowed' : 'pointer',
                            background: (creating || !selectedPoint || selectedOrders.size === 0) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#fff', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                        }}
                    >
                        {creating ? '⏳ Creando bulto...' : `📦 Crear Bulto (${selectedOrders.size} órdenes)`}
                    </button>
                </div>

                {/* ══════════════ RIGHT: Active Batches ══════════════ */}
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: '#f0fdf4', color: '#166534', borderRadius: '8px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>
                            {batches.length}
                        </span>
                        Bultos Registrados
                    </h2>

                    {loadingBatches ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>⏳ Cargando bultos...</div>
                    ) : batches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                            <p style={{ color: '#94a3b8', fontWeight: 600, margin: 0 }}>No hay bultos creados aún.</p>
                            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                                Usa el formulario de la izquierda para crear tu primer bulto.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {batches.map(batch => (
                                <div
                                    key={batch.id}
                                    style={{
                                        background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        borderLeft: `5px solid ${batch.is_active ? (batch.status === 'en_transito' ? '#3b82f6' : batch.status === 'recibido' ? '#22c55e' : '#f59e0b') : '#cbd5e1'}`,
                                        opacity: batch.is_active ? 1 : 0.6,
                                        transition: 'box-shadow 0.2s',
                                    }}
                                >
                                    <div style={{ padding: '1rem 1.1rem' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    Bulto #{batch.id}
                                                </p>
                                                <h3 style={{ margin: '0.15rem 0 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                                                    📍 {batch.pickup_point?.name || 'Punto de Entrega'}
                                                </h3>
                                                <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                                                    {batch.pickup_point?.city}
                                                </p>
                                            </div>
                                            <StatusBadge status={batch.status} />
                                        </div>

                                        {/* Tracking */}
                                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Guía Maestra</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                                {batch.master_tracking_number || '—'}
                                            </span>
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
                                            <div style={{ flex: 1, textAlign: 'center', background: '#eff6ff', borderRadius: '8px', padding: '0.4rem' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{batch.orders_count || 0}</div>
                                                <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 600 }}>Pedidos</div>
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', borderRadius: '8px', padding: '0.4rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#22c55e' }}>~40kg</div>
                                                <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>Capacidad</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {batch.status === 'preparando' && batch.is_active === 1 && (
                                                <button
                                                    onClick={() => handleShipBatch(batch.id)}
                                                    style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                                >
                                                    🚀 Marcar como EN CAMINO
                                                </button>
                                            )}
                                            <button
                                                onClick={() => window.open(`${api.defaults.baseURL}/api/logistics/batches/${batch.id}/manifest`, '_blank')}
                                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                            >
                                                📄 Ver Manifiesto
                                            </button>
                                            {batch.is_active === 1 ? (
                                                <button
                                                    onClick={() => copyPublicLink(batch.token_access)}
                                                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                                >
                                                    🔗 Copiar Link para Encargado
                                                </button>
                                            ) : (
                                                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#ef4444', background: '#fef2f2', borderRadius: '8px', padding: '0.45rem', margin: 0, fontWeight: 600 }}>
                                                    ⚠️ Enlace expirado (nueva carga enviada)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogistics;
