import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/api';

export default function SupplierInventory() {
    const { token } = useParams();
    const [supplierData, setSupplierData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchInventory();
    }, [token]);

    const fetchInventory = async () => {
        try {
            const res = await api.get(`/api/suppliers/inventory/${token}`);
            setSupplierData({
                name: res.data.supplier_name,
                contact: res.data.contact_name
            });
            const loadedProducts = res.data.products.map(p => {
                let parsedOptions = null;
                let variant_stock = {};
                if (p.options) {
                    try {
                        const optObj = JSON.parse(p.options);
                        const key = Object.keys(optObj)[0];
                        if (key && optObj[key].length > 0) {
                            parsedOptions = { name: key, values: optObj[key] };
                            if (p.variant_stock) {
                                variant_stock = JSON.parse(p.variant_stock);
                            } else {
                                optObj[key].forEach(v => { variant_stock[v] = 0; });
                            }
                        }
                    } catch(e) {}
                }
                return { ...p, parsedOptions, variant_stock };
            });
            setProducts(loadedProducts);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.detail || 'Enlace inválido o caducado.');
            setLoading(false);
        }
    };

    const handleStockChange = (productId, newStock) => {
        setProducts(products.map(p => 
            p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
        ));
    };

    const handleVariantStockChange = (productId, variant, newStock) => {
        setProducts(products.map(p => {
            if (p.id === productId) {
                const maxStock = Math.max(0, newStock);
                const updatedVariantStock = { ...p.variant_stock, [variant]: maxStock };
                const totalStock = Object.values(updatedVariantStock).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
                return { ...p, variant_stock: updatedVariantStock, stock: totalStock };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccessMsg('');
        
        try {
            const updates = products.map(p => ({
                product_id: p.id,
                stock: p.stock,
                variant_stock: p.parsedOptions ? p.variant_stock : null
            }));
            
            await api.put(`/api/suppliers/inventory/${token}`, { updates });
            
            setSuccessMsg('¡Inventario guardado con éxito! Ya puedes cerrar esta ventana.');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError('Error al guardar el inventario. Asegúrate de tener conexión a internet.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', borderTop: '3px solid #3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando tus productos...</p>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error && !supplierData) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', padding: '1rem' }}>
                <div style={{ padding: '2rem', background: 'white', border: '1px solid #fca5a5', borderRadius: '1rem', textAlign: 'center', maxWidth: '400px' }}>
                    <h2 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Enlace Inválido</h2>
                    <p style={{ color: '#7f1d1d' }}>{error}</p>
                    <p style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '1rem' }}>Comunícate con el administrador de TEI para solicitar un nuevo enlace de inventario.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
            fontFamily: "'Inter', sans-serif",
            paddingBottom: '100px' // Space for fixed bottom bar
        }}>
            {/* Header */}
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(10px)',
                padding: '1.5rem', 
                borderBottom: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0369a1', margin: 0 }}>
                        Comercializadora TEI
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Actualización de Inventario: <span style={{ fontWeight: '600', color: '#0f172a' }}>{supplierData.name}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    Ingresa la cantidad exacta de unidades que tienes disponibles para despachar inmediatamente. 
                    <strong> Recuerda que la plataforma TEI no venderá por encima de tu inventario reportado.</strong>
                </p>

                {error && (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '1rem', background: '#dcfce3', color: '#166534', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>✅</span> {successMsg}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1rem', color: '#64748b' }}>
                            <p>No tienes productos asignados para control de inventario.</p>
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} style={{
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                transition: 'transform 0.2s',
                                '@media (max-width: 600px)': {
                                    flexDirection: 'column',
                                    alignItems: 'stretch'
                                }
                            }}>
                                {/* Product Image */}
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '0.75rem', 
                                    background: '#f1f5f9', 
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem' }}>📦</span>
                                    )}
                                </div>
                                
                                {/* Product Info */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{product.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        {product.sku && <span>SKU: {product.sku}</span>}
                                        {product.dian_code && <span>DIAN: {product.dian_code}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600', marginTop: '0.25rem' }}>
                                        Stock actual TEI: {product.stock}
                                    </div>
                                </div>

                                {/* Stock Control */}
                                {product.parsedOptions ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
                                        {product.parsedOptions.values.map(variant => (
                                            <div key={variant} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{product.parsedOptions.name}: {variant}</span>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <button onClick={() => handleVariantStockChange(product.id, variant, (product.variant_stock[variant] || 0) - 1)} style={{ width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}>-</button>
                                                    <input type="number" value={product.variant_stock[variant] || 0} onChange={(e) => handleVariantStockChange(product.id, variant, parseInt(e.target.value) || 0)} style={{ width: '40px', height: '30px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: '#0f172a' }} />
                                                    <button onClick={() => handleVariantStockChange(product.id, variant, (product.variant_stock[variant] || 0) + 1)} style={{ width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}>+</button>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Stock Multi-Talla Global: {product.stock}</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #e2e8f0' }}>
                                        <button 
                                            onClick={() => handleStockChange(product.id, product.stock - 1)}
                                            style={{ width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number"
                                            value={product.stock}
                                            onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                                            style={{ width: '60px', height: '40px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: '#0f172a' }}
                                        />
                                        <button 
                                            onClick={() => handleStockChange(product.id, product.stock + 1)}
                                            style={{ width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            {products.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    padding: '1rem',
                    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
                    borderTop: '1px solid #e2e8f0',
                    zIndex: 20
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: saving ? '#93c5fd' : '#0284c7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontSize: '1.125rem',
                                fontWeight: '700',
                                boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.4)',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s, transform 0.1s',
                            }}
                        >
                            {saving ? '☁️ Guardando...' : '💾 Confirmar y Guardar Inventario'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
