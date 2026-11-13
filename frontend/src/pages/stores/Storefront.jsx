
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useParams, Link, useNavigate } from 'react-router-dom';

const Storefront = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Simple Cart State (Local)
    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetchStoreData();
    }, [slug]);

    const fetchStoreData = async () => {
        try {
            const [storeRes, productsRes] = await Promise.all([
                api.get(`/api/stores/${slug}`),
                api.get(`/api/stores/${slug}/products`)
            ]);
            setStore(storeRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(i => i.product_id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) {
                alert("No hay más stock disponible.");
                return;
            }
            setCart(cart.map(i => i.product_id === product.id ? {...i, quantity: i.quantity + 1} : i));
        } else {
            if (product.stock <= 0) {
                alert("Producto agotado.");
                return;
            }
            setCart([...cart, {
                product_id: product.id, 
                name: product.name, 
                price: product.price_cop, 
                quantity: 1, 
                image_url: product.image_url 
            }]);
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        // Salvar el carrito en sessionStorage para pasarlo a la página de checkout
        sessionStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
        navigate(`/tienda/${slug}/checkout`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl font-bold animate-pulse">Cargando Vitrina...</p></div>;
    if (!store) return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl font-bold text-red-500">Tienda no encontrada</p></div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            {/* Banner Area */}
            <div className="w-full h-64 md:h-96 relative bg-gray-900">
                {store.banner_url ? (
                    <img src={store.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-900 opacity-80"></div>
                )}
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto flex items-end gap-6">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-2xl border-4 border-white overflow-hidden">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">🏪</div>
                        )}
                    </div>
                    <div className="text-white pb-2">
                        <h1 className="text-4xl md:text-6xl font-black drop-shadow-md">{store.name}</h1>
                        <p className="text-lg md:text-xl opacity-90 mt-2 font-medium drop-shadow">{store.store_description}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Product Grid */}
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Catálogo de Productos</h2>
                    </div>
                    
                    {products.length === 0 ? (
                        <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100">
                            <span className="text-4xl mb-3 block">📦</span>
                            <h3 className="text-xl font-bold text-gray-700">Aún no hay productos</h3>
                            <p className="text-gray-500 mt-2">Esta tienda está organizando su inventario.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-white rounded-2xl shadow hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                                    <div className="h-56 bg-gray-100 relative">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">Sin Imagen</div>
                                        )}
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                                <span className="bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm">AGOTADO</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-grow flex flex-col">
                                        <h3 className="font-bold text-xl text-gray-800 mb-1">{product.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-2 flex-grow">{product.description}</p>
                                        <div className="mb-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                                </svg>
                                                Envío Gratis
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto">
                                            <div>
                                                <p className="text-2xl font-black text-blue-700">${product.price_cop.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400 font-semibold mt-1">Disponibles: {product.stock}</p>
                                            </div>
                                            <button 
                                                onClick={() => addToCart(product)}
                                                disabled={product.stock <= 0}
                                                className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Cart */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            🛒 Tu Carrito
                            <span className="bg-blue-100 text-blue-800 text-sm py-0.5 px-2 rounded-full">{cart.reduce((a,c)=>a+c.quantity, 0)}</span>
                        </h2>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <p>Tu carrito está vacío</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.product_id} className="flex gap-3 pb-4 border-b border-gray-100">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.quantity}x ${item.price.toLocaleString()}</p>
                                            <p className="font-bold text-blue-700 text-sm mt-1">${(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => setCart(cart.filter(i => i.product_id !== item.product_id))} className="text-gray-400 hover:text-red-500">×</button>
                                    </div>
                                ))}
                                
                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-4 text-lg">
                                        <span className="text-gray-500">Subtotal:</span>
                                        <span className="font-black text-gray-900">${cartTotal.toLocaleString()} COP</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transition-all hover:-translate-y-1"
                                    >
                                        Pagar Ahora ➔
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Storefront;
