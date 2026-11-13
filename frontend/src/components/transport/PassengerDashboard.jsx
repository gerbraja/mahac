import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Car, Bike, Truck, CheckCircle, Check, Star, Phone, MessageSquare, X, CloudRain, Plane, ShieldAlert, FileText, Wallet, Banknote, Building, Store } from 'lucide-react';
import { db, auth } from '../../firebase';
import { ref, onValue, off } from 'firebase/database';
import { signInWithCustomToken } from 'firebase/auth';
import { api } from '../../api/api';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';
import EmergencyModal from './EmergencyModal';
import TripHistoryModal from './TripHistoryModal';
import DigitalReceiptModal from './DigitalReceiptModal';
import { transportAudio } from './transportAudio';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 0
};

const center = { lat: 4.6097, lng: -74.0817 };
const libraries = ['places'];

export default function PassengerDashboard() {
  const [vehicle, setVehicle] = useState('carro');
  const [cargoType, setCargoType] = useState('carga_liviana');
  const [helpersCount, setHelpersCount] = useState(0);
  const [price, setPrice] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [weatherMultiplier, setWeatherMultiplier] = useState(1.0);
  const [isRaining, setIsRaining] = useState(false);
  const [weatherNote, setWeatherNote] = useState('');
  const [isAirport, setIsAirport] = useState(false);
  
  // Método de pago: Efectivo vs Saldo Banco TEI
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' o 'tei_bank'
  const [passengerBalance, setPassengerBalance] = useState({ 
    available_balance_usd: 0, 
    available_balance_cop: 0,
    username: '',
    name: '',
    is_authenticated: false
  });
  const [activePaymentMethod, setActivePaymentMethod] = useState('cash');

  const [isSearching, setIsSearching] = useState(false);
  const [tripSent, setTripSent] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [acceptedDriver, setAcceptedDriver] = useState(null);
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [rating, setRating] = useState(0);

  // Ofertas entrantes de conductores en la subasta
  const [incomingOffers, setIncomingOffers] = useState([]);
  const prevOffersCountRef = useRef(0);

  // Estados de nuevas funcionalidades: SOS, Historial y Recibos
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [receiptTrip, setReceiptTrip] = useState(null);
  
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState({ distance: '', time: '' });

  // Refs for autocomplete
  const originRef = useRef();
  const destinationRef = useRef();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const fetchWeatherMultiplier = async (lat, lng) => {
    try {
      const res = await api.get(`/api/transport/weather-multiplier?lat=${lat}&lon=${lng}`);
      if (res.data) {
        const raining = Boolean(res.data.is_raining);
        setIsRaining(raining);
        setWeatherMultiplier(res.data.multiplier || 1.0);
        setWeatherNote(res.data.details || '');
        return raining;
      }
    } catch (err) {
      console.warn("No se pudo obtener clima en tiempo real:", err);
    }
    return false;
  };

  const checkIsAirport = (text) => {
    if (!text) return false;
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keywords = ['aeropuerto', 'airport', 'el dorado', 'eldorado', 'jose maria cordova', 'palonegro', 'alfonso bonilla', 'ernesto cortissoz', 'matecana', 'puerta de oro'];
    return keywords.some(k => normalized.includes(k));
  };

  const calculatePrice = (route, rainOverride = null) => {
    if (!route) return;
    
    const km = route.distance.value / 1000;
    const minutes = route.duration.value / 60;

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Domingo
    const isSundayOrHoliday = (day === 0);
    const isNightOrHoliday = (hour >= 20 || hour < 5) || isSundayOrHoliday;

    // Determinar si hay lluvia activa (directa o por override)
    const rainingActive = rainOverride !== null ? rainOverride : isRaining;

    // Detectar si el trayecto involucra un aeropuerto (origen o destino)
    const originText = originRef.current?.value || '';
    const destText = destinationRef.current?.value || '';
    const airportDetected = checkIsAirport(originText) || checkIsAirport(destText);
    setIsAirport(airportDetected);

    // Recargo Aeropuerto: $3.700 COP exclusivo para Carro y Taxi
    const airportSurcharge = (airportDetected && (vehicle === 'carro' || vehicle === 'taxi')) ? 3700 : 0;

    // Cuota App: $750 normal, $950 en lluvia, nocturno o festivos
    const appFee = (rainingActive || isNightOrHoliday) ? 950 : 750;

    let basePrice = 5200;
    let pricePerKm = 1400;
    let pricePerMin = 350;
    let helpersCost = 0;
    let absoluteMin = 5200;

    if (vehicle === 'moto') {
      basePrice = isNightOrHoliday ? 2500 : 1800;
      pricePerKm = rainingActive ? 950 : 800;
      pricePerMin = rainingActive ? 160 : 130;
      absoluteMin = rainingActive ? 4500 : 3500;
    } else if (vehicle === 'carro' || vehicle === 'taxi') {
      // Mínimo Absoluto Garantizado para Carro/Taxi en todas las ocasiones: $8.200 COP
      absoluteMin = 8200;

      if (rainingActive) {
        // TABLA OFICIAL EN LLUVIA:
        // Arranque/Base: $6.200 (con ajuste nocturno/festivo/dominical de $7.200)
        // Precio/Km: Si es Dominical o Festivo con lluvia -> $1.800 COP/km (incentivo especial)
        //            Si es lluvia en día regular -> $1.500 COP/km
        // Precio/Min: $450 COP
        // Mínimo Absoluto Garantizado: $8.200 COP
        basePrice = isNightOrHoliday ? 7200 : 6200;
        pricePerKm = isSundayOrHoliday ? 1800 : 1500;
        pricePerMin = 450;
      } else {
        // TABLA ESTÁNDAR CLIMA NORMAL:
        // Arranque/Base: $5.200 (con ajuste nocturno/festivo de $6.200)
        // Precio/Km: $1.400 COP
        // Precio/Min: $350 COP
        // Mínimo Absoluto Garantizado: $8.200 COP
        basePrice = isNightOrHoliday ? 6200 : 5200;
        pricePerKm = 1400;
        pricePerMin = 350;
      }
    } else if (vehicle === 'camion') {
      if (cargoType === 'moto_carga') {
         basePrice = isNightOrHoliday ? 12000 : 10000;
         pricePerKm = 1100;
         pricePerMin = 200;
         absoluteMin = 10000;
      } else if (cargoType === 'carga_liviana') {
         basePrice = isNightOrHoliday ? 60000 : 50000;
         pricePerKm = 3000;
         pricePerMin = 400;
         helpersCost = helpersCount * 30000;
         absoluteMin = 50000;
      } else if (cargoType === 'furgon') {
         basePrice = isNightOrHoliday ? 120000 : 100000;
         pricePerKm = 4000;
         pricePerMin = 500;
         helpersCost = helpersCount * 50000;
         absoluteMin = 100000;
      } else if (cargoType === 'camion_pesado') {
         basePrice = isNightOrHoliday ? 190000 : 160000;
         pricePerKm = 6000;
         pricePerMin = 800;
         helpersCost = helpersCount * 100000;
         absoluteMin = 160000;
      }
    }
    
    // Cálculo total sugerido (incluyendo recargo aeropuerto si aplica)
    let tarifaSugerida = basePrice + (km * pricePerKm) + (minutes * pricePerMin) + appFee + helpersCost + airportSurcharge;
    tarifaSugerida = Math.round(tarifaSugerida / 100) * 100;
    
    let pisoMinimo = tarifaSugerida * 0.80;
    pisoMinimo = Math.max(Math.round(pisoMinimo / 100) * 100, absoluteMin);

    setSuggestedPrice(tarifaSugerida);
    setMinPrice(pisoMinimo);
    setPrice(tarifaSugerida.toString());
  };

  const calculateRouteAndPrice = async () => {
    if (!originRef.current?.value || !destinationRef.current?.value) {
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);
      
      const route = results.routes[0].legs[0];
      setDistanceInfo({
        distance: route.distance.text,
        time: route.duration.text
      });

      // Consultar clima en el punto de origen y calcular precio
      const originLat = route.start_location.lat();
      const originLng = route.start_location.lng();
      const mult = await fetchWeatherMultiplier(originLat, originLng);

      calculatePrice(route, mult);
      
    } catch (error) {
      console.error("Error calculando ruta:", error);
    }
  };

  useEffect(() => {
    if (directionsResponse) {
      calculatePrice(directionsResponse.routes[0].legs[0]);
    }
  }, [vehicle, cargoType, helpersCount, weatherMultiplier]);

  const fetchPassengerBalance = async () => {
    try {
      const res = await api.get('/api/transport/passenger-balance');
      if (res.data) {
        setPassengerBalance({
          ...res.data,
          is_authenticated: true
        });
        return;
      }
    } catch (e) {
      console.warn("No se pudo cargar passenger-balance directo:", e);
    }

    // Fallback con /auth/me si existe sesión
    try {
      const meRes = await api.get('/auth/me');
      if (meRes.data) {
        const u = meRes.data;
        const bancoUsd = Number(u.verified_balance || 0);
        const loyaltyUsd = Number(u.purchase_balance || 0);
        setPassengerBalance({
          available_balance_usd: Number(bancoUsd.toFixed(2)),
          available_balance_cop: Math.round(bancoUsd * 4500),
          loyalty_balance_usd: Number(loyaltyUsd.toFixed(2)),
          loyalty_balance_cop: Math.round(loyaltyUsd * 4500),
          username: u.username,
          name: u.name,
          is_authenticated: true
        });
        return;
      }
    } catch (err2) {
      console.warn("Usuario no autenticado como pasajero:", err2);
      setPassengerBalance(prev => ({ ...prev, is_authenticated: false }));
    }
  };

  useEffect(() => {
    fetchPassengerBalance();
  }, []);

  const handleRequestRide = async () => {
    const finalPrice = parseFloat(price);
    
    if (!finalPrice || !destinationRef.current?.value) {
      alert("Por favor ingresa un destino y espera el cálculo de la tarifa.");
      return;
    }
    
    if (minPrice && finalPrice < minPrice) {
      alert(`Para esta distancia, la oferta mínima permitida es de $${minPrice.toLocaleString('es-CO')} COP`);
      return;
    }

    if (paymentMethod === 'tei_bank' && (passengerBalance.available_balance_cop || 0) < finalPrice) {
      alert(`Saldo insuficiente en tu Banco TEI. Tienes $${(passengerBalance.available_balance_cop || 0).toLocaleString('es-CO')} COP disponibles y el viaje cuesta $${finalPrice.toLocaleString('es-CO')} COP. Por favor cambia a Bolsa de Fidelización, Efectivo o recarga tu Banco.`);
      return;
    }

    if (paymentMethod === 'loyalty_bag' && (passengerBalance.loyalty_balance_cop || 0) < finalPrice) {
      alert(`Saldo insuficiente en tu Bolsa de Fidelización TEI. Tienes $${(passengerBalance.loyalty_balance_cop || 0).toLocaleString('es-CO')} COP disponibles y el viaje cuesta $${finalPrice.toLocaleString('es-CO')} COP. Por favor cambia a Banco TEI o Efectivo.`);
      return;
    }
    
    const distKm = directionsResponse 
      ? (directionsResponse.routes[0].legs[0].distance.value / 1000) 
      : 0;

    setIsSearching(true);
    try {
      const response = await api.post('/api/transport/trip', {
        vehicle_type_requested: vehicle === 'camion' ? cargoType : vehicle,
        origin_address: originRef.current.value,
        destination_address: destinationRef.current.value,
        proposed_price: finalPrice,
        payment_method: paymentMethod,
        distance_km: distKm,
        origin_lat: directionsResponse ? directionsResponse.routes[0].legs[0].start_location.lat() : center.lat,
        origin_lon: directionsResponse ? directionsResponse.routes[0].legs[0].start_location.lng() : center.lng,
        destination_lat: directionsResponse ? directionsResponse.routes[0].legs[0].end_location.lat() : center.lat,
        destination_lon: directionsResponse ? directionsResponse.routes[0].legs[0].end_location.lng() : center.lng
      });
      
      const newTripId = response.data.id;
      setActiveTripId(newTripId);
      setActivePaymentMethod(paymentMethod);
      setTripSent(true);
      fetchPassengerBalance();
      
      // Conectar a Firebase
      const tokenResponse = await api.get('/auth/firebase-token');
      await signInWithCustomToken(auth, tokenResponse.data.token);
      
    } catch (error) {
      console.error("Error enviando el viaje:", error);
      alert("Hubo un error al solicitar el viaje: " + (error.response?.data?.detail || error.message || error));
    } finally {
      setIsSearching(false);
    }
  };

  // 1. Restaurar viaje activo o completado no calificado al abrir/recargar o volver de WhatsApp
  useEffect(() => {
    const restoreTrip = async () => {
      try {
        const res = await api.get('/api/transport/trip/current');
        if (res.data?.active && res.data.trip) {
          const t = res.data.trip;
          setActiveTripId(t.id);
          setPrice(t.proposed_price?.toString() || '');
          setActivePaymentMethod(t.payment_method || 'cash');

          if (res.data.recently_completed || t.status === 'completed') {
            setTripCompleted(true);
            setAcceptedDriver({
              name: t.driver_name || 'Conductor TEI',
              phone: t.driver_phone || '',
              vehiclePlate: t.vehicle_plate || '',
              vehicleModel: t.vehicle_model || '',
              vehicleColor: t.vehicle_color || '',
              vehicleType: t.vehicle_type || 'carro',
              finalPrice: t.final_price || t.proposed_price,
              status: 'completed'
            });
          } else {
            setTripSent(true);
            if (t.status === 'assigned' || t.status === 'in_progress') {
              setAcceptedDriver({
                name: t.driver_name || 'Conductor TEI',
                phone: t.driver_phone || '',
                vehiclePlate: t.vehicle_plate || '',
                vehicleModel: t.vehicle_model || '',
                vehicleColor: t.vehicle_color || '',
                vehicleType: t.vehicle_type || 'carro',
                finalPrice: t.final_price || t.proposed_price,
                status: t.status === 'assigned' ? 'accepted' : t.status
              });
            }
          }

          // Conectar a Firebase de inmediato
          try {
            const tokenResponse = await api.get('/auth/firebase-token');
            await signInWithCustomToken(auth, tokenResponse.data.token);
          } catch (e) {
            console.warn("Error autenticando Firebase en restore:", e);
          }

          // Re-calcular ruta en el mapa para que nunca se borre
          if (t.origin_address && t.destination_address && window.google?.maps) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route({
              origin: t.origin_address,
              destination: t.destination_address,
              travelMode: window.google.maps.TravelMode.DRIVING
            }, (results, status) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
                setDirectionsResponse(results);
                const leg = results.routes[0]?.legs[0];
                if (leg) {
                  setDistanceInfo({
                    distance: leg.distance.text,
                    time: leg.duration.text
                  });
                }
              }
            });
          }
        }
      } catch (err) {
        console.error("Error al restaurar viaje activo:", err);
      }
    };

    restoreTrip();
  }, [isLoaded]);

  // 2. Auto-ajustar cámara del mapa a la ruta para que siempre esté visible
  useEffect(() => {
    if (!map || !directionsResponse) return;
    try {
      const bounds = directionsResponse.routes[0]?.bounds;
      if (bounds) {
        map.fitBounds(bounds);
      }
    } catch (e) {
      console.warn("Error ajustando límites del mapa:", e);
    }
  }, [map, directionsResponse]);

  // 3. Escuchar estado del viaje y ofertas de conductores en Firebase en tiempo real
  useEffect(() => {
    if (!activeTripId) return;

    const tripRef = ref(db, `trips/active/${activeTripId}`);
    const unsubscribe = onValue(tripRef, (snapshot) => {
      if (snapshot.exists()) {
        const tripData = snapshot.val();

        // Procesar ofertas / contraofertas de conductores en tiempo real
        if (tripData.offers) {
          const offersList = Object.entries(tripData.offers).map(([driverId, off]) => ({
            driver_id: parseInt(driverId),
            ...off
          })).filter(o => o.status === 'pending');

          if (offersList.length > prevOffersCountRef.current) {
            transportAudio.playCounterOfferBeep();
          }
          prevOffersCountRef.current = offersList.length;
          setIncomingOffers(offersList);
        } else {
          setIncomingOffers([]);
          prevOffersCountRef.current = 0;
        }

        if (tripData.status === 'accepted' || tripData.status === 'in_progress') {
          setIncomingOffers([]);
          prevOffersCountRef.current = 0;
          setAcceptedDriver({
            name: tripData.driver_name || 'Conductor TEI',
            phone: tripData.driver_phone || '',
            vehiclePlate: tripData.vehicle_plate || '',
            vehicleModel: tripData.vehicle_model || '',
            vehicleColor: tripData.vehicle_color || '',
            vehicleType: tripData.vehicle_type || 'carro',
            finalPrice: tripData.final_price || tripData.price,
            status: tripData.status
          });
        } else if (tripData.status === 'completed') {
          setTripCompleted(true);
          try {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          } catch (e) {}
        } else if (tripData.status === 'cancelled') {
          alert("El viaje ha sido cancelado.");
          handleCancelSearch();
        }
      }
    });

    return () => {
      off(tripRef);
    };
  }, [activeTripId]);

  // 4. Escuchar ubicación GPS del conductor en tiempo real
  useEffect(() => {
    if (!activeTripId || !acceptedDriver) {
      setLiveDriverLocation(null);
      return;
    }

    const driverLocRef = ref(db, `trips/active/${activeTripId}/driver_location`);
    const unsub = onValue(driverLocRef, (snapshot) => {
      if (snapshot.exists()) {
        const loc = snapshot.val();
        if (loc && loc.lat && loc.lng) {
          setLiveDriverLocation({ lat: loc.lat, lng: loc.lng });
        }
      }
    });

    return () => {
      off(driverLocRef);
    };
  }, [activeTripId, Boolean(acceptedDriver)]);

  const handleAcceptDriverOffer = async (offer) => {
    try {
      await api.post('/api/transport/trip/passenger-accept-offer', {
        trip_id: parseInt(activeTripId),
        driver_id: parseInt(offer.driver_id),
        price: parseFloat(offer.price)
      });
      transportAudio.playNewTripChime();
    } catch (error) {
      console.error("Error aceptando contraoferta:", error);
      let errorMsg = "No se pudo procesar la aceptación de la contraoferta.";
      if (typeof error.response?.data?.detail === 'string') {
        errorMsg = error.response.data.detail;
      } else if (Array.isArray(error.response?.data?.detail) && error.response.data.detail[0]?.msg) {
        errorMsg = error.response.data.detail[0].msg;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      alert(errorMsg);
    }
  };

  const handleRejectDriverOffer = async (driverId) => {
    try {
      await api.post('/api/transport/trip/passenger-reject-offer', {
        trip_id: parseInt(activeTripId),
        driver_id: parseInt(driverId)
      });
      setIncomingOffers(prev => prev.filter(o => o.driver_id !== parseInt(driverId)));
    } catch (error) {
      console.error("Error rechazando oferta:", error);
    }
  };

  const handleCancelSearch = () => {
    setTripSent(false);
    setIncomingOffers([]);
    prevOffersCountRef.current = 0;
    if (activeTripId) {
      off(ref(db, `trips/active/${activeTripId}`));
      api.post(`/api/transport/trip/${activeTripId}/cancel`).catch(console.error);
    }
    setActiveTripId(null);
    setAcceptedDriver(null);
    setLiveDriverLocation(null);
  };

  const handleCancelActiveTrip = async () => {
    if (window.confirm("¿Estás seguro que deseas cancelar el viaje?")) {
      try {
        await api.post(`/api/transport/trip/${activeTripId}/cancel`);
        handleCancelSearch();
      } catch (error) {
        alert("No se pudo cancelar el viaje.");
      }
    }
  };

  const handleRateDriver = async (stars) => {
    try {
      await api.post(`/api/transport/trip/${activeTripId}/rate`, { stars });
      setTripCompleted(false);
      setTripSent(false);
      setActiveTripId(null);
      setAcceptedDriver(null);
      setLiveDriverLocation(null);
      setRating(0);
      alert("¡Gracias por calificar tu viaje en TEI RIDE!");
    } catch (error) {
      alert("Error al enviar calificación.");
    }
  };

  const openDriverWhatsApp = (phone, name) => {
    if (!phone) {
      alert("El conductor no tiene WhatsApp disponible.");
      return;
    }
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('57') ? clean : `57${clean}`;
    const text = encodeURIComponent(`Hola ${name}, soy tu pasajero de TEI RIDE.`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <div className="relative h-screen w-full bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* GOOGLE MAPS - SIEMPRE VISIBLE */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            ],
          }}
        >
          {/* RUTA CALCULADA EN EL MAPA */}
          {directionsResponse && (
            <DirectionsRenderer 
              directions={directionsResponse} 
              options={{
                polylineOptions: { strokeColor: '#10b981', strokeWeight: 6 },
                suppressMarkers: false,
              }}
            />
          )}

          {/* VEHÍCULO DEL CONDUCTOR EN TIEMPO REAL */}
          {liveDriverLocation && (
            <Marker
              position={liveDriverLocation}
              icon={{
                url: acceptedDriver?.vehicleType === 'moto'
                  ? 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png'
                  : 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
                scaledSize: new window.google.maps.Size(42, 42)
              }}
              title={`Conductor: ${acceptedDriver?.name}`}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse font-medium">Cargando mapa en tiempo real...</p>
        </div>
      )}
      
      {/* TOP HEADER TEI RIDE */}
      <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-700/60 shadow-lg">
            <div className="text-center font-black text-lg tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              TEI RIDE
            </div>
          </div>

          {/* Botón Historial de Viajes / Recibos */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md px-3 py-2 rounded-2xl border border-gray-700/60 shadow-lg text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition"
            title="Mis Viajes y Recibos Digitales"
          >
            <FileText size={15} className="text-emerald-400" />
            <span className="hidden sm:inline">Mis Viajes</span>
          </button>

          {/* Acceso discreto al Centro Comercial TEI */}
          <Link
            to="/"
            className="bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md px-3 py-2 rounded-2xl border border-gray-700/60 shadow-lg text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition"
            title="Ir al Centro Comercial TEI"
          >
            <Store size={15} className="text-cyan-400" />
            <span className="hidden sm:inline">TEI</span>
          </Link>
        </div>
        
        {/* Indicador de estado en vivo */}
        {tripSent && (
          <div className="bg-gray-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/50 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              {acceptedDriver ? (acceptedDriver.status === 'in_progress' ? 'En Viaje' : 'Conductor Asignado') : 'Buscando'}
            </span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. TARJETA FLOTANTE: BUSCANDO CONDUCTOR (MAPA VISIBLE) */}
      {/* ======================================================== */}
      {tripSent && !acceptedDriver && (
        <div className="absolute inset-x-0 bottom-4 px-4 z-20 max-w-lg mx-auto pointer-events-auto animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-emerald-500/80 rounded-3xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/40">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex-1 truncate">
                <h3 className="font-black text-white text-base">Buscando conductores cercanos...</h3>
                <p className="text-xs text-gray-400">Subastando tu oferta en el radar TEI</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-emerald-400">${parseFloat(price || 0).toLocaleString('es-CO')}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{distanceInfo.distance}</div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-1 inline-block ${activePaymentMethod === 'tei_bank' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                  {activePaymentMethod === 'tei_bank' ? '🏦 Saldo Banco TEI' : '💵 Efectivo'}
                </span>
              </div>
            </div>

            {/* Resumen Origen y Destino */}
            <div className="bg-gray-800/60 rounded-xl p-3 mb-3 text-xs space-y-1.5 border border-gray-700/60">
              <div className="flex items-center gap-2 truncate text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="truncate">{originRef.current?.value || 'Tu ubicación'}</span>
              </div>
              <div className="flex items-center gap-2 truncate text-white font-medium">
                <span className="w-2 h-2 rounded bg-rose-500 shrink-0"></span>
                <span className="truncate">{destinationRef.current?.value || 'Destino'}</span>
              </div>
            </div>

            {/* LISTA DE CONTRAOFERTAS DE CONDUCTORES EN TIEMPO REAL */}
            {incomingOffers.length > 0 && (
              <div className="mb-3.5 space-y-2 border-t border-gray-800 pt-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Contraofertas de Conductores ({incomingOffers.length})
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Tú decides cuál aceptar</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {incomingOffers.map((offer) => {
                    const diffPrice = offer.price - parseFloat(price || 0);
                    return (
                      <div 
                        key={offer.driver_id}
                        className="bg-gray-800/90 border border-cyan-500/50 rounded-2xl p-3 shadow-lg backdrop-blur-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">{offer.driver_name || 'Conductor TEI'}</span>
                              <span className="text-xs text-amber-400 font-bold">★ {offer.rating || '5.0'}</span>
                            </div>
                            <p className="text-[11px] text-gray-300 mt-0.5">
                              {offer.vehicle_brand} {offer.vehicle_model} {offer.vehicle_color ? `• ${offer.vehicle_color}` : ''}
                            </p>
                            {offer.vehicle_plate && (
                              <span className="bg-amber-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded uppercase inline-block mt-1">
                                {offer.vehicle_plate}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black text-emerald-400">
                              ${parseFloat(offer.price || 0).toLocaleString('es-CO')}
                            </div>
                            <div className="text-[10px] font-bold">
                              {diffPrice > 0 ? (
                                <span className="text-amber-400">+{diffPrice.toLocaleString('es-CO')} COP</span>
                              ) : diffPrice < 0 ? (
                                <span className="text-emerald-400">-{Math.abs(diffPrice).toLocaleString('es-CO')} COP</span>
                              ) : (
                                <span className="text-cyan-400">Mismo valor</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1 border-t border-gray-700/60 mt-2">
                          <button
                            onClick={() => handleRejectDriverOffer(offer.driver_id)}
                            className="w-24 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold rounded-xl text-xs transition border border-gray-600"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleAcceptDriverOffer(offer)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Check size={16} />
                            Aceptar ${parseFloat(offer.price || 0).toLocaleString('es-CO')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={handleCancelSearch}
              className="w-full py-2.5 bg-gray-800 hover:bg-rose-950/40 border border-gray-700 hover:border-rose-500/80 text-rose-400 font-bold rounded-xl text-xs transition flex justify-center items-center gap-1.5"
            >
              <X size={16} />
              Cancelar Búsqueda
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TARJETA FLOTANTE: CONDUCTOR ASIGNADO (MAPA & GPS EN VIVO) */}
      {/* ======================================================== */}
      {acceptedDriver && !tripCompleted && (
        <div className="absolute inset-x-0 bottom-4 px-4 z-20 max-w-lg mx-auto pointer-events-auto animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-500 rounded-3xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
            
            {/* Banner superior de estado */}
            <div className="flex justify-between items-center mb-3">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${acceptedDriver.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                {acceptedDriver.status === 'in_progress' ? '🟢 En Ruta hacia tu Destino' : '🚗 Conductor en Camino a Recogerte'}
              </span>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400 block">
                  ${parseFloat(acceptedDriver.finalPrice || 0).toLocaleString('es-CO')}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-block mt-0.5 ${activePaymentMethod === 'tei_bank' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                  {activePaymentMethod === 'tei_bank' ? '🏦 Pagado con Banco TEI (No pagar efectivo)' : '💵 Pagar en Efectivo'}
                </span>
              </div>
            </div>

            {/* Fila del Conductor & Vehículo */}
            <div className="flex items-center gap-3.5 mb-4 bg-gray-800/70 p-3.5 rounded-2xl border border-gray-700/60">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-gray-950 font-black text-lg shadow-md shrink-0">
                {acceptedDriver.name ? acceptedDriver.name.charAt(0) : 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base truncate">{acceptedDriver.name}</h3>
                  <span className="text-xs text-amber-400 font-bold shrink-0">★ 5.0</span>
                </div>
                <p className="text-xs text-gray-300 truncate mt-0.5">
                  {acceptedDriver.vehicleModel || 'Vehículo'} {acceptedDriver.vehicleColor ? `• ${acceptedDriver.vehicleColor}` : ''}
                </p>
              </div>

              {/* Placa Colombiana */}
              {acceptedDriver.vehiclePlate && (
                <div className="bg-amber-400 text-gray-950 px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase shadow-sm border border-amber-500 shrink-0">
                  {acceptedDriver.vehiclePlate}
                </div>
              )}
            </div>

            {/* Indicador de seguimiento GPS en vivo */}
            {liveDriverLocation && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-3 px-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Vehículo transmitiendo posición GPS en vivo en el mapa
              </div>
            )}

            {/* Botones de Comunicación y Cancelación */}
            <div className="flex gap-2">
              {acceptedDriver.phone && (
                <button 
                  onClick={() => openDriverWhatsApp(acceptedDriver.phone, acceptedDriver.name)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow transition"
                >
                  <MessageSquare size={16} />
                  WhatsApp
                </button>
              )}

              {acceptedDriver.phone && (
                <a 
                  href={`tel:${acceptedDriver.phone}`}
                  className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow transition"
                >
                  <Phone size={16} />
                  Llamar
                </a>
              )}

              {/* Botón SOS / Pánico */}
              <button 
                onClick={() => setIsSosOpen(true)}
                className="py-2.5 px-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-red-400 transition animate-pulse shrink-0"
                title="Botón de Pánico y Seguridad SOS"
              >
                <ShieldAlert size={16} />
                SOS
              </button>

              {acceptedDriver.status === 'accepted' && (
                <button 
                  onClick={handleCancelActiveTrip}
                  className="py-2.5 px-3 bg-gray-800 hover:bg-rose-950/40 border border-gray-700 hover:border-rose-500 text-rose-400 font-bold rounded-xl text-xs transition"
                  title="Cancelar Viaje"
                >
                  Cancelar
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL DE CALIFICACIÓN (7 ESTRELLAS) */}
      {/* ======================================================== */}
      {tripCompleted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-xl px-4 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] mb-4 animate-bounce">
            <CheckCircle className="text-gray-950 w-10 h-10" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-1 text-center">¡Llegaste a tu destino!</h2>
          <p className="text-emerald-400 text-sm font-semibold mb-6 text-center">
            ¿Cómo fue tu servicio con {acceptedDriver?.name}?
          </p>
          
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-center text-gray-400 font-bold mb-5 tracking-widest text-xs uppercase">Califica tu experiencia (1 a 7)</h3>
            
            <div className="flex justify-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setRating(star)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-125"
                >
                  <Star 
                    className={`w-8 h-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-gray-600'}`} 
                  />
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => handleRateDriver(rating || 7)} 
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all mb-2.5 ${rating > 0 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-950 shadow-lg' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              disabled={rating === 0}
            >
              Enviar Calificación
            </button>

            <button
              onClick={() => {
                const rec = {
                  id: activeTripId,
                  role: 'pasajero',
                  status: 'completed',
                  completed_at: new Date().toLocaleString('es-CO'),
                  origin_address: originRef.current?.value || 'Origen del viaje',
                  destination_address: destinationRef.current?.value || 'Destino del viaje',
                  distance_km: parseFloat(distanceInfo.distance) || 0,
                  final_price: parseFloat(price || acceptedDriver?.finalPrice || 0),
                  driver_name: acceptedDriver?.name || 'Conductor TEI',
                  vehicle_plate: acceptedDriver?.vehiclePlate || '',
                  vehicle_model: acceptedDriver?.vehicleModel || '',
                  passenger_name: 'Tú (Pasajero)'
                };
                setReceiptTrip(rec);
              }}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold rounded-xl text-xs transition border border-gray-700 flex justify-center items-center gap-1.5"
            >
              <FileText size={14} />
              Ver Recibo Digital del Viaje
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PANEL INICIAL DE SOLICITUD (BOTTOM SHEET) */}
      {/* ======================================================== */}
      <div className={`absolute bottom-0 inset-x-0 w-full max-w-xl mx-auto bg-gray-900/90 backdrop-blur-xl rounded-t-3xl border-t border-gray-700/60 p-5 transition-all duration-500 ease-out z-10 ${tripSent ? 'translate-y-full' : 'translate-y-0'}`}>
        
        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3"></div>

        {/* TARJETA DE USUARIO Y VINCULACIÓN DE BILLETERA TEI */}
        <div className="bg-gradient-to-r from-gray-800/90 via-gray-800/70 to-gray-800/90 border border-gray-700/80 rounded-2xl p-2.5 px-3 mb-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow flex-shrink-0">
                {passengerBalance?.username ? passengerBalance.username.charAt(0).toUpperCase() : '👤'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pasajero Vinculado:</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <span className="text-xs md:text-sm font-black text-white truncate block">
                  {passengerBalance?.username || passengerBalance?.name || 'Usuario Pasajero'}
                </span>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Saldo Banco TEI</span>
              <span className="text-xs md:text-sm font-black text-cyan-400 font-mono">
                ${(passengerBalance.available_balance_cop || 0).toLocaleString('es-CO')} <span className="text-[10px] text-gray-400 font-normal">COP</span>
              </span>
              <span className="text-[9px] text-gray-400 font-mono block">
                (${(passengerBalance.available_balance_usd || 0).toFixed(2)} USD)
              </span>
            </div>
          </div>

          {!passengerBalance?.is_authenticated && !localStorage.getItem('access_token') && (
            <div className="mt-2 pt-2 border-t border-gray-700/60 flex items-center justify-between text-xs text-amber-300">
              <span className="text-[11px]">⚠️ Sin sesión activa. Inicia sesión con tu usuario TEI.</span>
              <a href="/login" className="px-2 py-0.5 bg-amber-500 text-gray-950 font-bold rounded text-[11px] hover:bg-amber-400 transition">
                Iniciar Sesión
              </a>
            </div>
          )}
        </div>

        {/* INPUTS DE ORIGEN Y DESTINO */}
        {isLoaded && (
          <div className="bg-gray-800/60 rounded-2xl p-3 mb-4 relative border border-gray-700/60">
            <div className="absolute left-5 top-6 w-0.5 h-10 bg-gray-700"></div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full z-10 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0"></div>
              <Autocomplete onPlaceChanged={calculateRouteAndPrice} className="w-full">
                <input 
                  type="text" 
                  ref={originRef}
                  placeholder="¿Dónde te recogemos?" 
                  className="w-full bg-transparent text-white focus:outline-none placeholder-gray-500 text-sm font-medium"
                />
              </Autocomplete>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="text-cyan-400 z-10 shrink-0" size={16} />
              <Autocomplete onPlaceChanged={calculateRouteAndPrice} className="w-full">
                <input 
                  type="text" 
                  ref={destinationRef}
                  placeholder="¿A dónde vas?" 
                  className="w-full bg-transparent text-white focus:outline-none placeholder-gray-500 text-sm font-bold"
                />
              </Autocomplete>
            </div>
          </div>
        )}

        {/* INFO DE DISTANCIA, CLIMA Y PRECIO SUGERIDO */}
        {distanceInfo.distance && (
          <div className="flex flex-col gap-1 px-2 mb-3 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>{distanceInfo.distance} • {distanceInfo.time}</span>
              {suggestedPrice && (
                <span className="text-emerald-400 font-bold">Sugerido: ${suggestedPrice.toLocaleString('es-CO')}</span>
              )}
            </div>
            {isRaining && (
              <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2 py-1.5 rounded-lg font-medium text-[11px] animate-pulse">
                <CloudRain size={14} className="shrink-0 text-cyan-300" />
                <span>🌧️ Lluvia activa ({weatherNote || 'Precipitación'}). Tarifa de lluvia aplicada: Arranque $6.200, {(new Date().getDay() === 0) ? '$1.800/km (Dominical)' : '$1.500/km'}, $450/min (Mínimo $8.200). Cuota App $950.</span>
              </div>
            )}
            {isAirport && (vehicle === 'carro' || vehicle === 'taxi') && (
              <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-700/60 px-2 py-1.5 rounded-lg font-medium text-[11px]">
                <Plane size={14} className="shrink-0 text-amber-400" />
                <span>✈️ Trayecto Aeropuerto: Incluye recargo oficial de $3.700 COP para Carro/Taxi.</span>
              </div>
            )}
          </div>
        )}

        {/* SELECCIÓN DE VEHÍCULO */}
        <div className="flex justify-between gap-2 mb-3">
          <button 
            onClick={() => setVehicle('moto')}
            className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${vehicle === 'moto' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}
          >
            <Bike size={20} className="mb-1" />
            <span className="text-[11px] font-bold">Moto</span>
          </button>
          <button 
            onClick={() => setVehicle('carro')}
            className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${vehicle === 'carro' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-md' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}
          >
            <Car size={20} className="mb-1" />
            <span className="text-[11px] font-bold">Carro</span>
          </button>
          <button 
            onClick={() => setVehicle('taxi')}
            className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${vehicle === 'taxi' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-md' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}
          >
            <Car size={20} className="mb-1" />
            <span className="text-[11px] font-bold">Taxi</span>
          </button>
          <button 
            onClick={() => setVehicle('camion')}
            className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${vehicle === 'camion' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}
          >
            <Truck size={20} className="mb-1" />
            <span className="text-[11px] font-bold">Carga</span>
          </button>
        </div>

        {/* SUBMENÚ DE CARGA */}
        {vehicle === 'camion' && (
          <div className="bg-gray-800/60 rounded-xl p-3 mb-3 border border-gray-700 text-xs">
            <h3 className="font-bold text-gray-300 mb-2">Tipo de Carga</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button 
                onClick={() => setCargoType('moto_carga')}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${cargoType === 'moto_carga' ? 'bg-amber-500 text-gray-950 font-bold border-amber-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              >
                Moto Carga (Domi)
              </button>
              <button 
                onClick={() => setCargoType('carga_liviana')}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${cargoType === 'carga_liviana' ? 'bg-amber-500 text-gray-950 font-bold border-amber-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              >
                Platón (Liviana)
              </button>
              <button 
                onClick={() => setCargoType('furgon')}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${cargoType === 'furgon' ? 'bg-amber-500 text-gray-950 font-bold border-amber-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              >
                Furgón (3 Ton)
              </button>
              <button 
                onClick={() => setCargoType('camion_pesado')}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${cargoType === 'camion_pesado' ? 'bg-amber-500 text-gray-950 font-bold border-amber-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              >
                Camión (5 Ton)
              </button>
            </div>
            
            {cargoType !== 'moto_carga' && (
              <div className="flex items-center justify-between bg-gray-900/60 p-2.5 rounded-lg border border-gray-700/60">
                <span className="text-gray-300">Ayudantes:</span>
                <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-700">
                  {[0, 1, 2].map(num => (
                    <button
                      key={num}
                      onClick={() => setHelpersCount(num)}
                      className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${helpersCount === num ? 'bg-emerald-500 text-gray-950' : 'text-gray-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELECTOR DE MÉTODO DE PAGO (EFECTIVO vs SALDO BANCO TEI vs BOLSA FIDELIZACIÓN TEI) */}
        <div className="bg-gray-800/80 rounded-2xl p-3 mb-3 border border-gray-700/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Método de Pago:</span>
            <div className="flex items-center gap-3 text-[10px] font-extrabold font-mono">
              <span className="text-cyan-400 flex items-center gap-1">
                <Wallet size={12} />
                Banco: ${(passengerBalance.available_balance_cop || 0).toLocaleString('es-CO')}
              </span>
              <span className="text-indigo-300 flex items-center gap-1">
                🎁 Fidelización: ${(passengerBalance.loyalty_balance_cop || 0).toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Opción Efectivo */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                paymentMethod === 'cash'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${paymentMethod === 'cash' ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                <Banknote size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black block leading-tight truncate">Efectivo</span>
                <span className="text-[9px] text-gray-400 block truncate">Al conductor</span>
              </div>
            </button>

            {/* Opción Saldo Banco TEI */}
            <button
              type="button"
              onClick={() => setPaymentMethod('tei_bank')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                paymentMethod === 'tei_bank'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-400/50'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${paymentMethod === 'tei_bank' ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                <Building size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black block leading-tight truncate">Banco TEI</span>
                <span className="text-[9px] text-cyan-400 font-bold block truncate font-mono">
                  ${(passengerBalance.available_balance_usd || 0).toFixed(2)} USD
                </span>
              </div>
            </button>

            {/* Opción Bolsa Fidelización TEI */}
            <button
              type="button"
              onClick={() => setPaymentMethod('loyalty_bag')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                paymentMethod === 'loyalty_bag'
                  ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-400/50'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 text-xs ${paymentMethod === 'loyalty_bag' ? 'bg-indigo-400 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                🎁
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black block leading-tight truncate">Fidelización</span>
                <span className="text-[9px] text-indigo-300 font-bold block truncate font-mono">
                  ${(passengerBalance.loyalty_balance_usd || 0).toFixed(2)} USD
                </span>
              </div>
            </button>
          </div>

          {(paymentMethod === 'tei_bank' || paymentMethod === 'loyalty_bag') && (
            <div className="mt-2 pt-2 border-t border-gray-700/60 flex items-center justify-between text-[11px] px-1">
              <span className="text-emerald-400 font-bold">
                ✓ {paymentMethod === 'loyalty_bag' ? 'Canje Bolsa Fidelización (Efectivo inmediato para el conductor)' : 'Descuento automático Banco TEI (No cobro en efectivo)'}
              </span>
              {(() => {
                const selectedBalCop = paymentMethod === 'loyalty_bag'
                  ? (passengerBalance.loyalty_balance_cop || 0)
                  : (passengerBalance.available_balance_cop || 0);
                return parseFloat(price || 0) > selectedBalCop ? (
                  <span className="text-rose-400 font-black animate-pulse">
                    ⚠️ Saldo insuficiente (${selectedBalCop.toLocaleString('es-CO')} de ${(parseFloat(price || 0)).toLocaleString('es-CO')})
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    ✓ Saldo suficiente
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {/* OFERTA DE PRECIO Y BOTÓN PEDIR */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-800/80 rounded-2xl border border-gray-700 flex items-center px-3.5">
            <span className="text-gray-400 text-lg font-bold mr-1.5">$</span>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ofrece tu tarifa" 
              className="w-full bg-transparent text-white focus:outline-none text-lg font-black placeholder-gray-500"
            />
          </div>
          <button 
            onClick={handleRequestRide}
            disabled={isSearching}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black py-3.5 px-6 rounded-2xl shadow-lg transition active:scale-95 flex justify-center items-center gap-1.5 text-sm disabled:opacity-50"
          >
            <span>{isSearching ? 'Enviando...' : 'Pedir'}</span>
            {!isSearching && <Navigation size={18} />}
          </button>
        </div>
      </div>

      {/* MODAL DE EMERGENCIA / SOS PÁNICO */}
      <EmergencyModal 
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        trip={{
          id: activeTripId,
          lat: liveDriverLocation?.lat || center.lat,
          lng: liveDriverLocation?.lng || center.lng,
          origin: originRef.current?.value,
          destination: destinationRef.current?.value,
          name: acceptedDriver?.name,
          vehiclePlate: acceptedDriver?.vehiclePlate
        }}
        userRole="pasajero"
      />

      {/* MODAL HISTORIAL DE VIAJES Y RECIBOS */}
      <TripHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        userRole="pasajero"
      />

      {/* MODAL RECIBO DIGITAL INDIVIDUAL */}
      <DigitalReceiptModal
        isOpen={Boolean(receiptTrip)}
        onClose={() => setReceiptTrip(null)}
        trip={receiptTrip}
        userRole="pasajero"
        backLabel={tripCompleted ? "Volver a Calificar" : "Cerrar Recibo"}
      />

    </div>
  );
}
