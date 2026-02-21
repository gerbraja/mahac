import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const SupplierProductsModal = ({ isOpen, onClose, supplier }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'create', 'link'
    const [message, setMessage] = useState('');

    // Categories needed for creation
    const [categories, setCategories] = useState([]);

    // Create/Link Form Data
    const [formData, setFormData] = useState({
        name: '', sku: '', price_usd: 0, stock: 0, category: '', weight_grams: 500, active: true
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (isOpen && supplier) {
            fetchSupplierProducts();
            fetchCategories();
            setView('list');
            setMessage('');
        }
    }, [isOpen, supplier]);

    const fetchSupplierProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/products/?supplier_id=${supplier.id}`);
            setProducts(res.data);
        } catch (error) {
            console.error("Error fetching products", error);
            setMessage('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories/');
            const categoriesArray = Array.isArray(res.data) ? res.data : (res.data.value || []);
            setCategories(categoriesArray.map(cat => cat.name || cat));
        } catch (error) {
            setCategories(['Ropa', 'Tecnología', 'Hogar', 'Salud', 'Otros']); // Fallback
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                supplier_id: supplier.id,
                price_usd: Number(formData.price_usd),
                stock: Number(formData.stock),
                active: true
            };
            await api.post('/api/products/', payload);
            setMessage('Producto creado exitosamente');
            setFormData({ name: '', sku: '', price_usd: 0, stock: 0, category: '', weight_grams: 500, active: true });
            setView('list');
            fetchSupplierProducts();
        } catch (error) {
            setMessage('Error al crear producto');
        }
    };

    const handleSearch = async () => {
        // Fetch all and filter client side (simple for now) or use search API if available
        try {
            const res = await api.get('/api/products/');
            const all = res.data;
            const filtered = all.filter(p =>
                (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                p.supplier_id !== supplier.id // Exclude already linked
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLink = async (product) => {
        try {
            await api.put(`/api/products/${product.id}`, { supplier_id: supplier.id });
            setMessage(`Producto ${product.sku} vinculado`);
            setView('list');
            fetchSupplierProducts();
        } catch (error) {
            setMessage('Error al vincular producto');
        }
    };

    const handleUnlink = async (product) => {
        if (!window.confirm(`¿Desvincular producto ${product.name}?`)) return;
        try {
            await api.put(`/api/products/${product.id}`, { supplier_id: null });
            fetchSupplierProducts();
            setMessage('Producto desvinculado');
        } catch (error) {
            setMessage('Error al desvincular');
        }
    };

    if (!isOpen || !supplier) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        Productos de {supplier.name} (ID: {supplier.id})
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {message && <div style={{ padding: '0.5rem', background: '#e5e7eb', marginBottom: '1rem', borderRadius: '0.25rem' }}>{message}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => setView('list')} style={btnStyle(view === 'list')}>Lista</button>
                    <button onClick={() => setView('create')} style={btnStyle(view === 'create')}>Crear Nuevo</button>
                    <button onClick={() => setView('link')} style={btnStyle(view === 'link')}>Vincular Existente</button>
                </div>

                {view === 'list' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>SKU</th>
                                    <th style={thStyle}>Nombre</th>
                                    <th style={thStyle}>Stock</th>
                                    <th style={thStyle}>Precio</th>
                                    <th style={thStyle}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        background: p.stock < 10 ? '#fee2e2' : 'white'
                                    }}>
                                        <td style={tdStyle}>{p.id}</td>
                                        <td style={tdStyle}>{p.sku || '-'}</td>
                                        <td style={tdStyle}>{p.name}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: p.stock < 10 ? '#dc2626' : 'black' }}>
                                            {p.stock} {p.stock < 10 && '⚠️'}
                                        </td>
                                        <td style={tdStyle}>${p.price_usd}</td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleUnlink(p)} style={dangerBtnStyle}>Desvincular</button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No hay productos asociados.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'create' && (
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input placeholder="Nombre" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={inputStyle} />
                        <input placeholder="SKU (Código)" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required style={inputStyle} />
                        <input type="number" placeholder="Precio USD" value={formData.price_usd} onChange={e => setFormData({ ...formData, price_usd: e.target.value })} required style={inputStyle} />
                        <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required style={inputStyle} />
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required style={{ ...inputStyle, gridColumn: 'span 2' }}>
                            <option value="">Seleccionar Categoría</option>
                            {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </select>
                        <button type="submit" style={primaryBtnStyle}>Guardar Producto</button>
                    </form>
                )}

                {view === 'link' && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                placeholder="Buscar por Nombre o SKU..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ flex: 1, ...inputStyle }}
                            />
                            <button onClick={handleSearch} style={primaryBtnStyle}>Buscar</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {searchResults.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                    <div>
                                        <strong>{p.name}</strong> (SKU: {p.sku}) - ${p.price_usd}
                                    </div>
                                    <button onClick={() => handleLink(p)} style={smallBtnStyle}>Vincular</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles
const btnStyle = (active) => ({
    padding: '0.5rem 1rem',
    background: active ? '#1e3a8a' : '#f3f4f6',
    color: active ? 'white' : 'black',
    border: 'none', borderRadius: '0.25rem', cursor: 'pointer'
});
const inputStyle = { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' };
const primaryBtnStyle = { gridColumn: 'span 2', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const dangerBtnStyle = { background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem' };
const smallBtnStyle = { background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' };
const thStyle = { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' };
const tdStyle = { padding: '0.75rem' };

export default SupplierProductsModal;
