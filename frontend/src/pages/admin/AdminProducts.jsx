import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

const SimpleAdmin = () => {
    const { globalCountry } = useAdmin();
    // Categorías predefinidas como fallback
    const DEFAULT_CATEGORIES = [
        'Ropa y Accesorios',
        'Calzado',
        'Electrónica',
        'Informática',
        'Telefonía y Accesorios',
        'Hogar y Decoración',
        'Cocina y Electrodomésticos',
        'Belleza y Cuidado Personal',
        'Salud y Bienestar',
        'Alimentos y Bebidas',
        'Bebés y Maternidad',
        'Juguetes y Juegos',
        'Deportes y Aire Libre',
        'Mascotas y Animales',
        'Libros y Educación',
        'Música e Instrumentos',
        'Arte y Manualidades',
        'Automovilismo',
        'Oficina y Papelería',
        'Jardín y Plantas',
        'Otros'
    ];

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price_usd: 0,
        price_local: 0,
        pv: 0,
        stock: 0,
        weight_grams: 500,
        image_url: '',
        is_activation: false,
        direct_bonus_pv: 0,
        cost_price: 0,
        tei_pv: 0,
        tax_rate: 0,
        public_price: 0,
        sku: '',
        supplier_id: '',
        dian_code: '',
        tax_type: 'IVA',
        options_name: '',
        options_values: ''
    });
    const [suppliers, setSuppliers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSuppliers();
    }, [globalCountry]);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/api/suppliers/');
            setSuppliers(res.data);
        } catch (error) {
            console.error("Error fetching suppliers");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories/');
            // El endpoint devuelve { value: [...], Count: 21 }
            const categoriesArray = Array.isArray(res.data) ? res.data : (res.data.value || []);
            if (categoriesArray && categoriesArray.length > 0) {
                // Extraer solo los nombres de las categorías
                const categoryNames = categoriesArray.map(cat => cat.name);
                setCategories(categoryNames);
                console.log('✅ Categorías cargadas desde la API:', categoryNames.length);
            } else {
                console.log("⚠️ No se encontraron categorías, usando predefinidas");
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (error) {
            console.log("Usando categorías predefinidas. Error al cargar desde API:", error.message);
            // Usar las predefinidas si hay error
            setCategories(DEFAULT_CATEGORIES);
        }
    };

    const fetchProducts = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const res = await api.get(`/api/products/?${queryParams.toString()}`);
            setProducts(res.data);
        } catch (error) {
            console.error("Error fetching products", error);
            setMessage('Error al cargar productos');
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Sanitize form data: convert empty strings to null for optional numeric fields
            const sanitizedData = {
                ...formData,
                price_local: formData.price_local === '' || formData.price_local === null ? null : Number(formData.price_local),
                price_eur: formData.price_eur === '' || formData.price_eur === null ? null : Number(formData.price_eur),
                weight_grams: formData.weight_grams === '' || formData.weight_grams === null ? 500 : Math.round(Number(formData.weight_grams)),
                price_usd: Number(formData.price_usd),
                pv: Number(formData.pv),
                direct_bonus_pv: Number(formData.direct_bonus_pv),
                tei_pv: Math.round(Number(formData.tei_pv)),
                stock: Math.round(Number(formData.stock)), // Stock must be an integer
                cost_price: Number(formData.cost_price),
                tax_rate: Number(formData.tax_rate),
                public_price: Number(formData.public_price),
                sku: formData.sku,
                supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
                dian_code: formData.dian_code,
                tax_type: formData.tax_type,
                options: formData.options_name && formData.options_values 
                    ? JSON.stringify({ [formData.options_name.trim()]: formData.options_values.split(',').map(v => v.trim()).filter(v => v) })
                    : null
            };

            if (editingId) {
                await api.put(`/api/products/${editingId}`, sanitizedData);
                setMessage('Producto actualizado exitosamente');
            } else {
                await api.post('/api/products/', sanitizedData);
                setMessage('Producto creado exitosamente');
            }
            setFormData({
                name: '', description: '', category: '', price_usd: 0, price_local: 0, pv: 0, direct_bonus_pv: 0, stock: 0, weight_grams: 500, image_url: '', is_activation: false,
                cost_price: 0, tei_pv: 0, tax_rate: 0, public_price: 0, sku: '', supplier_id: '', dian_code: '', tax_type: 'IVA', options_name: '', options_values: ''
            });
            setEditingId(null);
            fetchProducts();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving product", error);
            const errorDetail = error.response?.data?.detail || error.message || 'Error desconocido';
            const errorMsg = typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail;
            setMessage('Error al guardar producto: ' + errorMsg);
        }
    };

    const handleEdit = (product) => {
        let optName = '';
        let optVals = '';
        if (product.options) {
            try {
                const optObj = JSON.parse(product.options);
                const key = Object.keys(optObj)[0];
                if (key) {
                    optName = key;
                    optVals = optObj[key].join(', ');
                }
            } catch (e) {
                console.error("Error parsing options", e);
            }
        }
    
        setFormData({
            ...product,
            options_name: optName,
            options_values: optVals
        });
        setEditingId(product.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            try {
                await api.delete(`/api/products/${id}`);
                setMessage('Producto eliminado');
                fetchProducts();
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error("Error deleting product", error);
                setMessage('Error al eliminar producto');
            }
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e3a8a' }}>
                Gestión de Productos
            </h2>

            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={async () => {
                        try {
                            const response = await api.get('/api/products/template', { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', 'plantilla_productos.csv');
                            document.body.appendChild(link);
                            link.click();
                            link.parentNode.removeChild(link);
                        } catch (error) {
                            console.error("Error downloading template", error);
                            setMessage('Error al descargar la plantilla');
                        }
                    }}
                    style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: 'fit-content'
                    }}
                >
                    📥 Descargar Plantilla CSV (Carga Masiva)
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                    color: message.includes('Error') ? '#dc2626' : '#065f46',
                    border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#6ee7b7'}`
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
            }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e3a8a' }}>
                        {editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}
                    </h2>
                </div>

                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    required
                />
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    required
                >
                    <option value="">Seleccionar Categoría</option>
                    {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                    ))}
                </select>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descripción del producto"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', gridColumn: 'span 2', fontFamily: 'Arial' }}
                    rows="30"
                />
                <input
                    type="number"
                    name="price_usd"
                    value={formData.price_usd}
                    onChange={handleChange}
                    placeholder="Precio USD"
                    step="0.01"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    required
                />
                <input
                    type="number"
                    name="price_local"
                    value={formData.price_local}
                    onChange={handleChange}
                    placeholder="Precio Final COP (Pesos Colombianos)"
                    step="100"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <select
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                    <option value={0}>IVA: 0% (Exento)</option>
                    <option value={0.05}>IVA: 5%</option>
                    <option value={0.19}>IVA: 19%</option>
                </select>

                <select
                    name="tax_type"
                    value={formData.tax_type}
                    onChange={handleChange}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                    <option value="IVA">Tipo Impuesto: IVA</option>
                    <option value="INC">Tipo Impuesto: INC</option>
                    <option value="Exento">Tipo Impuesto: Exento</option>
                </select>
                
                <input
                    name="dian_code"
                    value={formData.dian_code}
                    onChange={handleChange}
                    placeholder="Código DIAN"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />

                {/* Section for Product Options/Variants */}
                <div style={{
                    gridColumn: 'span 2',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <strong style={{ color: '#166534', fontSize: '1rem', marginBottom: '0.25rem' }}>👕 Opciones/Variantes del Producto (Opcional)</strong>
                    <p style={{ color: '#15803d', fontSize: '0.85rem', margin: 0 }}>
                        Permite al cliente elegir una variante antes de comprar (ej. Talla, Capacidad, Color). 
                        No necesitas subir fotos por cada variante.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <input
                            name="options_name"
                            value={formData.options_name}
                            onChange={handleChange}
                            placeholder="Nombre Opción (Ej: Talla)"
                            style={{ padding: '0.5rem', border: '1px solid #86efac', borderRadius: '0.25rem' }}
                        />
                        <input
                            name="options_values"
                            value={formData.options_values}
                            onChange={handleChange}
                            placeholder="Valores separados por coma (Ej: S, M, L, XL)"
                            style={{ padding: '0.5rem', border: '1px solid #86efac', borderRadius: '0.25rem' }}
                        />
                    </div>
                    {formData.options_name && formData.options_values && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold' }}>Vista previa ({formData.options_name}):</span>
                            {formData.options_values.split(',').map(v => v.trim()).filter(v => v).map((val, idx) => (
                                <span key={idx} style={{ background: '#bbf7d0', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {val}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Visual Inverse VAT Calculator Component */}
                <div style={{
                    gridColumn: 'span 2',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>🧮 Calculadora Inversa DIAN</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>Precio Final Público:</span>
                        <span style={{ fontWeight: 'bold' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(formData.price_local || 0)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>Precio Neto (Base Facturación):</span>
                        <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((formData.price_local || 0) / (1 + Number(formData.tax_rate)))}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Monto Impuesto ({(Number(formData.tax_rate) * 100).toFixed(0)}%):</span>
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((formData.price_local || 0) - ((formData.price_local || 0) / (1 + Number(formData.tax_rate))))}
                        </span>
                    </div>
                </div>

                <input
                    type="number"
                    name="pv"
                    value={formData.pv}
                    onChange={handleChange}
                    placeholder="Puntos de Volumen (PV)"
                    step="0.01"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <input
                    type="number"
                    name="direct_bonus_pv"
                    value={formData.direct_bonus_pv}
                    onChange={handleChange}
                    placeholder="Bono Directo (PV)"
                    step="0.01"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Stock disponible"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <input
                    type="number"
                    name="weight_grams"
                    value={formData.weight_grams}
                    onChange={handleChange}
                    placeholder="Peso en gramos (ej: 500)"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="URL de la imagen del producto"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
                    <input
                        type="checkbox"
                        name="is_activation"
                        checked={formData.is_activation}
                        onChange={handleChange}
                    />
                    <span>¿Es un Paquete de Activación?</span>
                </label>
                <button
                    type="submit"
                    style={{
                        gridColumn: 'span 2',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {editingId ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
                {editingId && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                name: '', description: '', category: '', price_usd: 0, price_local: 0, pv: 0, direct_bonus_pv: 0, stock: 0, weight_grams: 500, image_url: '', is_activation: false,
                                cost_price: 0, tei_pv: 0, tax_rate: 0, public_price: 0, sku: '', supplier_id: '', dian_code: '', tax_type: 'IVA', options_name: '', options_values: ''
                            });
                        }}
                        style={{
                            gridColumn: 'span 2',
                            background: '#6b7280',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar Edición
                    </button>
                )}
            </form>

            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Categoría</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Variantes</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Precio USD</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>IVA</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>PV</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            let variantsStr = "Ninguna";
                            let variantsColor = "#9ca3af";
                            if (p.options) {
                                try {
                                    const parsed = JSON.parse(p.options);
                                    if (Object.keys(parsed).length > 0) {
                                        const key = Object.keys(parsed)[0];
                                        variantsStr = `${key}: ${parsed[key].join(', ')}`;
                                        variantsColor = "#3b82f6";
                                    }
                                } catch(e) {}
                            }
                            return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem' }}>
                                    {p.name}
                                    {p.is_activation && <span style={{ marginLeft: '0.5rem' }} title="Paquete de Activación">✅</span>}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{p.category}</td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: variantsColor, fontWeight: variantsStr !== 'Ninguna' ? 'bold' : 'normal' }}>
                                    {variantsStr}
                                </td>
                                <td style={{ padding: '0.75rem' }}>${p.price_usd}</td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: p.tax_rate > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                    {p.tax_rate ? `${(p.tax_rate * 100).toFixed(0)}%` : '0%'}
                                </td>
                                <td style={{ padding: '0.75rem' }}>{p.pv}</td>
                                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(p)}
                                        style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.25rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.25rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        No hay productos creados aún. ¡Crea el primero!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleAdmin;
