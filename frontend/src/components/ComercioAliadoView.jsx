import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/api';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '100vh',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0
};

const defaultCenter = { lat: 4.6097, lng: -74.0817 }; // Bogota
const libraries = ['places'];

const ComercioAliadoView = () => {
    const [commerces, setCommerces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCommerce, setSelectedCommerce] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, requesting, error, success

    const autocompleteRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    useEffect(() => {
        requestLocation();
    }, []);

    const requestLocation = () => {
        setLocationStatus('requesting');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newCenter = { lat: latitude, lng: longitude };
                setMapCenter(newCenter);
                setLocationStatus('success');
                fetchNearbyCommerces(latitude, longitude, searchQuery);
            },
            (error) => {
                console.warn("Geolocation error:", error);
                setLocationStatus('error');
                fetchNearbyCommerces(defaultCenter.lat, defaultCenter.lng, searchQuery);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const fetchNearbyCommerces = async (lat, lng, query) => {
        setLoading(true);
        try {
            let url = `/api/allied-commerce/nearby?lat=${lat}&lng=${lng}&radius_km=20`;
            if (query) {
                url += `&query=${encodeURIComponent(query)}`;
            }
            const response = await api.get(url);
            setCommerces(response.data);
        } catch (error) {
            console.error("Error fetching allied commerces:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMapDragEnd = () => {
        if (mapInstance) {
            const newCenter = {
                lat: mapInstance.getCenter().lat(),
                lng: mapInstance.getCenter().lng()
            };
            setMapCenter(newCenter);
            fetchNearbyCommerces(newCenter.lat, newCenter.lng, searchQuery);
        }
    };

    const handlePlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const newCenter = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setMapCenter(newCenter);
                if (mapInstance) {
                    mapInstance.panTo(newCenter);
                    mapInstance.setZoom(14);
                }
                fetchNearbyCommerces(newCenter.lat, newCenter.lng, searchQuery);
            }
        }
    };

    const handleSearchQueryChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchNearbyCommerces(mapCenter.lat, mapCenter.lng, val);
        }, 500);
    };

    if (loadError) return <div className="p-10 text-center text-red-500">Error cargando el mapa de Google. Verifica tu API Key.</div>;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-100">
            
            {/* MAPA DE FONDO */}
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={14}
                    onLoad={(map) => setMapInstance(map)}
                    onDragEnd={handleMapDragEnd}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    <Marker 
                        position={mapCenter} 
                        icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
                    />
                    {commerces.map((commerce) => (
                        <Marker
                            key={commerce.id}
                            position={{ lat: commerce.latitude, lng: commerce.longitude }}
                            onClick={() => setSelectedCommerce(commerce)}
                            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png" }}
                        />
                    ))}
                    {selectedCommerce && (
                        <InfoWindow
                            position={{ lat: selectedCommerce.latitude, lng: selectedCommerce.longitude }}
                            onCloseClick={() => setSelectedCommerce(null)}
                        >
                            <div className="p-2 max-w-[220px] text-left">
                                {selectedCommerce.image_url && (
                                    <img 
                                        src={selectedCommerce.image_url} 
                                        alt={selectedCommerce.name} 
                                        className="w-full h-24 object-cover rounded-lg mb-1.5 shadow-sm"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{selectedCommerce.name}</h3>
                                {selectedCommerce.description && (
                                    <p className="text-[11px] text-gray-600 line-clamp-2 mb-1">{selectedCommerce.description}</p>
                                )}
                                <p className="text-[10px] text-orange-600 font-bold mb-1.5">📍 {selectedCommerce.address} • A {selectedCommerce.distance_km} km</p>
                                <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                                    {selectedCommerce.phone && (
                                        <a 
                                            href={`https://wa.me/57${selectedCommerce.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedCommerce.name}, vi su tienda en TEI y deseo información sobre sus productos.`)}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-green-600 text-white text-center py-1 rounded text-[10px] font-bold hover:bg-green-700 transition"
                                        >
                                            💬 WhatsApp
                                        </a>
                                    )}
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCommerce.latitude},${selectedCommerce.longitude}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-blue-600 text-white text-center py-1 rounded text-[10px] font-bold hover:bg-blue-700 transition"
                                    >
                                        🗺️ Ruta
                                    </a>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500 font-medium animate-pulse">Cargando mapa interactivo...</p>
                </div>
            )}

            {/* UI FLOTANTE SUPERIOR (Buscadores) */}
            <div className="absolute top-4 left-0 right-0 px-4 pointer-events-none z-10">
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-3 w-full max-w-md mx-auto pointer-events-auto"
                >
                    <h2 className="text-base font-black text-orange-600 mb-2 flex items-center gap-2">
                        🏪 Comercios Aliados TEI
                    </h2>
                    <div className="flex flex-col gap-2">
                        {isLoaded && (
                            <Autocomplete
                                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                onPlaceChanged={handlePlaceChanged}
                            >
                                <input
                                    type="text"
                                    placeholder="📍 Buscar Barrio o Zona (ej: Bosa, Laureles)..."
                                    className="w-full bg-gray-100 border border-transparent text-gray-800 text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                                />
                            </Autocomplete>
                        )}
                        <input
                            type="text"
                            placeholder="🔍 Buscar producto o negocio (ej: flores, regalos, zapatos)..."
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            className="w-full bg-gray-100 border border-transparent text-gray-800 text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                        />
                    </div>
                </motion.div>
            </div>

            {/* BOTÓN RECENTRAR */}
            <button 
                onClick={requestLocation}
                className="absolute bottom-60 right-4 bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-100 text-xl hover:bg-blue-50 transition-colors z-10 pointer-events-auto"
                title="Mi ubicación actual"
            >
                🎯
            </button>

            {/* BOTTOM SHEET (Lista de Resultados) */}
            <motion.div 
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                className="absolute bottom-0 left-0 right-0 h-[40%] bg-white rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.15)] p-4 pointer-events-auto z-10 flex flex-col"
            >
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-2 shrink-0"></div>
                
                <div className="flex justify-between items-center mb-2 shrink-0">
                    <h3 className="font-bold text-gray-800 text-sm">Comercios encontrados ({commerces.length})</h3>
                    {loading && <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-4">
                    {commerces.length === 0 && !loading ? (
                        <div className="text-center py-6 text-gray-500 text-xs font-medium">
                            No hay comercios en esta área. Mueve el mapa o busca por producto.
                        </div>
                    ) : (
                        commerces.map((commerce) => (
                            <div 
                                key={commerce.id}
                                className="bg-gray-50 rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 hover:bg-orange-50/50 transition-colors"
                            >
                                {/* Imagen o icono de la tienda */}
                                <div 
                                    className="w-16 h-16 rounded-xl bg-orange-100 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer border border-orange-200"
                                    onClick={() => {
                                        if (mapInstance) {
                                            mapInstance.panTo({ lat: commerce.latitude, lng: commerce.longitude });
                                            mapInstance.setZoom(16);
                                            setSelectedCommerce(commerce);
                                        }
                                    }}
                                >
                                    {commerce.image_url ? (
                                        <img 
                                            src={commerce.image_url} 
                                            alt={commerce.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <span className="text-2xl" style={{ display: commerce.image_url ? 'none' : 'block' }}>🏪</span>
                                </div>

                                {/* Contenido descriptivo */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 
                                                className="font-bold text-gray-900 text-sm leading-tight hover:text-orange-600 cursor-pointer"
                                                onClick={() => {
                                                    if (mapInstance) {
                                                        mapInstance.panTo({ lat: commerce.latitude, lng: commerce.longitude });
                                                        mapInstance.setZoom(16);
                                                        setSelectedCommerce(commerce);
                                                    }
                                                }}
                                            >
                                                {commerce.name}
                                            </h4>
                                            <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full shrink-0">
                                                {commerce.distance_km} km
                                            </span>
                                        </div>

                                        {commerce.description ? (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {commerce.description}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 mt-0.5 italic">Comercio aliado oficial TEI</p>
                                        )}

                                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                            <span>📍</span> {commerce.address}{commerce.city ? `, ${commerce.city}` : ''}
                                        </p>
                                    </div>

                                    {/* Botones de acción directa */}
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                        {commerce.category && (
                                            <span className="text-[9px] font-bold text-gray-500 uppercase bg-gray-200/60 px-2 py-0.5 rounded">
                                                {commerce.category === 'services' ? 'Servicios' : commerce.category === 'highticket' ? 'Alto Ticket' : 'Productos'}
                                            </span>
                                        )}
                                        <div className="ml-auto flex gap-1.5">
                                            {commerce.phone && (
                                                <a 
                                                    href={`https://wa.me/57${commerce.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${commerce.name}, vi su tienda en TEI y deseo información sobre sus productos.`)}`}
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition"
                                                >
                                                    💬 WhatsApp
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    if (mapInstance) {
                                                        mapInstance.panTo({ lat: commerce.latitude, lng: commerce.longitude });
                                                        mapInstance.setZoom(16);
                                                        setSelectedCommerce(commerce);
                                                    }
                                                }}
                                                className="bg-gray-800 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                                            >
                                                👁️ Ver en Mapa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

        </div>
    );
};

export default ComercioAliadoView;
