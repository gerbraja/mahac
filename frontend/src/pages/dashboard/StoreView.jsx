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
            {/* ─── Ruta hacia la Libertad Financiera ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    borderRadius: '1.5rem',
                    padding: '2.5rem 2rem',
                    marginBottom: '2rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(30, 58, 138, 0.3)'
                }}
            >
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '30%', height: '120%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '0', width: '25%', height: '100%', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', filter: 'blur(50px)' }}></div>

                <div className="relative z-10 text-center mb-10">
                    <h2 style={{
                        color: '#fff',
                        fontSize: '2rem',
                        fontWeight: '900',
                        marginBottom: '1rem',
                        letterSpacing: '-1px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        📈 Tu Ruta hacia la Libertad Financiera en TEI
                    </h2>
                    <p style={{ color: '#bfdbfe', fontSize: '1.1rem', maxWidth: '850px', margin: '0 auto', lineHeight: '1.6', fontWeight: '500' }}>
                        Hemos diseñado un sistema donde ganar dinero es inevitable, sin importar cómo decidas empezar. Conoce tus beneficios según tu nivel de actividad:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/[0.15] transition-all flex flex-col items-center text-center group">
                        <div style={{ fontSize: '2.5rem', background: 'white', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', marginBottom: '1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', transition: 'transform 0.3s' }} className="group-hover:scale-110">🤝</div>
                        <h3 className="text-white font-bold text-lg mb-3">1. El Poder de Compartir</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            <strong>¡Comienza Gratis!</strong> No necesitas comprar para ganar. Al crear tu cuenta gratis hoy, ya recibes <strong>Bono de Inicio Rápido</strong> por cada compra de tus invitados.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/25 hover:bg-white/[0.15] transition-all flex flex-col items-center text-center ring-2 ring-blue-400 shadow-2xl shadow-blue-900/40 relative group">
                        <div style={{ position: 'absolute', top: '-14px', background: '#3b82f6', color: 'white', fontSize: '11px', fontWeight: '900', padding: '4px 14px', borderRadius: '99px', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>Recomendado</div>
                        <div style={{ fontSize: '2.5rem', background: 'white', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', marginBottom: '1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', transition: 'transform 0.3s' }} className="group-hover:scale-110">⚡</div>
                        <h3 className="text-white font-bold text-lg mb-3">2. Activación Inteligente</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Al comprar cualquier producto, activas la <strong>Red Unilevel</strong> y la <strong>Red Binaria Millonaria</strong>, acumulando volumen y ganancias globales.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/[0.15] transition-all flex flex-col items-center text-center group">
                        <div style={{ fontSize: '2.5rem', background: 'white', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', marginBottom: '1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', transition: 'transform 0.3s' }} className="group-hover:scale-110">🚀</div>
                        <h3 className="text-white font-bold text-lg mb-3">3. Activación Total</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Adquiere un Paquete de Activación y habilita los <strong>4 Planes de Compensación</strong> simultáneamente, abriendo los bonos más agresivos de la compañía.
                        </p>
                    </div>
                </div>
            </motion.div>

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabezal Ultra-Compacto */}
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {product.is_activation && (
                            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black shrink-0">
                                🚀
                            </span>
                        )}
                        <h2 className="text-sm font-bold text-gray-800 truncate">
                            {product.name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <div className="text-right">
                            <span className="text-sm font-black text-green-600 block leading-none">
                                ${product.price_local?.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-blue-500">
                                💎 {product.pv} PV
                            </span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Imagen Lateral Pequeña (Opcional en móvil) */}
                    {product.image_url && (
                        <div className="hidden md:flex w-1/3 bg-gray-50 items-center justify-center p-4 border-r border-gray-50">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="max-h-48 object-contain mix-blend-multiply"
                            />
                        </div>
                    )}

                    {/* Área de Descripción Expandida */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-white">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción del Producto</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[13.5px]">
                            {product.description}
                        </p>
                    </div>
                </div>

                {/* Pie con Botón Angosto */}
                <div className="p-3 border-t border-gray-50 bg-gray-50/30 flex justify-center">
                    <button
                        onClick={() => {
                            addToCart(product);
                            onClose();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <span>🛒</span> Agregar al Carrito
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StoreView;
