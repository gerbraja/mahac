
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const MerchantStoreConfig = () => {
    const [config, setConfig] = useState({
        is_virtual_store: false,
        store_slug: '',
        logo_url: '',
        banner_url: '',
        store_description: '',
        payment_instructions: ''
    });
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    
    // Formulario para nuevo producto
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price_cop: '',
        stock: '',
        image_url: ''
    });

    useEffect(() => {
        fetchConfig();
        fetchProducts();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.merchant) {
                setConfig({
                    is_virtual_store: res.data.merchant.is_virtual_store || false,
                    store_slug: res.data.merchant.store_slug || '',
                    logo_url: res.data.merchant.logo_url || '',
                    banner_url: res.data.merchant.banner_url || '',
                    store_description: res.data.merchant.store_description || '',
                    payment_instructions: res.data.merchant.payment_instructions || ''
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/merchants/my-products');
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        if (config.is_virtual_store) {
            if (config.store_slug && !/^[a-z0-9-]+$/.test(config.store_slug)) {
                setMsg('❌ Error: El identificador URL solo puede contener letras minúsculas, números y guiones.');
                setLoading(false);
                return;
            }
            
            const validateUrl = (urlString, fieldName) => {
                if (!urlString) return true;
                try {
                    const url = new URL(urlString);
                    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                        setMsg(`❌ Error: La URL de ${fieldName} debe ser http o https segura.`);
                        return false;
                    }
                    if (urlString.toLowerCase().includes('javascript:')) {
                        setMsg(`❌ Error: La URL de ${fieldName} contiene código no permitido.`);
                        return false;
                    }
                    return true;
                } catch (e) {
                    setMsg(`❌ Error: La URL de ${fieldName} no es una dirección web válida.`);
                    return false;
                }
            };

            if (!validateUrl(config.logo_url, 'logo')) {
                setLoading(false);
                return;
            }
            if (!validateUrl(config.banner_url, 'banner')) {
                setLoading(false);
                return;
            }
        }

        let sanitizedPayment = config.payment_instructions;
        if (sanitizedPayment) {
            sanitizedPayment = sanitizedPayment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        const payload = { ...config, payment_instructions: sanitizedPayment };

        try {
            await api.put('/api/merchants/my-store/config', payload);
            setMsg('✅ Configuración guardada exitosamente.');
        } catch (error) {
            setMsg(`❌ Error: ${error.response?.data?.detail || 'No se pudo guardar la configuración.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newProduct,
                price_cop: parseFloat(newProduct.price_cop),
                stock: parseInt(newProduct.stock)
            };
            await api.post('/api/merchants/my-products', payload);
            alert("Producto creado exitosamente");
            setNewProduct({ name: '', description: '', price_cop: '', stock: '', image_url: '' });
            fetchProducts();
        } catch (error) {
            alert(`Error creando producto: ${error.response?.data?.detail || 'Error'}`);
        }
    };

    const handleToggleActive = async (product) => {
        try {
            await api.delete(`/api/merchants/my-products/${product.id}`);
            fetchProducts();
        } catch (e) {
            alert("Error desactivando producto");
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Store Configuration Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Configuración de tu Tienda Virtual</h2>
                
                {msg && (
                    <div className={`p-4 rounded-lg mb-6 font-bold ${msg.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {msg}
                    </div>
                )}

                <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="is_virtual"
                            checked={config.is_virtual_store}
                            onChange={(e) => setConfig({...config, is_virtual_store: e.target.checked})}
                            className="w-5 h-5"
                        />
                        <label htmlFor="is_virtual" className="font-bold text-gray-700">Activar mi Tienda Virtual</label>
                    </div>

                    {config.is_virtual_store && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Identificador URL (sin espacios)</label>
                                <input 
                                    type="text" 
                                    value={config.store_slug}
                                    onChange={(e) => setConfig({...config, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                                    placeholder="ej: alekey-shoes"
                                    className="w-full p-2 border rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Tu tienda estará en: /tienda/{config.store_slug || 'nombre'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Logo URL</label>
                                <input 
                                    type="text" 
                                    value={config.logo_url}
                                    onChange={(e) => setConfig({...config, logo_url: e.target.value})}
                                    placeholder="URL de la imagen del logo"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Banner URL</label>
                                <input 
                                    type="text" 
                                    value={config.banner_url}
                                    onChange={(e) => setConfig({...config, banner_url: e.target.value})}
                                    placeholder="URL de la imagen del banner"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Instrucciones de Pago (Bre-B/Nequi)</label>
                                <textarea 
                                    value={config.payment_instructions}
                                    onChange={(e) => setConfig({...config, payment_instructions: e.target.value})}
                                    placeholder="Ej: Transfiere a Nequi 3001234567 a nombre de Juan"
                                    className="w-full p-2 border rounded h-20"
                                />
                            </div>
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </form>
            </div>

            {/* Products CRUD Section */}
            {config.is_virtual_store && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">🛍️ Tus Productos</h2>
                    
                    <form onSubmit={handleCreateProduct} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                        <h3 className="font-bold mb-4">Añadir Nuevo Producto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input required type="text" placeholder="Nombre" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} className="p-2 border rounded" />
                            <input required type="number" placeholder="Precio COP" value={newProduct.price_cop} onChange={e=>setNewProduct({...newProduct, price_cop: e.target.value})} className="p-2 border rounded" />
                            <input required type="number" placeholder="Stock" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock: e.target.value})} className="p-2 border rounded" />
                            <input type="text" placeholder="URL de la Imagen" value={newProduct.image_url} onChange={e=>setNewProduct({...newProduct, image_url: e.target.value})} className="p-2 border rounded md:col-span-2" />
                            <button type="submit" className="bg-green-600 text-white font-bold rounded p-2 hover:bg-green-700">Crear Producto</button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {products.filter(p => p.active).map(p => (
                            <div key={p.id} className="border rounded-xl p-4 shadow-sm flex flex-col">
                                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2" />}
                                <h4 className="font-bold text-lg">{p.name}</h4>
                                <p className="text-blue-600 font-bold">${p.price_cop.toLocaleString()} COP</p>
                                <p className="text-sm text-gray-500 mb-2">Stock: {p.stock}</p>
                                <div className="mt-auto pt-2 flex justify-between">
                                    <button onClick={() => handleToggleActive(p)} className="text-red-500 font-bold text-sm">Desactivar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {products.filter(p => p.active).length === 0 && <p className="text-gray-500 text-center py-4">No tienes productos activos en tu tienda.</p>}
                </div>
            )}
        </div>
    );
};

export default MerchantStoreConfig;
