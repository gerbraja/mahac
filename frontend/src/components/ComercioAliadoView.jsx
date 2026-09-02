import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/api';

const ComercioAliadoView = () => {
    const [commerces, setCommerces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, requesting, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const requestLocation = () => {
        setLocationStatus('requesting');
        setErrorMsg('');

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setErrorMsg('Tu navegador no soporta geolocalización.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocationStatus('success');
                fetchNearbyCommerces(latitude, longitude);
            },
            (error) => {
                setLocationStatus('error');
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        setErrorMsg('Permiso denegado. Por favor permite el acceso a tu ubicación.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setErrorMsg('La información de ubicación no está disponible.');
                        break;
                    case error.TIMEOUT:
                        setErrorMsg('La solicitud para obtener la ubicación caducó.');
                        break;
                    default:
                        setErrorMsg('Ocurrió un error desconocido.');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const fetchNearbyCommerces = async (lat, lng) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/allied-commerce/nearby?lat=${lat}&lng=${lng}&radius_km=20`);
            setCommerces(response.data);
        } catch (error) {
            console.error("Error fetching allied commerces:", error);
            setErrorMsg("Hubo un error al cargar los comercios cercanos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Banner Promocional Destacado */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 md:p-10 mb-8 shadow-2xl shadow-orange-500/30 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10 drop-shadow-md">
                    🏪 Comercio Aliado
                </h2>
                <p className="text-orange-50 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed relative z-10">
                    Atrae a toda la comunidad de afiliados de TEI a tu negocio físico y multiplica tus ventas. 
                    <br/><span className="text-white font-bold mt-2 inline-block">¡Descubre quiénes están cerca de ti!</span>
                </p>
            </motion.div>

            {/* Content Section */}
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 p-8 min-h-[400px]">
                
                {locationStatus === 'idle' && (
                    <div className="flex flex-col items-center justify-center text-center py-10">
                        <div className="text-6xl mb-4">📍</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Encuentra Comercios Cercanos</h3>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Necesitamos tu ubicación para mostrarte los negocios aliados de TEI en un radio de 20 km a tu alrededor.
                        </p>
                        <button 
                            onClick={requestLocation}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            Compartir Ubicación
                        </button>
                    </div>
                )}

                {locationStatus === 'requesting' && (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-semibold animate-pulse">Obteniendo tu ubicación exacta...</p>
                    </div>
                )}

                {locationStatus === 'error' && (
                    <div className="flex flex-col items-center justify-center text-center py-10">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-red-600 mb-2">No pudimos obtener tu ubicación</h3>
                        <p className="text-gray-600 mb-6">{errorMsg}</p>
                        <button 
                            onClick={requestLocation}
                            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Intentar Nuevamente
                        </button>
                    </div>
                )}

                {locationStatus === 'success' && loading && (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-semibold">Buscando comercios aliados en 20 km...</p>
                    </div>
                )}

                {locationStatus === 'success' && !loading && (
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Resultados en tu zona</h3>
                            <button onClick={requestLocation} className="text-sm text-blue-600 hover:underline">
                                Actualizar ubicación
                            </button>
                        </div>
                        
                        {commerces.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="text-4xl mb-3">🏙️</div>
                                <p className="text-gray-500 font-semibold text-lg">Aún no hay comercios aliados en tu zona.</p>
                                <p className="text-gray-400 text-sm mt-2">¡Sé el primero en registrar tu negocio y atraer afiliados de TEI!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {commerces.map((commerce) => (
                                    <motion.div 
                                        key={commerce.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg text-gray-800">{commerce.name}</h4>
                                            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                                                A {commerce.distance_km} km
                                            </span>
                                        </div>
                                        {commerce.category && (
                                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                                                {commerce.category}
                                            </span>
                                        )}
                                        <p className="text-sm text-gray-600 mb-3 flex-1">{commerce.description || 'Sin descripción.'}</p>
                                        <div className="mt-auto pt-3 border-t border-gray-50">
                                            <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="text-gray-400">📍</span> {commerce.address} {commerce.city ? `, ${commerce.city}` : ''}
                                            </p>
                                            {commerce.phone && (
                                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                                    <span className="text-gray-400">📞</span> {commerce.phone}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComercioAliadoView;
