import React, { useEffect, useState } from 'react';
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
                const response = await api.get('/api/products/');
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
        <div className="p-6 relative">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            whileHover={{ y: -5 }}
            className={`bg-white rounded-xl shadow-md overflow-hidden border ${isSpecial ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}
        >
            <div className={`h-12 ${isSpecial ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gray-200'} flex items-center justify-center overflow-hidden`}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <span
                    className={`text-4xl ${isSpecial ? 'text-white' : 'text-gray-400'}`}
                    style={{ display: product.image_url ? 'none' : 'block' }}
                >
                    {isSpecial ? '💎' : '📦'}
                </span>
            </div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
                    {isSpecial && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Activación</span>}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>

                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-2xl font-bold text-green-600">${product.price_local?.toLocaleString()} COP</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">💎 {product.pv} PV</p>
                    </div>
                </div>

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
