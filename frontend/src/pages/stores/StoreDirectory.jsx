
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Link } from 'react-router-dom';

const StoreDirectory = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await api.get('/api/stores/');
                setStores(res.data);
            } catch (error) {
                console.error("Error fetching stores", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl font-bold animate-pulse text-gray-500">Cargando Centro Comercial...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-gray-900 mb-4">🏪 Centro Comercial TEI</h1>
                    <p className="text-xl text-gray-600">Explora las tiendas oficiales y comercios aliados. ¡Compra y genera comisiones en la red!</p>
                </div>

                {stores.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
                        <span className="text-6xl mb-4 block">🏬</span>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Próximamente nuevas tiendas</h2>
                        <p className="text-gray-500">Nuestros comercios aliados están preparando sus vitrinas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stores.map(store => (
                            <Link to={`/tienda/${store.store_slug}`} key={store.id} className="group block">
                                <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col transform hover:-translate-y-2">
                                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                                        {store.banner_url ? (
                                            <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white text-3xl font-bold opacity-50">{store.name}</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-900 shadow-sm">
                                            Comercio Aliado
                                        </div>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col relative">
                                        <div className="absolute -top-12 right-6 w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border-2 border-white">
                                            {store.logo_url ? (
                                                <img src={store.logo_url} alt="logo" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2 pr-24">{store.name}</h3>
                                        <p className="text-gray-600 line-clamp-3 mb-4">{store.store_description || 'Descubre los mejores productos aquí.'}</p>
                                        <div className="mt-auto">
                                            <span className="text-blue-600 font-bold group-hover:text-blue-800 transition-colors flex items-center gap-2">
                                                Visitar Tienda
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreDirectory;
