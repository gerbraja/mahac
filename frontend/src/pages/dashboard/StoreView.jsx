import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import { api } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StoreView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart, cart } = useCart();
    const navigate = useNavigate();

    // Calculate total items in cart
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Assuming router is mounted at /api/products
                const response = await api.get(`/api/products/?_t=${new Date().getTime()}`);
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando productos...</div>;

    const starterPackages = products.filter(p => p.is_activation);
    const regularProducts = products.filter(p => !p.is_activation);

    return (
        <div className="p-6 relative" style={{ maxWidth: '100%', width: '100%' }}>
            <h1 className="text-3xl font-bold text-blue-900 mb-8">Centro Comercial TEI</h1>

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
                        🚀 Paquetes de Inicio <span className="text-sm font-normal text-gray-500">(Requerido para activación)</span>
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem',
                        width: '100%'
                    }}>
                        {starterPackages.map(product => (
                            <ProductCard key={product.id} product={product} addToCart={addToCart} isSpecial={true} />
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
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem',
                        width: '100%'
                    }}>
                        {regularProducts.map(product => (
                            <ProductCard key={product.id} product={product} addToCart={addToCart} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard = ({ product, addToCart, isSpecial }) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-white rounded-xl shadow-md border ${isSpecial ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'} overflow-hidden h-full flex flex-col`}
        >
            {/* Product Image */}
            <div className={`relative ${isSpecial ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gray-50'} flex items-center justify-center overflow-hidden`} style={{ height: '200px', minHeight: '200px', maxHeight: '200px' }}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-contain p-4"
                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : (
                    <span className={`text-6xl ${isSpecial ? 'text-white' : 'text-gray-400'}`}>{isSpecial ? '💎' : '📦'}</span>
                )}
                {isSpecial && (
                    <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Activación</span>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-1">{product.description}</p>

                {/* Price and PV */}
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xl font-bold text-green-600">${product.price_local?.toLocaleString()} COP</p>
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

export default StoreView;
