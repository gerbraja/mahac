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

    const INITIAL_FORM_STATE = {
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
        is_upgrade: false,
        direct_bonus_pv: 0,
        cost_price: 0,
        supplier_has_iva: false,
        supplier_iva_rate: 0.19,
        supplier_withholding_rate: 0,
        compensation_budget_cop: 0,
        matrix_reserve_cop: 0,
        travel_pool_cop: 0,
        company_profit_cop: 0,
        tei_pv: 0,
        tax_rate: 0,
        public_price: 0,
        sku: '',
        supplier_id: '',
        package_level: 0,
        dian_code: '',
        tax_type: 'IVA',
        options_list: [],
        shipping_class: 'normal',
        available_countries: ['Colombia']
    };

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [suppliers, setSuppliers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [customTrm, setCustomTrm] = useState('');
    const [trmLoading, setTrmLoading] = useState(false);

    const formatCOP = (val) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

    // ─── Cálculos en tiempo real de Costos, Retenciones y Ganancia Neta TEI ───
    const isPackageProduct = Boolean(formData.is_activation || formData.is_upgrade);
    const salePriceCOP = Number(formData.price_local || 0);
    const saleTaxRate = Number(formData.tax_rate || 0);
    const saleNetBaseCOP = saleTaxRate > 0 ? salePriceCOP / (1 + saleTaxRate) : salePriceCOP;
    const saleIvaCOP = salePriceCOP - saleNetBaseCOP;

    const manufacturerBaseCOP = Number(formData.cost_price || 0);
    const supplierHasIva = Boolean(formData.supplier_has_iva);
    const supplierIvaRate = supplierHasIva ? Number(formData.supplier_iva_rate || 0.19) : 0;
    const supplierWithholdingRate = !supplierHasIva ? Number(formData.supplier_withholding_rate || 0) : 0;

    const supplierIvaCOP = manufacturerBaseCOP * supplierIvaRate;
    const supplierWithholdingCOP = manufacturerBaseCOP * supplierWithholdingRate;
    const supplierNetPayoutCOP = manufacturerBaseCOP + supplierIvaCOP - supplierWithholdingCOP;
    const supplierTotalCostCOP = manufacturerBaseCOP + supplierIvaCOP;

    const compBudgetCOP = isPackageProduct ? 0 : Number(formData.compensation_budget_cop || 0);
    const matrixReserveCOP = isPackageProduct ? Number(formData.matrix_reserve_cop || 0) : 0;
    const travelPoolCOP = isPackageProduct ? Number(formData.travel_pool_cop || 0) : 0;

    const calculatedCompanyProfitCOP = Math.round(
        saleNetBaseCOP - supplierTotalCostCOP - compBudgetCOP - matrixReserveCOP - travelPoolCOP
    );
    const calculatedMarginPercent = salePriceCOP > 0
        ? ((calculatedCompanyProfitCOP / salePriceCOP) * 100).toFixed(1)
        : '0.0';

    useEffect(() => {
        fetchSuggestedTrm();
    }, []);

    const fetchSuggestedTrm = async () => {
        try {
            const resp = await axios.get('https://open.er-api.com/v6/latest/USD');
            if (resp.data && resp.data.rates && resp.data.rates.COP) {
                setCustomTrm(resp.data.rates.COP.toFixed(2));
            }
        } catch (e) {
            console.error("Error fetching TRM recommendation", e);
        }
    };

    const handleSyncTrm = async () => {
        const val = parseFloat(customTrm);
        if (!val || val <= 0) {
            alert("Por favor ingresa una TRM válida mayor a 0");
            return;
        }
        if (!window.confirm(`¿Estás seguro de recalcular el precio en dólares de todos los productos usando una TRM de $${val.toFixed(2)} COP?\n\nLos precios en USD se calcularán como: Precio Pesos / TRM.`)) {
            return;
        }
        setTrmLoading(true);
        try {
            const response = await api.post('/api/products/sync-trm', {
                custom_trm: val
            });
            setMessage(`¡Éxito! Precios en dólares actualizados con TRM $${response.data.trm} COP. Productos actualizados: ${response.data.updated_products}.`);
            fetchProducts();
        } catch (error) {
            console.error("Error syncing TRM", error);
            setMessage(error.response?.data?.detail || 'Error al actualizar precios con la TRM');
        } finally {
            setTrmLoading(false);
        }
    };

    const COUNTRIES = [
        'Colombia', 'Panamá', 'República Dominicana', 'Costa Rica', 
        'Paraguay', 'Uruguay', 'Argentina', 'Brasil', 'Ecuador', 
        'Perú', 'Bolivia', 'Chile', 'Venezuela', 'Guatemala',
        'El Salvador', 'Honduras', 'Nicaragua', 'Belice'
    ];

    const handleCountryToggle = (country) => {
        setFormData(prev => {
            const current = prev.available_countries || [];
            if (current.includes(country)) {
                return { ...prev, available_countries: current.filter(c => c !== country) };
            } else {
                return { ...prev, available_countries: [...current, country] };
            }
        });
    };

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
            const categoriesArray = Array.isArray(res.data) ? res.data : (res.data.value || []);
            if (categoriesArray && categoriesArray.length > 0) {
                const categoryNames = categoriesArray.map(cat => cat.name);
                setCategories(categoryNames);
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (error) {
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

    // --- Gestión de variantes dinámicas ---
    const handleOptionChange = (index, field, value) => {
        const updated = [...formData.options_list];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, options_list: updated });
    };

    const addOption = () => {
        setFormData({ ...formData, options_list: [...formData.options_list, { name: '', values: '' }] });
    };

    const removeOption = (index) => {
        const updated = formData.options_list.filter((_, i) => i !== index);
        setFormData({ ...formData, options_list: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sanitizedData = {
                ...formData,
                price_local: formData.price_local === '' || formData.price_local === null ? null : Number(formData.price_local),
                price_eur: formData.price_eur === '' || formData.price_eur === null ? null : Number(formData.price_eur),
                weight_grams: formData.weight_grams === '' || formData.weight_grams === null ? 500 : Math.round(Number(formData.weight_grams)),
                price_usd: Number(formData.price_usd),
                pv: Number(formData.pv),
                direct_bonus_pv: Number(formData.direct_bonus_pv),
                tei_pv: Math.round(Number(formData.tei_pv)),
                stock: Math.round(Number(formData.stock)),
                cost_price: Number(formData.cost_price || 0),
                supplier_has_iva: Boolean(formData.supplier_has_iva),
                supplier_iva_rate: Boolean(formData.supplier_has_iva) ? Number(formData.supplier_iva_rate || 0.19) : 0,
                supplier_withholding_rate: !formData.supplier_has_iva ? Number(formData.supplier_withholding_rate || 0) : 0,
                compensation_budget_cop: isPackageProduct ? 0 : Number(formData.compensation_budget_cop || 0),
                matrix_reserve_cop: isPackageProduct ? Number(formData.matrix_reserve_cop || 0) : 0,
                travel_pool_cop: isPackageProduct ? Number(formData.travel_pool_cop || 0) : 0,
                company_profit_cop: calculatedCompanyProfitCOP,
                tax_rate: Number(formData.tax_rate),
                public_price: Number(formData.public_price),
                sku: formData.sku,
                supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
                package_level: Number(formData.package_level || 0),
                dian_code: formData.dian_code,
                tax_type: formData.tax_type,
                options: formData.options_list && formData.options_list.length > 0
                    ? (() => {
                        const obj = {};
                        formData.options_list.forEach(opt => {
                            if (opt.name.trim() && opt.values.trim()) {
                                obj[opt.name.trim()] = opt.values.split(',').map(v => v.trim()).filter(v => v);
                            }
                        });
                        return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
                    })()
                    : null,
                shipping_class: formData.shipping_class || 'normal',
                available_countries: JSON.stringify(formData.available_countries || ['Colombia'])
            };

            if (editingId) {
                await api.put(`/api/products/${editingId}`, sanitizedData);
                setMessage('Producto actualizado exitosamente');
            } else {
                await api.post('/api/products/', sanitizedData);
                setMessage('Producto creado exitosamente');
            }
            setFormData(INITIAL_FORM_STATE);
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
        let optionsList = [];
        if (product.options) {
            try {
                const optObj = JSON.parse(product.options);
                optionsList = Object.keys(optObj).map(key => ({
                    name: key,
                    values: optObj[key].join(', ')
                }));
            } catch (e) {
                console.error("Error parsing options", e);
            }
        }
    
        let countriesList = ['Colombia'];
        if (product.available_countries) {
            try {
                countriesList = JSON.parse(product.available_countries);
            } catch (e) {}
        }
    
        setFormData({
            ...INITIAL_FORM_STATE,
            ...product,
            cost_price: product.cost_price ?? 0,
            supplier_has_iva: Boolean(product.supplier_has_iva),
            supplier_iva_rate: product.supplier_iva_rate ? Number(product.supplier_iva_rate) : 0.19,
            supplier_withholding_rate: product.supplier_withholding_rate ? Number(product.supplier_withholding_rate) : 0,
            compensation_budget_cop: product.compensation_budget_cop ?? 0,
            matrix_reserve_cop: product.matrix_reserve_cop ?? 0,
            travel_pool_cop: product.travel_pool_cop ?? 0,
            company_profit_cop: product.company_profit_cop ?? 0,
            options_list: optionsList,
            available_countries: countriesList
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

            {/* TRM Synchronization Controls */}
            <div style={{
                background: '#f3f4f6',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                border: '1px solid #e5e7eb'
            }}>
                <div>
                    <h4 style={{ margin: 0, fontWeight: 'bold', color: '#1e3a8a', fontSize: '1rem' }}>
                        💵 Ajustar Tasa de Cambio (TRM COP/USD)
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#4b5563' }}>
                        Recalcula todos los precios en dólares dividiendo el precio en Pesos por la tasa indicada.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.25rem', padding: '0.25rem 0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#6b7280', marginRight: '0.25rem' }}>$1 USD =</span>
                        <input
                            type="number"
                            value={customTrm}
                            onChange={(e) => setCustomTrm(e.target.value)}
                            placeholder="Ej: 4000"
                            style={{
                                width: '100px',
                                border: 'none',
                                outline: 'none',
                                padding: '0.25rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                color: '#1e3a8a'
                            }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>COP</span>
                    </div>
                    <button
                        onClick={handleSyncTrm}
                        disabled={trmLoading}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            opacity: trmLoading ? 0.6 : 1
                        }}
                    >
                        {trmLoading ? 'Sincronizando...' : '🔄 Aplicar Tasa'}
                    </button>
                </div>
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
                    rows="6"
                />
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        💵 Precio Final en Dólares (USD)
                    </label>
                    <input
                        type="number"
                        name="price_usd"
                        value={formData.price_usd}
                        onChange={handleChange}
                        placeholder="Precio USD"
                        step="0.01"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        🇨🇴 Precio Definitivo al Público (COP)
                    </label>
                    <input
                        type="number"
                        name="price_local"
                        value={formData.price_local}
                        onChange={handleChange}
                        placeholder="Precio Final COP (Pesos Colombianos)"
                        step="100"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    />
                </div>
                <select
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                    <option value={0}>IVA Venta Público: 0% (Exento)</option>
                    <option value={0.05}>IVA Venta Público: 5%</option>
                    <option value={0.19}>IVA Venta Público: 19%</option>
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

                <select
                    name="supplier_id"
                    value={formData.supplier_id || ''}
                    onChange={handleChange}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                >
                    <option value="">Fabricante / Proveedor (Opcional)</option>
                    {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                {/* Section for Product Options/Variants */}
                <div style={{
                    gridColumn: 'span 2',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#166534', fontSize: '1rem' }}>👕 Opciones/Variantes del Producto (Opcional)</strong>
                        <button
                            type="button"
                            onClick={addOption}
                            style={{
                                background: '#16a34a', color: 'white',
                                border: 'none', borderRadius: '0.4rem',
                                padding: '0.35rem 0.9rem', cursor: 'pointer',
                                fontWeight: 'bold', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '0.3rem'
                            }}
                        >
                            ＋ Añadir Variante
                        </button>
                    </div>
                    <p style={{ color: '#15803d', fontSize: '0.82rem', margin: 0 }}>
                        Agrega las variantes que necesites: <strong>Color</strong>, <strong>Talla</strong>, etc.
                        El cliente podrá elegir cada opción antes de comprar.
                    </p>

                    {formData.options_list.length === 0 && (
                        <p style={{ color: '#86efac', fontSize: '0.82rem', fontStyle: 'italic', margin: 0 }}>
                            Sin variantes. Haz clic en "＋ Añadir Variante" para agregar Color, Talla, u otras opciones.
                        </p>
                    )}

                    {formData.options_list.map((opt, index) => (
                        <div key={index} style={{
                            background: 'white',
                            border: '1px solid #86efac',
                            borderRadius: '0.4rem',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534' }}>
                                    Variante #{index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    title="Eliminar esta variante"
                                    style={{
                                        background: '#fee2e2', color: '#dc2626',
                                        border: '1px solid #fca5a5', borderRadius: '0.3rem',
                                        padding: '0.2rem 0.6rem', cursor: 'pointer',
                                        fontWeight: 'bold', fontSize: '0.85rem'
                                    }}
                                >
                                    ✕ Eliminar
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                                <input
                                    value={opt.name}
                                    onChange={e => handleOptionChange(index, 'name', e.target.value)}
                                    placeholder="Nombre (Ej: Color, Talla)"
                                    style={{ padding: '0.5rem', border: '1px solid #86efac', borderRadius: '0.25rem', outline: 'none' }}
                                />
                                <input
                                    value={opt.values}
                                    onChange={e => handleOptionChange(index, 'values', e.target.value)}
                                    placeholder="Valores separados por coma (Ej: 1-Rojo, 2-Azul, 3-Verde)"
                                    style={{ padding: '0.5rem', border: '1px solid #86efac', borderRadius: '0.25rem', outline: 'none' }}
                                />
                            </div>
                            {opt.name && opt.values && (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 'bold' }}>
                                        {opt.name}:
                                    </span>
                                    {opt.values.split(',').map(v => v.trim()).filter(v => v).map((val, i) => (
                                        <span key={i} style={{
                                            background: '#bbf7d0', color: '#166534',
                                            padding: '0.15rem 0.5rem', borderRadius: '1rem',
                                            fontSize: '0.75rem', fontWeight: 'bold'
                                        }}>
                                            {val}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tipo de Producto: Normal vs Paquete de Activación / Avance */}
                <div style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#1e3a8a', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="is_activation"
                            checked={formData.is_activation}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>📦 ¿Es un Paquete de Activación?</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#1e3a8a', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="is_upgrade"
                            checked={formData.is_upgrade}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>⬆️ ¿Es un Paquete de Avance (Upgrade)?</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                        <label style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.9rem' }}>Nivel Franquicia:</label>
                        <select
                            name="package_level"
                            value={formData.package_level}
                            onChange={handleChange}
                            style={{ padding: '0.45rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                        >
                            <option value={0}>0 - Producto Normal (Sin Franquicia)</option>
                            <option value={1}>1 - Franquicia Nivel 1 (FDI 1)</option>
                            <option value={2}>2 - Franquicia Nivel 2 (FDI 2 / Upgrade)</option>
                            <option value={3}>3 - Franquicia Nivel 3</option>
                            <option value={4}>4 - Franquicia Nivel 4</option>
                            <option value={5}>5 - Franquicia Nivel 5</option>
                            <option value={6}>6 - Franquicia Nivel 6</option>
                            <option value={7}>7 - Franquicia Nivel 7</option>
                        </select>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* NUEVO MÓDULO: COSTOS DEL FABRICANTE, RETENCIONES Y GANANCIA NETA DE TEI   */}
                {/* ========================================================================= */}
                <div style={{
                    gridColumn: 'span 2',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                    border: '2px solid #93c5fd',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.15rem', fontWeight: 'bold' }}>
                            🏭 Costos del Fabricante, Impuestos y Distribución de Ganancia TEI
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#475569' }}>
                            Registra el precio real del fabricante, si cobra IVA o si se le practica retención, y cuánto dinero se destina a {isPackageProduct ? 'Matrices y Premios en Viajes' : 'los Planes de Compensación'}.
                        </p>
                    </div>

                    {/* Fila 1: Costo Fabricante + IVA / Retención Fabricante */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.35rem' }}>
                                🏷️ Precio Base del Fabricante (COP)
                            </label>
                            <input
                                type="number"
                                name="cost_price"
                                value={formData.cost_price}
                                onChange={handleChange}
                                placeholder="Ej: 45000"
                                step="100"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #94a3b8', borderRadius: '0.35rem', fontWeight: 'bold', fontSize: '1rem' }}
                            />
                            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                                Lo que cobra el fabricante antes de impuestos.
                            </span>
                        </div>

                        <div style={{ background: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.35rem' }}>
                                🧾 ¿El Fabricante cobra IVA?
                            </label>
                            <select
                                value={formData.supplier_has_iva ? 'yes' : 'no'}
                                onChange={(e) => {
                                    const hasIva = e.target.value === 'yes';
                                    setFormData(prev => ({
                                        ...prev,
                                        supplier_has_iva: hasIva,
                                        supplier_iva_rate: hasIva ? (prev.supplier_iva_rate || 0.19) : 0,
                                        supplier_withholding_rate: hasIva ? 0 : prev.supplier_withholding_rate
                                    }));
                                }}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #94a3b8', borderRadius: '0.35rem', fontWeight: 'bold' }}
                            >
                                <option value="no">❌ No cobra IVA (Régimen No Responsable / Cuenta de Cobro)</option>
                                <option value="yes">✅ Sí cobra IVA (Factura Electrónica con IVA)</option>
                            </select>
                            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                                Define si el proveedor factura con IVA o sin IVA.
                            </span>
                        </div>

                        {formData.supplier_has_iva ? (
                            <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #93c5fd' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.35rem' }}>
                                    📈 Tarifa de IVA del Fabricante
                                </label>
                                <select
                                    name="supplier_iva_rate"
                                    value={formData.supplier_iva_rate}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #60a5fa', borderRadius: '0.35rem', fontWeight: 'bold' }}
                                >
                                    <option value={0.19}>IVA 19% ({formatCOP(manufacturerBaseCOP * 0.19)})</option>
                                    <option value={0.05}>IVA 5% ({formatCOP(manufacturerBaseCOP * 0.05)})</option>
                                </select>
                                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 'bold' }}>
                                    Total Factura Fabricante: {formatCOP(supplierTotalCostCOP)}
                                </span>
                            </div>
                        ) : (
                            <div style={{ background: '#fffbeb', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.35rem' }}>
                                    ✂️ Retención al Fabricante (Por NO cobrar IVA)
                                </label>
                                <select
                                    name="supplier_withholding_rate"
                                    value={formData.supplier_withholding_rate}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #f59e0b', borderRadius: '0.35rem', fontWeight: 'bold' }}
                                >
                                    <option value={0}>0% - Sin Retención ($0)</option>
                                    <option value={0.025}>2.5% - ReteFuente Compras ({formatCOP(manufacturerBaseCOP * 0.025)})</option>
                                    <option value={0.035}>3.5% - ReteFuente No Declarante ({formatCOP(manufacturerBaseCOP * 0.035)})</option>
                                    <option value={0.04}>4.0% - ReteFuente Servicios ({formatCOP(manufacturerBaseCOP * 0.04)})</option>
                                    <option value={0.10}>10.0% - Honorarios ({formatCOP(manufacturerBaseCOP * 0.10)})</option>
                                    <option value={0.11}>11.0% - Honorarios Declarante ({formatCOP(manufacturerBaseCOP * 0.11)})</option>
                                </select>
                                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#b45309', fontWeight: 'bold' }}>
                                    Giro Neto al Fabricante: {formatCOP(supplierNetPayoutCOP)} (Retenido: {formatCOP(supplierWithholdingCOP)})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Fila 2: Dinero para Planes de Compensación (Producto) VS Matrices y Viajes (Paquete) */}
                    {!isPackageProduct ? (
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#166534' }}>
                                    🤝 Dinero del Producto destinado a pagar Planes de Compensación (COP)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const suggested = Math.round((Number(formData.pv || 0) + Number(formData.direct_bonus_pv || 0)) * 4500);
                                        setFormData(prev => ({ ...prev, compensation_budget_cop: suggested }));
                                    }}
                                    style={{
                                        background: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.35rem',
                                        padding: '0.3rem 0.75rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ⚡ Sugerir desde PV ({formatCOP((Number(formData.pv || 0) + Number(formData.direct_bonus_pv || 0)) * 4500)})
                                </button>
                            </div>
                            <input
                                type="number"
                                name="compensation_budget_cop"
                                value={formData.compensation_budget_cop}
                                onChange={handleChange}
                                placeholder="Monto en COP destinado a pagar la Red (Unilevel, Binario, Patrocinio)"
                                step="100"
                                style={{ width: '100%', padding: '0.55rem', border: '1px solid #4ade80', borderRadius: '0.35rem', fontWeight: 'bold', fontSize: '1rem' }}
                            />
                            <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                                Este valor se descuenta del precio de venta para saber exactamente cuánta ganancia libre le queda a TEI.
                            </span>
                        </div>
                    ) : (
                        <div style={{
                            background: '#faf5ff',
                            border: '1px solid #d8b4fe',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#7e22ce', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    MODO PAQUETE / FRANQUICIA
                                </span>
                                <strong style={{ color: '#581c87', fontSize: '0.9rem' }}>
                                    En Paquetes no se pagan Planes de Compensación tradicionales; se aparta el dinero de Matrices y Premios en Viajes:
                                </strong>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid #e9d5ff' }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#6b21a8', marginBottom: '0.3rem' }}>
                                        🔷 Dinero para Activar las Matrices (COP)
                                    </label>
                                    <input
                                        type="number"
                                        name="matrix_reserve_cop"
                                        value={formData.matrix_reserve_cop}
                                        onChange={handleChange}
                                        placeholder="Ej: 120000"
                                        step="100"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #c084fc', borderRadius: '0.35rem', fontWeight: 'bold', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid #e9d5ff' }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#6b21a8', marginBottom: '0.3rem' }}>
                                        ✈️ Dinero para Premios en Viajes / Bóvedas (COP)
                                    </label>
                                    <input
                                        type="number"
                                        name="travel_pool_cop"
                                        value={formData.travel_pool_cop}
                                        onChange={handleChange}
                                        placeholder="Ej: 45000"
                                        step="100"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #c084fc', borderRadius: '0.35rem', fontWeight: 'bold', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tarjeta Simulador en Tiempo Real de Ganancia Neta TEI */}
                    <div style={{
                        background: '#0f172a',
                        color: 'white',
                        borderRadius: '0.6rem',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>
                                📊 Simulador en Vivo: ¿Cuánto le queda a la Empresa TEI por unidad vendida?
                            </strong>
                            <span style={{
                                background: calculatedCompanyProfitCOP >= 0 ? '#065f46' : '#991b1b',
                                color: calculatedCompanyProfitCOP >= 0 ? '#6ee7b7' : '#fca5a5',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                Margen: {calculatedMarginPercent}%
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                            <span style={{ color: '#cbd5e1' }}>(+) Precio Definitivo al Público:</span>
                            <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{formatCOP(salePriceCOP)}</span>
                        </div>

                        {saleIvaCOP > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: '#94a3b8' }}>(-) IVA Venta al Público ({(saleTaxRate * 100).toFixed(0)}%):</span>
                                <span style={{ color: '#fca5a5' }}>- {formatCOP(saleIvaCOP)}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                            <span style={{ color: '#cbd5e1' }}>
                                (-) Costo Fabricante {supplierHasIva ? `(Base ${formatCOP(manufacturerBaseCOP)} + IVA ${formatCOP(supplierIvaCOP)})` : `(Sin IVA)`}:
                            </span>
                            <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>- {formatCOP(supplierTotalCostCOP)}</span>
                        </div>

                        {!supplierHasIva && supplierWithholdingCOP > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingLeft: '1rem', color: '#fde68a' }}>
                                <span>↳ Retención practicada al fabricante ({(supplierWithholdingRate * 100).toFixed(1)}%): {formatCOP(supplierWithholdingCOP)} | Giro neto al fabricante:</span>
                                <strong>{formatCOP(supplierNetPayoutCOP)}</strong>
                            </div>
                        )}

                        {!isPackageProduct ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span style={{ color: '#cbd5e1' }}>(-) Dinero destinado a Planes de Compensación:</span>
                                <span style={{ color: '#f472b6', fontWeight: 'bold' }}>- {formatCOP(compBudgetCOP)}</span>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                    <span style={{ color: '#cbd5e1' }}>(-) Dinero para Activar Matrices:</span>
                                    <span style={{ color: '#c084fc', fontWeight: 'bold' }}>- {formatCOP(matrixReserveCOP)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                    <span style={{ color: '#cbd5e1' }}>(-) Dinero para Premios en Viajes / Fondos:</span>
                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>- {formatCOP(travelPoolCOP)}</span>
                                </div>
                            </>
                        )}

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '2px solid #334155',
                            paddingTop: '0.65rem',
                            marginTop: '0.25rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ color: '#4ade80' }}>(=) GANANCIA NETA LIBRE PARA LA EMPRESA TEI:</span>
                            <span style={{
                                fontSize: '1.3rem',
                                color: calculatedCompanyProfitCOP >= 0 ? '#4ade80' : '#f87171'
                            }}>
                                {formatCOP(calculatedCompanyProfitCOP)}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        ⭐ Puntos de Volumen (PV)
                    </label>
                    <input
                        type="number"
                        name="pv"
                        value={formData.pv}
                        onChange={handleChange}
                        placeholder="Puntos de Volumen (PV)"
                        step="0.01"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        🎯 Bono Directo (PV)
                    </label>
                    <input
                        type="number"
                        name="direct_bonus_pv"
                        value={formData.direct_bonus_pv}
                        onChange={handleChange}
                        placeholder="Bono Directo (PV)"
                        step="0.01"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        📦 Stock Disponible
                    </label>
                    <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Stock disponible"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.25rem' }}>
                        ⚖️ Peso en Gramos (ej: 500)
                    </label>
                    <input
                        type="number"
                        name="weight_grams"
                        value={formData.weight_grams}
                        onChange={handleChange}
                        placeholder="Peso en gramos (ej: 500)"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    />
                </div>
                <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="URL de la imagen del producto"
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', gridColumn: 'span 2' }}
                />

                {/* Opciones de Flete */}
                <div style={{ gridColumn: 'span 2', padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#1e3a8a' }}>🚚 Clase de Envío (Política de Flete)</strong>
                    <select
                        name="shipping_class"
                        value={formData.shipping_class || 'normal'}
                        onChange={handleChange}
                        style={{ padding: '0.5rem', border: '1px solid #93c5fd', borderRadius: '0.25rem', width: '100%', outline: 'none' }}
                    >
                        <option value="normal">Normal (El cliente paga flete completo)</option>
                        <option value="subsidized">Subsidiado (Cubre máximo $17.700. Ej: Zapatos, Ropa.)</option>
                        <option value="free">Totalmente Gratis (100% cubierto. Ej: Lavadoras o Envío Local)</option>
                    </select>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#3b82f6' }}>
                        Nota: Si el valor de la orden pasa el umbral de Envío Gratis ($490.000), se otorgará de igual forma el Subsidio de $17.700 a todo el conjunto.
                    </p>
                </div>

                {/* Países Disponibles */}
                <div style={{ gridColumn: 'span 2', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#92400e' }}>🌎 Países Disponibles</strong>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#b45309' }}>
                        Selecciona en qué países se mostrará este producto en la tienda.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                        {COUNTRIES.map(country => (
                            <label key={country} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#78350f' }}>
                                <input
                                    type="checkbox"
                                    checked={(formData.available_countries || []).includes(country)}
                                    onChange={() => handleCountryToggle(country)}
                                    style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                />
                                {country}
                            </label>
                        ))}
                    </div>
                </div>

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
                            setFormData(INITIAL_FORM_STATE);
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

            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Precio Público</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Costo Fabricante</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Red / Matrices / Viajes</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Ganancia TEI</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Stock</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>PV</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            const isPkg = Boolean(p.is_activation || p.is_upgrade);
                            const pSale = Number(p.price_local || 0);
                            const pSaleTax = Number(p.tax_rate || 0);
                            const pNetSale = pSaleTax > 0 ? pSale / (1 + pSaleTax) : pSale;
                            const pBaseCost = Number(p.cost_price || 0);
                            const pSupIva = p.supplier_has_iva ? pBaseCost * Number(p.supplier_iva_rate || 0.19) : 0;
                            const pSupWh = !p.supplier_has_iva ? pBaseCost * Number(p.supplier_withholding_rate || 0) : 0;
                            const pComp = Number(p.compensation_budget_cop || 0);
                            const pMat = Number(p.matrix_reserve_cop || 0);
                            const pTrav = Number(p.travel_pool_cop || 0);
                            const pProfit = p.company_profit_cop && p.company_profit_cop !== 0
                                ? Number(p.company_profit_cop)
                                : Math.round(pNetSale - (pBaseCost + pSupIva) - pComp - pMat - pTrav);

                            return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                        {p.name}
                                        {p.is_activation && <span style={{ marginLeft: '0.4rem' }} title="Paquete de Activación">✅</span>}
                                        {p.is_upgrade && <span style={{ marginLeft: '0.4rem' }} title="Paquete de Avance (Upgrade)">⬆️</span>}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.category}</div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatCOP(p.price_local)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>${p.price_usd} USD</div>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#b45309' }}>{formatCOP(pBaseCost + pSupIva)}</div>
                                    {p.supplier_has_iva ? (
                                        <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>Con IVA ({((p.supplier_iva_rate || 0.19) * 100).toFixed(0)}%)</span>
                                    ) : pSupWh > 0 ? (
                                        <span style={{ fontSize: '0.72rem', color: '#d97706' }}>Ret: {formatCOP(pSupWh)}</span>
                                    ) : (
                                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sin IVA</span>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.82rem' }}>
                                    {!isPkg ? (
                                        <div>
                                            <span style={{ color: '#15803d', fontWeight: 'bold' }}>Plan Comp: {formatCOP(pComp)}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ color: '#6b21a8', fontWeight: 'bold' }}>Matrices: {formatCOP(pMat)}</div>
                                            <div style={{ color: '#0284c7', fontWeight: 'bold' }}>Viajes: {formatCOP(pTrav)}</div>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '0.35rem',
                                        fontWeight: 'bold',
                                        fontSize: '0.88rem',
                                        background: pProfit >= 0 ? '#dcfce7' : '#fee2e2',
                                        color: pProfit >= 0 ? '#166534' : '#991b1b'
                                    }}>
                                        {formatCOP(pProfit)}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        background: p.stock === 0 ? '#fee2e2' : p.stock <= 5 ? '#fef3c7' : '#d1fae5',
                                        color: p.stock === 0 ? '#dc2626' : p.stock <= 5 ? '#d97706' : '#065f46',
                                        border: `1px solid ${p.stock === 0 ? '#fca5a5' : p.stock <= 5 ? '#fde68a' : '#6ee7b7'}`
                                    }}>
                                        {p.stock} {p.stock === 0 ? '(Agotado)' : p.stock <= 5 ? '(Bajo)' : ''}
                                    </span>
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
