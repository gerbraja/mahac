import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StoreView = () => {
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showBanner, setShowBanner] = useState(true);
    const { addToCart, cart } = useCart();
    const navigate = useNavigate();

    // Calculate total items in cart
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, userRes] = await Promise.all([
                    api.get(`/api/products/?_t=${new Date().getTime()}`),
                    api.get('/auth/me').catch(() => ({ data: null }))
                ]);

                let fetchedProducts = productsRes.data;
                const fetchedUser = userRes.data;

                // Process Upgrade Pricing
                if (fetchedUser && fetchedUser.status === 'active' && fetchedUser.package_level === 1) {
                    fetchedProducts = fetchedProducts.map(p => {
                        if (p.is_activation && p.package_level >= 2) {
                            return {
                                ...p,
                                price_local: Math.max(0, (p.price_local || 0) - 287000),
                                original_price_local: p.price_local,
                                is_upgrade: true
                            };
                        }
                        return p;
                    });
                }

                setProducts(fetchedProducts);
                setUser(fetchedUser);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando productos...</div>;

    // Filter Starter Packages based on User Level
    let starterPackages = [];

    if (user) {
        if (user.status === 'pre-affiliate') {
            // Pre-affiliate sees all packages
            starterPackages = products.filter(p => p.is_activation);
        } else if (user.package_level === 1) {
            // Level 1 sees ONLY upgrades (which are Level 2+ packages)
            starterPackages = products.filter(p => p.is_activation && p.package_level >= 2);
        } else if (user.package_level >= 2) {
            // Level 2+ sees NO packages
            starterPackages = [];
        } else {
            // Fallback (e.g. active but level 0? show all just in case)
            starterPackages = products.filter(p => p.is_activation);
        }
    } else {
        // Not logged in? Show all (or none, depending on global logic, but usually all)
        starterPackages = products.filter(p => p.is_activation);
    }

    const regularProducts = products.filter(p => !p.is_activation);

    return (
        <div className="p-6 relative" style={{ maxWidth: '100%', width: '100%' }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold text-blue-900">Centro Comercial TEI</h1>
                {user && (
                    <div className="flex items-center">
                        <span className={`px-4 py-2 rounded-full font-bold text-sm shadow-sm border ${user.status === 'pre-affiliate' ? 'bg-gray-100 text-gray-600 border-gray-300' :
                            user.package_level >= 2 ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                user.package_level === 1 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-green-100 text-green-800 border-green-200'
                            }`}>
                            {user.status === 'pre-affiliate' ? '⚪ Pre-afiliado (Gratuito)' :
                                user.package_level >= 2 ? '🏅 Activo Paquete de Productos' :
                                    user.package_level === 1 ? '🎖️ Activo Franquicia Digital 1' :
                                        '🟢 Activo'}
                        </span>
                    </div>
                )}
            </div>

            {/* ─── Aviso Importante ─── */}
            {showBanner && (
                <div style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    border: '1px solid #fb923c',
                    borderLeft: '5px solid #f97316',
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📅</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: '700', color: '#c2410c', fontSize: '0.95rem' }}>
                                Aviso Importante — Pedidos de Vestuario y Calzado
                            </p>
                            <p style={{ margin: '0.15rem 0 0', color: '#9a3412', fontSize: '0.875rem' }}>
                                Los pedidos de vestuario y calzado están habilitados <strong>únicamente los lunes</strong>. Gracias por tu comprensión. 🙏
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowBanner(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f97316',
                            fontSize: '1.2rem',
                            lineHeight: 1,
                            padding: '0.25rem',
                            flexShrink: 0
                        }}
                        title="Cerrar aviso"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Floating Cart Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/cart')}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
                <span className="text-2xl">🛒</span>
                {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        {cartItemCount}
                    </span>
                )}
            </motion.button>

            {/* Starter Packages Section */}
            {starterPackages.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                        🚀 Paquetes de Inicio / Avance <span className="text-sm font-normal text-gray-500">(Requerido para activación o mejora)</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                        {starterPackages.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                addToCart={addToCart}
                                isSpecial={true}
                                onClick={() => setSelectedProduct(product)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Products Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Catálogo General</h2>
                {regularProducts.length === 0 ? (
                    <p className="text-gray-500">No hay productos disponibles por el momento.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                        {regularProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                addToCart={addToCart}
                                onClick={() => setSelectedProduct(product)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailsModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        addToCart={addToCart}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ProductCard = ({ product, addToCart, isSpecial, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-white rounded-xl shadow-md border ${isSpecial ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'} overflow-hidden h-full flex flex-col`}
        >
            {/* Product Image - Clickable */}
            <div
                onClick={onClick}
                className={`relative ${isSpecial ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gray-50'} flex items-center justify-center overflow-hidden w-full aspect-[4/5] cursor-pointer group`}
            >
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-contain w-full h-full transition-transform group-hover:scale-110 duration-500"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : (
                    <span className={`text-6xl ${isSpecial ? 'text-white' : 'text-gray-400'}`}>{isSpecial ? '💎' : '📦'}</span>
                )}
                {isSpecial && product.is_upgrade && (
                    <span className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">Avance de Paquete</span>
                )}
                {isSpecial && !product.is_upgrade && (
                    <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Activación</span>
                )}

                {/* Overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                        Ver Detalles
                    </span>
                </div>
            </div>

            {/* Product Info */}
            <div className="px-4 pb-4 pt-2 flex-1 flex flex-col">
                <h3
                    onClick={onClick}
                    className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                >
                    {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-1">{product.description}</p>

                {/* Price and PV */}
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-xl font-bold text-green-600">${product.price_local?.toLocaleString()} COP</p>
                        {product.is_upgrade && (
                            <p className="text-xs text-gray-400 line-through">${product.original_price_local?.toLocaleString()} COP</p>
                        )}
                    </div>
                    <p className="text-sm font-bold text-blue-600">💎 {product.pv} PV</p>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={() => addToCart(product)}
                    className={`w-full py-2 rounded-lg font-bold transition-colors ${isSpecial
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                >
                    Agregar al Carrito
                </button>
            </div>
        </motion.div>
    );
};

const ProductDetailsModal = ({ product, onClose, addToCart }) => {
    if (!product) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 md:hidden bg-white/80 p-2 rounded-full shadow-md text-gray-600"
                    >
                        ✕
                    </button>

                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-h-[300px] md:max-h-[500px] object-contain drop-shadow-lg"
                        />
                    ) : (
                        <span className="text-8xl text-gray-300">📦</span>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 hidden md:block text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                    >
                        ✕
                    </button>

                    <div className="mb-6">
                        {product.is_upgrade ? (
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold mb-3">
                                🚀 Avance de Paquete
                            </span>
                        ) : product.is_activation ? (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold mb-3">
                                🚀 Paquete de Activación
                            </span>
                        ) : null}
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                            {product.name}
                        </h2>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-green-600">
                                    ${product.price_local?.toLocaleString()} COP
                                </span>
                                {product.is_upgrade && (
                                    <span className="text-sm text-gray-400 line-through">
                                        Precio regular: ${product.original_price_local?.toLocaleString()} COP
                                    </span>
                                )}
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm border border-blue-200 h-fit">
                                💎 {product.pv} PV
                            </span>
                        </div>
                    </div>

                    <div className="prose prose-blue flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                        <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-2">Descripción</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                            {product.description || "No hay descripción detallada disponible para este producto."}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <button
                            onClick={() => {
                                addToCart(product);
                                onClose();
                            }}
                            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            <span>🛒</span> Agregar al Carrito
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Seguir Viendo
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StoreView;
