import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const DEFAULT_CATEGORIES = [
    'Ropa y Accesorios', 'Calzado', 'Electrónica', 'Informática',
    'Telefonía y Accesorios', 'Hogar y Decoración', 'Cocina y Electrodomésticos',
    'Belleza y Cuidado Personal', 'Salud y Bienestar', 'Alimentos y Bebidas',
    'Bebés y Maternidad', 'Juguetes y Juegos', 'Deportes y Aire Libre',
    'Mascotas y Animales', 'Libros y Educación', 'Música e Instrumentos',
    'Arte y Manualidades', 'Automovilismo', 'Oficina y Papelería',
    'Jardín y Plantas', 'Otros'
];

const EMPTY_FORM = {
    name: '', description: '', category: '',
    price_usd: 0, price_local: 0,
    pv: 0, direct_bonus_pv: 0,
    stock: 0, weight_grams: 500,
    image_url: '', sku: '',
    is_activation: false,
    supplier_id: null,
    tax_rate: 0
};

const inputStyle = {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
};

const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.25rem'
};

export default function SupplierProductsModal({ supplier, onClose }) {
    const [tab, setTab] = useState('list'); // 'list' | 'create' | 'link'
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [formData, setFormData] = useState({ ...EMPTY_FORM, supplier_id: supplier.id });
    const [linkProductId, setLinkProductId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Edit state ---
    const [editProductId, setEditProductId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchSupplierProducts();
        fetchAllProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories/');
            const arr = Array.isArray(res.data) ? res.data : (res.data.value || []);
            if (arr.length > 0) setCategories(arr.map(c => c.name));
        } catch {
            // use defaults
        }
    };

    const fetchSupplierProducts = async () => {
        try {
            const res = await api.get(`/api/products/?supplier_id=${supplier.id}`);
            setSupplierProducts(res.data);
        } catch (e) {
            console.error('Error fetching supplier products', e);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const res = await api.get('/api/products/');
            setAllProducts(res.data);
        } catch (e) {
            console.error('Error fetching all products', e);
        }
    };

    const showMsg = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 4000);
    };

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: val }));
    };

    // ─── EDIT HANDLERS ────────────────────────────────────────────────
    const startEdit = (p) => {
        setEditProductId(p.id);
        setEditForm({
            name: p.name || '',
            stock: p.stock ?? 0,
            price_local: p.price_local ?? 0,
            price_usd: p.price_usd ?? 0,
            image_url: p.image_url || '',
        });
    };

    const cancelEdit = () => {
        setEditProductId(null);
        setEditForm({});
    };

    const handleSaveEdit = async (productId) => {
        setLoading(true);
        try {
            await api.put(`/api/products/${productId}`, {
                ...editForm,
                stock: Math.round(Number(editForm.stock)),
                price_local: editForm.price_local === '' ? null : Number(editForm.price_local),
                price_usd: Number(editForm.price_usd),
            });
            showMsg('✅ Producto actualizado correctamente');
            cancelEdit();
            fetchSupplierProducts();
        } catch (err) {
            const detail = err.response?.data?.detail || err.message;
            showMsg('❌ Error: ' + (typeof detail === 'object' ? JSON.stringify(detail) : detail));
        } finally {
            setLoading(false);
        }
    };

    // ─── SUSPEND / REACTIVATE ─────────────────────────────────────────
    const handleToggleActive = async (p) => {
        const newActive = !p.active;
        const action = newActive ? 'reactivar' : 'suspender';
        if (!window.confirm(`¿Deseas ${action} el producto "${p.name}"?`)) return;
        try {
            await api.put(`/api/products/${p.id}`, { active: newActive });
            showMsg(newActive ? '✅ Producto reactivado' : '⏸️ Producto suspendido temporalmente');
            // Actualizar localmente sin recargar todo
            setSupplierProducts(prev =>
                prev.map(prod => prod.id === p.id ? { ...prod, active: newActive } : prod)
            );
        } catch {
            showMsg('❌ Error al cambiar el estado del producto');
        }
    };

    // ─── UNLINK ───────────────────────────────────────────────────────
    const handleUnlink = async (productId) => {
        if (!window.confirm('¿Desvincular este producto del proveedor?')) return;
        try {
            await api.put(`/api/products/${productId}`, { supplier_id: null });
            showMsg('✅ Producto desvinculado');
            fetchSupplierProducts();
        } catch {
            showMsg('❌ Error al desvincular');
        }
    };

    // ─── CREATE ───────────────────────────────────────────────────────
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                supplier_id: supplier.id,
                price_usd: Number(formData.price_usd),
                price_local: formData.price_local === '' ? null : Number(formData.price_local),
                pv: Number(formData.pv),
                direct_bonus_pv: Number(formData.direct_bonus_pv),
                stock: Math.round(Number(formData.stock)),
                weight_grams: formData.weight_grams === '' ? 500 : Math.round(Number(formData.weight_grams)),
                tax_rate: Number(formData.tax_rate),
            };
            await api.post('/api/products/', payload);
            showMsg('✅ Producto creado y vinculado al proveedor');
            setFormData({ ...EMPTY_FORM, supplier_id: supplier.id });
            fetchSupplierProducts();
            setTab('list');
        } catch (err) {
            const detail = err.response?.data?.detail || err.message;
            showMsg('❌ Error: ' + (typeof detail === 'object' ? JSON.stringify(detail) : detail));
        } finally {
            setLoading(false);
        }
    };

    // ─── LINK ─────────────────────────────────────────────────────────
    const handleLinkProduct = async () => {
        if (!linkProductId) return;
        setLoading(true);
        try {
            await api.put(`/api/products/${linkProductId}`, { supplier_id: supplier.id });
            showMsg('✅ Producto vinculado exitosamente');
            setLinkProductId('');
            fetchSupplierProducts();
            setTab('list');
        } catch (err) {
            showMsg('❌ Error al vincular el producto');
        } finally {
            setLoading(false);
        }
    };

    const unlinked = allProducts.filter(p => !p.supplier_id || p.supplier_id !== supplier.id);

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '0.75rem',
                width: '100%', maxWidth: '860px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#1e3a8a', borderRadius: '0.75rem 0.75rem 0 0'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '700' }}>
                            📦 Productos de {supplier.name}
                        </h2>
                        <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.8rem' }}>
                            ID Proveedor: {supplier.id}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none',
                        color: 'white', width: '32px', height: '32px',
                        borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    {[
                        { key: 'list', label: '📋 Lista' },
                        { key: 'create', label: '➕ Crear Nuevo' },
                        { key: 'link', label: '🔗 Vincular Existente' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            padding: '0.75rem 1.25rem',
                            border: 'none', cursor: 'pointer',
                            background: tab === t.key ? '#eff6ff' : 'transparent',
                            color: tab === t.key ? '#1e3a8a' : '#6b7280',
                            fontWeight: tab === t.key ? '700' : '400',
                            borderBottom: tab === t.key ? '2px solid #1e3a8a' : '2px solid transparent',
                            fontSize: '0.875rem'
                        }}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Message */}
                    {message && (
                        <div style={{
                            padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                            background: message.startsWith('✅') ? '#d1fae5' : message.startsWith('⏸️') ? '#fef3c7' : '#fee2e2',
                            color: message.startsWith('✅') ? '#065f46' : message.startsWith('⏸️') ? '#92400e' : '#dc2626',
                            fontSize: '0.875rem'
                        }}>{message}</div>
                    )}

                    {/* ═══════════════ LIST TAB ═══════════════ */}
                    {tab === 'list' && (
                        <div>
                            {supplierProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                    <div style={{ fontSize: '3rem' }}>📦</div>
                                    <p>No hay productos vinculados a este proveedor.</p>
                                    <p style={{ fontSize: '0.875rem' }}>Usa "Crear Nuevo" o "Vincular Existente".</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb' }}>
                                            {['SKU', 'Nombre', 'COP', 'USD', 'Stock', 'Estado', 'Acciones'].map(h => (
                                                <th key={h} style={{
                                                    padding: '0.6rem 0.5rem', textAlign: 'left',
                                                    borderBottom: '1px solid #e5e7eb', color: '#374151',
                                                    fontWeight: '600', fontSize: '0.75rem',
                                                    whiteSpace: 'nowrap'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplierProducts.map(p => {
                                            const isLowStock = (p.stock ?? 0) < 10;
                                            const isEditing = editProductId === p.id;
                                            const isActive = p.active !== false; // default true

                                            return (
                                                <React.Fragment key={p.id}>
                                                    {/* ── Fila principal ── */}
                                                    <tr style={{
                                                        borderBottom: isEditing ? 'none' : '1px solid #f3f4f6',
                                                        background: !isActive ? '#f8fafc' : isLowStock ? '#fff7ed' : 'white',
                                                        opacity: !isActive ? 0.7 : 1
                                                    }}>
                                                        {/* SKU */}
                                                        <td style={{ padding: '0.5rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                                            {p.sku || `P-${p.id}`}
                                                        </td>
                                                        {/* Nombre */}
                                                        <td style={{ padding: '0.5rem', fontWeight: '500', maxWidth: '180px' }}>
                                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.name}
                                                            </div>
                                                            {isLowStock && isActive && (
                                                                <span style={{
                                                                    fontSize: '0.65rem',
                                                                    background: '#fef3c7', color: '#92400e',
                                                                    padding: '0.1rem 0.3rem', borderRadius: '9999px'
                                                                }}>⚠️ Stock bajo</span>
                                                            )}
                                                        </td>
                                                        {/* COP */}
                                                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                                                            {p.price_local ? `$${Number(p.price_local).toLocaleString('es-CO')}` : '—'}
                                                        </td>
                                                        {/* USD */}
                                                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                                                            ${Number(p.price_usd).toFixed(2)}
                                                        </td>
                                                        {/* Stock */}
                                                        <td style={{
                                                            padding: '0.5rem',
                                                            color: isLowStock ? '#ef4444' : '#374151',
                                                            fontWeight: isLowStock ? '700' : '400'
                                                        }}>
                                                            {p.stock ?? 0}
                                                        </td>
                                                        {/* Estado */}
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '9999px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: '700',
                                                                background: isActive ? '#d1fae5' : '#fef3c7',
                                                                color: isActive ? '#065f46' : '#92400e',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {isActive ? '● Activo' : '⏸ Suspendido'}
                                                            </span>
                                                        </td>
                                                        {/* Acciones */}
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'nowrap' }}>
                                                                {/* Editar */}
                                                                <button
                                                                    onClick={() => isEditing ? cancelEdit() : startEdit(p)}
                                                                    title="Editar producto"
                                                                    style={{
                                                                        background: isEditing ? '#e5e7eb' : '#dbeafe',
                                                                        color: isEditing ? '#374151' : '#1e40af',
                                                                        border: 'none', padding: '0.25rem 0.45rem',
                                                                        borderRadius: '0.25rem', cursor: 'pointer',
                                                                        fontSize: '0.7rem', whiteSpace: 'nowrap'
                                                                    }}>
                                                                    {isEditing ? '✖ Cerrar' : '✏️ Editar'}
                                                                </button>
                                                                {/* Suspender / Reactivar */}
                                                                <button
                                                                    onClick={() => handleToggleActive(p)}
                                                                    title={isActive ? 'Suspender temporalmente' : 'Reactivar producto'}
                                                                    style={{
                                                                        background: isActive ? '#fef3c7' : '#d1fae5',
                                                                        color: isActive ? '#92400e' : '#065f46',
                                                                        border: 'none', padding: '0.25rem 0.45rem',
                                                                        borderRadius: '0.25rem', cursor: 'pointer',
                                                                        fontSize: '0.7rem', whiteSpace: 'nowrap'
                                                                    }}>
                                                                    {isActive ? '⏸ Suspender' : '▶ Reactivar'}
                                                                </button>
                                                                {/* Desvincular */}
                                                                <button
                                                                    onClick={() => handleUnlink(p.id)}
                                                                    title="Desvincular del proveedor"
                                                                    style={{
                                                                        background: '#fee2e2', color: '#dc2626',
                                                                        border: 'none', padding: '0.25rem 0.45rem',
                                                                        borderRadius: '0.25rem', cursor: 'pointer',
                                                                        fontSize: '0.7rem', whiteSpace: 'nowrap'
                                                                    }}>
                                                                    🔓 Desvincular
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* ── Fila de edición inline ── */}
                                                    {isEditing && (
                                                        <tr>
                                                            <td colSpan={7} style={{
                                                                padding: '0.75rem 0.5rem 1rem',
                                                                borderBottom: '2px solid #bfdbfe',
                                                                background: '#eff6ff'
                                                            }}>
                                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.6rem' }}>
                                                                    ✏️ Editando: <span style={{ fontFamily: 'monospace' }}>{p.sku || `P-${p.id}`}</span>
                                                                </div>
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                                                    gap: '0.6rem'
                                                                }}>
                                                                    {/* Nombre */}
                                                                    <div style={{ gridColumn: 'span 2' }}>
                                                                        <label style={labelStyle}>Nombre</label>
                                                                        <input
                                                                            value={editForm.name}
                                                                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                                            style={{ ...inputStyle, fontSize: '0.8rem' }}
                                                                        />
                                                                    </div>
                                                                    {/* Stock */}
                                                                    <div>
                                                                        <label style={labelStyle}>Stock</label>
                                                                        <input
                                                                            type="number" min="0"
                                                                            value={editForm.stock}
                                                                            onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
                                                                            style={{ ...inputStyle, fontSize: '0.8rem' }}
                                                                        />
                                                                    </div>
                                                                    {/* Precio COP */}
                                                                    <div>
                                                                        <label style={labelStyle}>Precio COP</label>
                                                                        <input
                                                                            type="number" min="0" step="100"
                                                                            value={editForm.price_local}
                                                                            onChange={e => setEditForm(f => ({ ...f, price_local: e.target.value }))}
                                                                            style={{ ...inputStyle, fontSize: '0.8rem' }}
                                                                        />
                                                                    </div>
                                                                    {/* Precio USD */}
                                                                    <div>
                                                                        <label style={labelStyle}>Precio USD</label>
                                                                        <input
                                                                            type="number" min="0" step="0.01"
                                                                            value={editForm.price_usd}
                                                                            onChange={e => setEditForm(f => ({ ...f, price_usd: e.target.value }))}
                                                                            style={{ ...inputStyle, fontSize: '0.8rem' }}
                                                                        />
                                                                    </div>
                                                                    {/* URL Imagen */}
                                                                    <div style={{ gridColumn: 'span 2' }}>
                                                                        <label style={labelStyle}>URL Imagen</label>
                                                                        <input
                                                                            type="url"
                                                                            value={editForm.image_url}
                                                                            onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                                                                            placeholder="https://storage.googleapis.com/..."
                                                                            style={{ ...inputStyle, fontSize: '0.8rem' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {/* Botones guardar/cancelar */}
                                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                                    <button
                                                                        onClick={() => handleSaveEdit(p.id)}
                                                                        disabled={loading}
                                                                        style={{
                                                                            background: loading ? '#93c5fd' : '#1e3a8a',
                                                                            color: 'white', border: 'none',
                                                                            padding: '0.4rem 1rem', borderRadius: '0.375rem',
                                                                            cursor: loading ? 'not-allowed' : 'pointer',
                                                                            fontWeight: '700', fontSize: '0.8rem'
                                                                        }}>
                                                                        {loading ? 'Guardando...' : '✅ Guardar cambios'}
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        style={{
                                                                            background: '#e5e7eb', color: '#374151',
                                                                            border: 'none', padding: '0.4rem 1rem',
                                                                            borderRadius: '0.375rem', cursor: 'pointer',
                                                                            fontSize: '0.8rem'
                                                                        }}>
                                                                        ❌ Cancelar
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ═══════════════ CREATE TAB ═══════════════ */}
                    {tab === 'create' && (
                        <form onSubmit={handleCreateProduct} style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'
                        }}>
                            {/* Nombre */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Nombre del producto *</label>
                                <input name="name" value={formData.name} onChange={handleChange}
                                    placeholder="Nombre del producto" style={inputStyle} required />
                            </div>

                            {/* Categoría */}
                            <div>
                                <label style={labelStyle}>Categoría *</label>
                                <select name="category" value={formData.category} onChange={handleChange}
                                    style={inputStyle} required>
                                    <option value="">Seleccionar Categoría</option>
                                    {categories.map((cat, i) => (
                                        <option key={i} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* SKU */}
                            <div>
                                <label style={labelStyle}>SKU (Código de producto)</label>
                                <input name="sku" value={formData.sku} onChange={handleChange}
                                    placeholder="Ej: BON-001" style={inputStyle} />
                            </div>

                            {/* Descripción */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Descripción del producto</label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    placeholder="Descripción del producto" rows={3}
                                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
                            </div>

                            {/* Precio COP */}
                            <div>
                                <label style={labelStyle}>💰 Precio Final COP (Pesos Colombianos) *</label>
                                <input type="number" name="price_local" value={formData.price_local}
                                    onChange={handleChange} placeholder="Ej: 150000" step="100"
                                    style={inputStyle} />
                            </div>

                            {/* Tasa de IVA */}
                            <div>
                                <label style={labelStyle}>🧾 Tasa IVA (DIAN)</label>
                                <select name="tax_rate" value={formData.tax_rate} onChange={handleChange}
                                    style={inputStyle}>
                                    <option value={0}>0% — Exento / No aplica</option>
                                    <option value={0.05}>5% — Tasa reducida</option>
                                    <option value={0.19}>19% — Tarifa general</option>
                                </select>
                            </div>

                            {/* Calculadora Inversa DIAN */}
                            <div style={{ gridColumn: 'span 2', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '0.85rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0c4a6e', marginBottom: '0.5rem' }}>🧮 Calculadora Inversa DIAN</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#475569' }}>Precio Final Público:</span>
                                    <strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(formData.price_local || 0)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#475569' }}>Precio Neto (Base Facturación):</span>
                                    <strong style={{ color: '#16a34a' }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((formData.price_local || 0) / (1 + Number(formData.tax_rate)))}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid #bae6fd', paddingTop: '0.4rem' }}>
                                    <span style={{ color: '#475569' }}>Monto Impuesto ({(Number(formData.tax_rate) * 100).toFixed(0)}%):</span>
                                    <strong style={{ color: '#dc2626' }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((formData.price_local || 0) - (formData.price_local || 0) / (1 + Number(formData.tax_rate)))}</strong>
                                </div>
                            </div>

                            {/* Precio USD */}
                            <div>
                                <label style={labelStyle}>💵 Precio USD *</label>
                                <input type="number" name="price_usd" value={formData.price_usd}
                                    onChange={handleChange} placeholder="Ej: 35.00" step="0.01"
                                    style={inputStyle} required />
                            </div>

                            {/* PV */}
                            <div>
                                <label style={labelStyle}>Puntos de Volumen (PV)</label>
                                <input type="number" name="pv" value={formData.pv}
                                    onChange={handleChange} placeholder="Ej: 1.7" step="0.01"
                                    style={inputStyle} />
                            </div>

                            {/* Bono Directo PV */}
                            <div>
                                <label style={labelStyle}>Bono Directo (PV)</label>
                                <input type="number" name="direct_bonus_pv" value={formData.direct_bonus_pv}
                                    onChange={handleChange} placeholder="Ej: 1.3" step="0.01"
                                    style={inputStyle} />
                            </div>

                            {/* Stock */}
                            <div>
                                <label style={labelStyle}>Stock disponible</label>
                                <input type="number" name="stock" value={formData.stock}
                                    onChange={handleChange} placeholder="Ej: 100" step="1"
                                    style={inputStyle} />
                            </div>

                            {/* Peso */}
                            <div>
                                <label style={labelStyle}>Peso en gramos</label>
                                <input type="number" name="weight_grams" value={formData.weight_grams}
                                    onChange={handleChange} placeholder="Ej: 500" step="1"
                                    style={inputStyle} />
                            </div>

                            {/* URL Imagen */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>URL de la imagen del producto</label>
                                <input type="url" name="image_url" value={formData.image_url}
                                    onChange={handleChange} placeholder="https://..."
                                    style={inputStyle} />
                            </div>

                            {/* Es Activación */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name="is_activation"
                                        checked={formData.is_activation} onChange={handleChange}
                                        style={{ width: '16px', height: '16px' }} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                        ¿Es un Paquete de Activación?
                                    </span>
                                </label>
                            </div>

                            {/* Submit */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '0.75rem',
                                    background: loading ? '#93c5fd' : '#1e3a8a',
                                    color: 'white', border: 'none', borderRadius: '0.5rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: '700', fontSize: '0.95rem'
                                }}>
                                    {loading ? 'Guardando...' : '✅ Guardar Producto'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══════════════ LINK TAB ═══════════════ */}
                    {tab === 'link' && (
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                Selecciona un producto existente para vincularlo a este proveedor.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select
                                    value={linkProductId}
                                    onChange={e => setLinkProductId(e.target.value)}
                                    style={{ ...inputStyle, flex: 1 }}
                                >
                                    <option value="">— Seleccionar producto —</option>
                                    {unlinked.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku || `ID:${p.id}`})
                                        </option>
                                    ))}
                                </select>
                                <button onClick={handleLinkProduct} disabled={!linkProductId || loading} style={{
                                    padding: '0.5rem 1.25rem',
                                    background: linkProductId ? '#1e3a8a' : '#9ca3af',
                                    color: 'white', border: 'none', borderRadius: '0.5rem',
                                    cursor: linkProductId ? 'pointer' : 'not-allowed',
                                    fontWeight: '600', whiteSpace: 'nowrap'
                                }}>
                                    🔗 Vincular
                                </button>
                            </div>

                            {unlinked.length === 0 && (
                                <p style={{ color: '#9ca3af', marginTop: '1rem', fontSize: '0.875rem' }}>
                                    Todos los productos ya están vinculados a un proveedor.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
