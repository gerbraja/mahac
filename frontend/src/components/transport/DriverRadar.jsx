import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Check, X, ShieldAlert, Power, Navigation, Phone, MessageSquare, ExternalLink, Wallet, Volume2, VolumeX, FileText, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, onValue, off, set } from 'firebase/database';
import { signInWithCustomToken } from 'firebase/auth';
import { api } from '../../api/api';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
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

const defaultCenter = {
  lat: 4.6097,
  lng: -74.0817
};

export default function DriverRadar() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [driverBalanceCop, setDriverBalanceCop] = useState(null);
  const [map, setMap] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [activeDirections, setActiveDirections] = useState(null);

  // Estados de nuevas funcionalidades: Sonido, SOS, Historial y Calificación Mutua
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [receiptTrip, setReceiptTrip] = useState(null);
  const [finishedTripForRating, setFinishedTripForRating] = useState(null);
  const [passengerRating, setPassengerRating] = useState(5);
  const [passengerComment, setPassengerComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Estados de Liquidación Digital (Aviso persistente 20 minutos)
  const [recentSettlement, setRecentSettlement] = useState(null);
  const [settlementDismissed, setSettlementDismissed] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [completedSettlement, setCompletedSettlement] = useState(null);

  const watchIdRef = useRef(null);
  const prevAuctionKeysRef = useRef(new Set());
  const prevOffersRef = useRef({});
  const isFirstLoadRef = useRef(true);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // 1. Obtener estado inicial del conductor, vehículo y saldo
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/transport/vehicle/me');
        setIsOnline(Boolean(res.data.is_active));
        setDriverId(res.data.user_id);
        setVehicleData(res.data);
      } catch (error) {
        console.error("No se pudo obtener el vehículo:", error);
      } finally {
        setIsLoadingStatus(false);
      }

      try {
        const walletRes = await api.get('/api/transport/driver-wallet');
        if (walletRes.data) {
          setDriverBalanceCop(walletRes.data.available_balance_cop || 0);
        }
      } catch (e) {
        console.warn("No se pudo cargar el saldo inicial de la billetera:", e);
      }
    };
    fetchStatus();
  }, []);

  // Escuchar liquidaciones digitales recientes en Firebase (persistentes por 20 minutos)
  useEffect(() => {
    if (!driverId) return;

    const settleRef = ref(db, `drivers/recent_settlements/${driverId}`);
    const unsub = onValue(settleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && data.is_digital && data.timestamp) {
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsed = nowSec - data.timestamp;
          if (elapsed < 1200) { // 20 minutos = 1200 segundos
            setRecentSettlement(data);
            setTimeLeftSeconds(1200 - elapsed);
            setSettlementDismissed(false);
          } else {
            setRecentSettlement(null);
          }
        }
      }
    });

    return () => {
      off(settleRef);
    };
  }, [driverId]);

  // Contador regresivo en tiempo real para el aviso de los 20 minutos
  useEffect(() => {
    if (!recentSettlement || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setRecentSettlement(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recentSettlement, timeLeftSeconds > 0]);

  // 2. Rastreo GPS del conductor en tiempo real
  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocalización no soportada en este navegador.");
      return;
    }

    // Inicializar posición de inmediato
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLocation(coords);
        if (map) map.panTo(coords);
      },
      (err) => console.warn("Error obteniendo posición inicial:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position continuo
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setDriverLocation(coords);

        // Guardar posición en Firebase RTDB
        if (driverId) {
          const locRef = ref(db, `drivers/locations/${driverId}`);
          set(locRef, {
            ...coords,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            timestamp: Date.now()
          }).catch(() => {});
        }

        // Si hay un viaje activo, emitir la posición al nodo del viaje para que el pasajero lo vea en tiempo real
        if (activeTrip?.id) {
          const tripLocRef = ref(db, `trips/active/${activeTrip.id}/driver_location`);
          set(tripLocRef, {
            ...coords,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            timestamp: Date.now()
          }).catch(() => {});
        }
      },
      (error) => {
        console.warn("Error en watchPosition del conductor:", error);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline, driverId, activeTrip?.id, map]);

  // 3. Conexión a Firebase y escucha de viajes activos
  useEffect(() => {
    let unsubscribe = () => {};

    if (!isOnline || !driverId) {
      setAuctions([]);
      setActiveTrip(null);
      return unsubscribe;
    }

    const setupFirebaseAndListen = async () => {
      try {
        const response = await api.get('/auth/firebase-token');
        const customToken = response.data.token;

        await signInWithCustomToken(auth, customToken);

        const tripsRef = ref(db, 'trips/active');
        unsubscribe = onValue(tripsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const tripsArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));

            // Comprobar si hay un viaje asignado a este conductor
            const myActiveTrip = tripsArray.find(t => 
              (parseInt(t.driver_id) === parseInt(driverId)) && 
              (t.status === 'accepted' || t.status === 'in_progress')
            );

            if (myActiveTrip) {
              setActiveTrip(myActiveTrip);
              setAuctions([]);
            } else {
              setActiveTrip(null);
              // Filtrar solicitudes disponibles en estado searching
              const available = tripsArray.filter(t => t.status === 'searching');

              // Detección de nuevos viajes o contraofertas para emitir alerta sonora
              const newKeys = new Set(available.map(a => a.id));
              if (!isFirstLoadRef.current && isOnline) {
                let hasNewTrip = false;
                let hasNewOffer = false;

                for (const item of available) {
                  if (!prevAuctionKeysRef.current.has(item.id)) {
                    hasNewTrip = true;
                    break;
                  }
                  // Verificar si aumentaron las contraofertas en esta solicitud
                  const prevCount = prevOffersRef.current[item.id] || 0;
                  const currentCount = item.counter_offers ? Object.keys(item.counter_offers).length : (item.offers ? Object.keys(item.offers).length : 0);
                  if (currentCount > prevCount) {
                    hasNewOffer = true;
                  }
                }

                if (soundEnabled) {
                  if (hasNewTrip) {
                    transportAudio.playNewTripChime();
                  } else if (hasNewOffer) {
                    transportAudio.playCounterOfferBeep();
                  }
                }
              }

              isFirstLoadRef.current = false;
              prevAuctionKeysRef.current = newKeys;
              const offersMap = {};
              available.forEach(item => {
                offersMap[item.id] = item.counter_offers ? Object.keys(item.counter_offers).length : (item.offers ? Object.keys(item.offers).length : 0);
              });
              prevOffersRef.current = offersMap;

              setAuctions(available.reverse());
            }
          } else {
            setAuctions([]);
            setActiveTrip(null);
          }
        });
      } catch (error) {
        console.error("Error conectando con Firebase en el radar del conductor:", error);
      }
    };

    setupFirebaseAndListen();

    return () => {
      unsubscribe();
      const tripsRef = ref(db, 'trips/active');
      off(tripsRef);
    };
  }, [isOnline, driverId]);

  // 4. Calcular ruta visual en el mapa para el viaje activo
  useEffect(() => {
    if (!activeTrip || !window.google || !window.google.maps) {
      setActiveDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Si status es 'accepted': ruta desde conductor hacia el origen del pasajero (recogida)
    // Si status es 'in_progress': ruta desde el origen hacia el destino
    const originPoint = (activeTrip.status === 'accepted' && driverLocation)
      ? driverLocation
      : (activeTrip.lat && activeTrip.lng ? { lat: activeTrip.lat, lng: activeTrip.lng } : activeTrip.origin);

    const destPoint = activeTrip.status === 'accepted'
      ? (activeTrip.lat && activeTrip.lng ? { lat: activeTrip.lat, lng: activeTrip.lng } : activeTrip.origin)
      : (activeTrip.dest_lat && activeTrip.dest_lng ? { lat: activeTrip.dest_lat, lng: activeTrip.dest_lng } : activeTrip.destination);

    directionsService.route(
      {
        origin: originPoint,
        destination: destPoint,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setActiveDirections(result);
        } else {
          console.warn("Directions request failed:", status);
        }
      }
    );
  }, [activeTrip?.id, activeTrip?.status, driverLocation?.lat, driverLocation?.lng]);

  // Auto-ajustar mapa del conductor para ver su ruta completa
  useEffect(() => {
    if (!map || !activeDirections) return;
    try {
      const bounds = activeDirections.routes[0]?.bounds;
      if (bounds) {
        map.fitBounds(bounds);
      }
    } catch (e) {
      console.warn("Error ajustando límites del mapa del conductor:", e);
    }
  }, [map, activeDirections]);

  const [counterTripId, setCounterTripId] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await api.post('/api/transport/vehicle/status', { is_online: newStatus });
    } catch (error) {
      console.error("Error cambiando estado:", error);
      setIsOnline(!newStatus);
      alert("No se pudo cambiar el estado de conexión.");
    }
  };

  const handleSendCounterOffer = async (tripId, amount) => {
    try {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) {
        alert("Por favor ingresa un monto válido para tu contraoferta.");
        return;
      }
      await api.post('/api/transport/trip/counter-offer', {
        trip_id: parseInt(tripId),
        amount: parsed
      });
      setCounterTripId(null);
      setCounterAmount('');
      alert("¡Contraoferta enviada al pasajero! El viaje se iniciará en cuanto el pasajero acepte tu oferta.");
    } catch (error) {
      console.error("Error enviando contraoferta:", error);
      let errorMsg = "No se pudo enviar la contraoferta.";
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

  const handleWithdrawOffer = async (tripId) => {
    try {
      await api.post(`/api/transport/trip/${tripId}/withdraw-offer`);
      alert("Contraoferta retirada exitosamente.");
    } catch (error) {
      console.error("Error retirando contraoferta:", error);
    }
  };

  const handleAcceptTrip = async (tripId) => {
    try {
      const payload = { trip_id: parseInt(tripId) };
      await api.post('/api/transport/trip/accept', payload);
      setCounterTripId(null);
      setCounterAmount('');
      alert("¡Viaje aceptado exitosamente! Inicia el recorrido hacia el pasajero.");
    } catch (error) {
      console.error("Error aceptando viaje:", error);
      let errorMsg = "No se pudo procesar la oferta del viaje.";
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

  const handleStartTrip = async () => {
    if (!activeTrip) return;
    try {
      await api.post(`/api/transport/trip/${activeTrip.id}/start`);
      alert("¡Viaje Iniciado! Conduce con precaución hacia el destino.");
    } catch (error) {
      console.error("Error iniciando viaje:", error);
      alert("Hubo un problema al iniciar el viaje.");
    }
  };

  const handleFinishTrip = async () => {
    if (!activeTrip) return;
    try {
      const tripCopy = { ...activeTrip };
      const res = await api.post(`/api/transport/trip/${activeTrip.id}/finish`);
      if (res.data?.settlement) {
        setCompletedSettlement(res.data.settlement);
        if (res.data.settlement.new_balance_cop !== undefined) {
          setDriverBalanceCop(res.data.settlement.new_balance_cop);
        }
      }
      // Preparar calificación mutua al pasajero
      setFinishedTripForRating(tripCopy);
      setPassengerRating(5);
      setPassengerComment('');
      setActiveTrip(null);
    } catch (error) {
      console.error("Error finalizando viaje:", error);
      alert("Hubo un problema al finalizar el viaje: " + (error.response?.data?.detail || error.message || error));
    }
  };

  const handleSubmitPassengerRating = async () => {
    if (!finishedTripForRating) return;
    setIsSubmittingRating(true);
    try {
      await api.post(`/api/transport/trip/${finishedTripForRating.id}/rate-passenger`, {
        stars: passengerRating,
        comment: passengerComment
      });
      // Preparar datos para recibo digital automático
      const finalAmt = parseFloat(finishedTripForRating.final_price || finishedTripForRating.price || 0);
      const feeAmt = finishedTripForRating.platform_fee !== undefined 
        ? parseFloat(finishedTripForRating.platform_fee) 
        : Math.round(finalAmt * 0.10);
      
      const receiptData = {
        id: finishedTripForRating.id,
        role: 'conductor',
        status: 'completed',
        completed_at: new Date().toLocaleString('es-CO'),
        origin_address: finishedTripForRating.origin || 'Origen del viaje',
        destination_address: finishedTripForRating.destination || 'Destino del viaje',
        distance_km: finishedTripForRating.distance_km || 0,
        final_price: finalAmt,
        platform_fee: feeAmt,
        net_earnings: Math.max(0, finalAmt - feeAmt),
        passenger_name: finishedTripForRating.passenger || 'Cliente TEI',
        driver_name: vehicleData ? `${vehicleData.brand} ${vehicleData.model}` : 'Conductor TEI',
        vehicle_plate: vehicleData?.license_plate || ''
      };
      setReceiptTrip(receiptData);
      setFinishedTripForRating(null);
    } catch (err) {
      console.error("Error al calificar al pasajero:", err);
      alert(err.response?.data?.detail || "No se pudo registrar la calificación del pasajero.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    if (window.confirm("¿Seguro que deseas cancelar el viaje? La comisión retenida será devuelta a tu Billetera.")) {
      try {
        await api.post(`/api/transport/trip/${activeTrip.id}/cancel`);
        alert("Viaje cancelado exitosamente.");
      } catch (error) {
        console.error("Error cancelando viaje:", error);
        alert("Hubo un problema al cancelar el viaje.");
      }
    }
  };

  // Abrir navegación GPS externa (Google Maps / Waze)
  const openExternalNavigation = (destAddress, lat, lng) => {
    const target = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(destAddress);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target}`;
    window.open(url, '_blank');
  };

  // Contactar al pasajero por WhatsApp
  const openPassengerWhatsApp = (phone, name) => {
    if (!phone) {
      alert("El pasajero no tiene número de teléfono registrado.");
      return;
    }
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('57') ? clean : `57${clean}`;
    const text = encodeURIComponent(`Hola ${name || ''}, soy tu conductor de TEI RIDE. Voy en camino a recogerte.`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  if (isLoadingStatus) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-sm font-semibold">Cargando perfil de conductor TEI...</p>
      </div>
    );
  }

  const currentCenter = driverLocation || defaultCenter;

  return (
    <div className="relative h-screen w-full bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* GOOGLE MAPS BACKGROUND */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentCenter}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
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
          {/* Marcador del Conductor en Vivo */}
          <Marker 
            position={currentCenter} 
            icon={{ 
              url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
              scaledSize: new window.google.maps.Size(36, 36)
            }}
            title="Mi Ubicación"
          />

          {/* Marcadores de subastas buscando en el mapa */}
          {isOnline && !activeTrip && auctions.map(auc => (
            auc.lat && auc.lng ? (
              <Marker
                key={auc.id}
                position={{ lat: auc.lat, lng: auc.lng }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
                title={`Pasajero: ${auc.passenger || 'Cliente TEI'}`}
              />
            ) : null
          ))}

          {/* Ruta en Vivo si hay viaje activo */}
          {activeDirections && (
            <DirectionsRenderer
              directions={activeDirections}
              options={{
                polylineOptions: { strokeColor: '#10b981', strokeWeight: 6 },
                suppressMarkers: false
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse">Cargando Mapas...</p>
        </div>
      )}
      
      {/* SUTIL GRADIENTE SUPERIOR */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gray-900/90 to-transparent pointer-events-none z-10"></div>
      
      {/* HEADER WITH TOGGLE & STATUS */}
      <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-20">
        <div>
          <button 
            onClick={toggleOnlineStatus}
            className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none mb-1.5 shadow-lg ${isOnline ? 'bg-emerald-500' : 'bg-gray-700'}`}
          >
            <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform shadow-md ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          
          <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isOnline ? 'text-emerald-400' : 'text-gray-400'}`}>
            {isOnline ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Conectado al Radar
              </>
            ) : (
              <>
                <div className="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
                Desconectado
              </>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow">
            {isOnline ? (activeTrip ? '⚡ Viaje en Curso' : '🔍 Escaneando Viajes...') : 'Pausa (Fuera de Línea)'}
          </h1>
        </div>
        
        {/* Controles de Sonido, Historial, Billetera y Vehículo */}
        <div className="flex items-center gap-2">
          {/* Botón Alertas de Sonido */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) transportAudio.playNewTripChime();
            }}
            className={`p-2.5 rounded-2xl border backdrop-blur-md transition shadow-lg ${
              soundEnabled 
                ? 'bg-gray-900/90 border-emerald-500/60 text-emerald-400 hover:bg-gray-800' 
                : 'bg-gray-900/90 border-gray-700 text-gray-500 hover:text-gray-400'
            }`}
            title={soundEnabled ? "Alertas de sonido activadas (clic para silenciar o probar timbre)" : "Sonido desactivado (clic para activar timbre)"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Botón Historial de Viajes */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-2xl text-gray-300 hover:text-white transition shadow-lg"
            title="Ver Historial de Viajes y Recibos"
          >
            <FileText size={16} />
          </button>
          {/* Botón Acceso Rápido Billetera */}
          <button
            onClick={() => navigate('/transport/driver/wallet')}
            className="bg-gray-900/90 hover:bg-gray-800 backdrop-blur-md border border-emerald-500/50 hover:border-emerald-400 rounded-2xl px-3 py-2 text-right shadow-lg transition active:scale-95 group"
            title="Ir a mi Billetera / Recargar Saldo"
          >
            <div className="flex items-center gap-1.5 justify-end">
              <Wallet size={14} className="text-emerald-400" />
              <span className="text-[10px] text-gray-400 font-bold uppercase">Billetera</span>
            </div>
            <p className="text-xs font-black text-emerald-400 mt-0.5">
              {driverBalanceCop !== null ? `$${driverBalanceCop.toLocaleString('es-CO')}` : 'Mi Saldo'}
            </p>
          </button>

          {/* Placa y Vehículo */}
          {vehicleData && (
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl px-3 py-2 text-right shadow-lg">
              <span className="bg-amber-400 text-gray-950 font-black text-xs px-2 py-0.5 rounded shadow-sm">
                {vehicleData.license_plate}
              </span>
              <p className="text-[11px] text-gray-300 font-semibold mt-1">
                {vehicleData.brand} {vehicleData.model}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BANNER PERSISTENTE 20 MINUTOS: LIQUIDACIÓN DIGITAL TEI */}
      {recentSettlement && !settlementDismissed && (
        <div className="absolute top-20 inset-x-4 max-w-xl mx-auto z-40 animate-fade-in">
          <div className="bg-gray-900/95 border-2 border-emerald-400 rounded-3xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.4)] backdrop-blur-xl relative">
            <button 
              onClick={() => setSettlementDismissed(true)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
              title="Cerrar aviso temporalmente"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                ✅ VIAJE PAGADO DIGITALMENTE — NO COBRAR EFECTIVO
              </h3>
            </div>

            <div className="bg-gray-950/80 rounded-2xl p-3 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Tarifa del Viaje #{recentSettlement.trip_id}:</span>
                <span className="font-bold text-white">${parseFloat(recentSettlement.total_fare || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>(-) Comisión TEI ({recentSettlement.platform_fee_percent || 10}%):</span>
                <span className="font-bold">-${parseFloat(recentSettlement.platform_fee || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-black border-t border-gray-800 pt-1.5 text-sm">
                <span>(=) Ganancia Neta Acreditada:</span>
                <span>+${parseFloat(recentSettlement.driver_net_earnings || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 border-t border-gray-800 pt-1">
                <span>Saldo Anterior: ${(recentSettlement.previous_balance_cop || 0).toLocaleString('es-CO')}</span>
                <span className="text-cyan-300 font-bold">➔ Nuevo Saldo: ${(recentSettlement.new_balance_cop || 0).toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2.5 px-1 text-[11px]">
              <span className="text-emerald-300 font-medium">Fondos acreditados a tu Billetera TEI</span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800">
                ⏱️ {Math.floor(timeLeftSeconds / 60)}m {timeLeftSeconds % 60}s restantes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RADAR SWEEP ANIMATION (Only if Online and searching) */}
      {isOnline && !activeTrip && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-[450px] h-[450px] border border-emerald-500/25 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping" style={{ animationDuration: '4s' }}></div>
          <div className="w-[280px] h-[280px] border border-emerald-500/35 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping" style={{ animationDuration: '4s', animationDelay: '1.2s' }}></div>
        </div>
      )}

      {/* OFFLINE MESSAGE */}
      {!isOnline && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6 text-center bg-gray-950/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 border border-gray-700 p-8 rounded-3xl shadow-2xl max-w-sm pointer-events-auto">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600">
              <Power className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Estás Desconectado</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enciende el interruptor arriba para recibir solicitudes de pasajeros en tu zona en tiempo real.
            </p>
            <button 
              onClick={toggleOnlineStatus}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black w-full py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
            >
              Conectarme Ahora
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE TRIP UI CARD */}
      {isOnline && activeTrip && (
        <div className="absolute inset-x-0 bottom-4 px-4 z-30 animate-fade-in max-w-xl mx-auto">
          <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-500 rounded-3xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.35)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {activeTrip.status === 'accepted' ? '🚗 En Camino a Recoger' : '🟢 En Ruta al Destino'}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-block ml-2 ${(activeTrip.payment_method === 'tei_bank' || activeTrip.payment_method === 'loyalty_bag') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                  {activeTrip.payment_method === 'loyalty_bag'
                    ? '🎁 BOLSA FIDELIZACIÓN TEI — NO COBRAR EFECTIVO'
                    : activeTrip.payment_method === 'tei_bank'
                    ? '🏦 VIAJE DIGITAL — NO COBRAR EFECTIVO'
                    : '💵 COBRAR EFECTIVO AL FINALIZAR'}
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  Pasajero: {activeTrip.passenger || 'Cliente TEI'}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">
                  ${parseFloat(activeTrip.final_price || activeTrip.price || 0).toLocaleString('es-CO')}
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Tarifa Total</div>
              </div>
            </div>
            
            {/* Rutas Origen / Destino */}
            <div className="space-y-2 mb-4 pl-1 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
                <div className="truncate">
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Recogida (Origen)</span>
                  <span className="text-gray-200">{activeTrip.origin}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded bg-rose-500 mt-1 shrink-0"></div>
                <div className="truncate">
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Llegada (Destino)</span>
                  <span className="text-white font-medium">{activeTrip.destination}</span>
                </div>
              </div>
            </div>
            
            {/* Botones de acción y navegación GPS */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {/* Botón Navegar Waze / Google Maps */}
                <button 
                  onClick={() => openExternalNavigation(
                    activeTrip.status === 'accepted' ? activeTrip.origin : activeTrip.destination,
                    activeTrip.status === 'accepted' ? activeTrip.lat : activeTrip.dest_lat,
                    activeTrip.status === 'accepted' ? activeTrip.lng : activeTrip.dest_lng
                  )}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-md transition"
                >
                  <Navigation size={15} />
                  GPS (Waze / Maps)
                </button>

                {/* Botón WhatsApp */}
                {activeTrip.passenger_phone && (
                  <button 
                    onClick={() => openPassengerWhatsApp(activeTrip.passenger_phone, activeTrip.passenger)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <MessageSquare size={15} />
                    WhatsApp
                  </button>
                )}

                {/* Botón SOS / Pánico */}
                <button 
                  onClick={() => setIsSosOpen(true)}
                  className="py-2.5 px-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-red-400 transition animate-pulse shrink-0"
                  title="Botón de Pánico y Seguridad SOS"
                >
                  <ShieldAlert size={16} />
                  SOS
                </button>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-800">
                {activeTrip.status === 'accepted' && (
                  <>
                    <button onClick={handleCancelTrip} className="flex-1 py-3 bg-gray-800 hover:bg-rose-900/40 border border-gray-700 hover:border-rose-500 text-gray-300 hover:text-rose-400 font-bold rounded-xl text-xs transition">
                      Cancelar
                    </button>
                    <button onClick={handleStartTrip} className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl shadow-lg transition flex justify-center items-center gap-2 text-sm">
                      <Check size={18} />
                      Iniciar Viaje (A Bordo)
                    </button>
                  </>
                )}
                
                {activeTrip.status === 'in_progress' && (
                  <button onClick={handleFinishTrip} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black rounded-xl shadow-xl transition flex justify-center items-center gap-2 text-sm">
                    <Check size={20} />
                    Terminar y Cobrar Viaje
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUCTION LIST - FLOATING CARDS EN TIEMPO REAL */}
      {isOnline && !activeTrip && (
        <div className="absolute bottom-4 left-0 w-full px-4 pb-2 overflow-x-auto flex gap-4 snap-x snap-mandatory hide-scrollbar z-20">
          
          {auctions.length === 0 && (
            <div className="w-full max-w-md mx-auto bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl py-4 text-center text-emerald-400/80 text-xs font-semibold animate-pulse shadow-lg">
              📡 Radar en línea. Esperando nuevas solicitudes de viaje en tu zona...
            </div>
          )}

          {auctions.map(auction => (
            <div key={auction.id} className="min-w-[85vw] md:min-w-[360px] snap-center backdrop-blur-xl bg-gray-900/90 border border-gray-700/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-gray-100 text-base">{auction.passenger || 'Pasajero TEI'}</h3>
                  <div className="text-xs text-amber-400 font-bold mt-0.5">
                    ★ 5.0 • {auction.vehicle_type ? auction.vehicle_type.toUpperCase() : 'SERVICIO'}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-block mt-1 ${(auction.payment_method === 'tei_bank' || auction.payment_method === 'loyalty_bag') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                    {auction.payment_method === 'loyalty_bag'
                      ? '🎁 Pago Bolsa Fidelización TEI (Sin cobro efectivo)'
                      : auction.payment_method === 'tei_bank'
                      ? '🏦 Pago Digital TEI (Sin cobro efectivo)'
                      : '💵 Pago en Efectivo'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    ${parseFloat(auction.price || 0).toLocaleString('es-CO')}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Oferta Pasajero</div>
                </div>
              </div>

              {/* Ruta */}
              <div className="space-y-2 mb-4 pl-1 text-xs">
                <div className="flex items-start gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-0.5 shrink-0"></div>
                  <p className="text-gray-300 truncate"><span className="text-gray-400 text-[10px] block uppercase font-bold">Recogida:</span>{auction.origin}</p>
                </div>
                <div className="flex items-start gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded bg-rose-500 mt-0.5 shrink-0"></div>
                  <p className="text-white truncate font-medium"><span className="text-gray-400 text-[10px] block uppercase font-bold">Destino:</span>{auction.destination}</p>
                </div>
              </div>

              {/* Estado de mi Contraoferta previa si existe */}
              {(() => {
                const myOffer = auction.offers && driverId ? auction.offers[driverId] : null;
                if (myOffer && myOffer.status === 'pending') {
                  return (
                    <div className="bg-cyan-950/50 border border-cyan-500/60 rounded-2xl p-3 mb-2 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          Contraoferta enviada: ${parseFloat(myOffer.price || 0).toLocaleString('es-CO')}
                        </div>
                        <p className="text-[10px] text-gray-300 mt-0.5">Esperando que el pasajero acepte o rechace...</p>
                      </div>
                      <button
                        onClick={() => handleWithdrawOffer(auction.id)}
                        className="text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 px-3 py-1.5 rounded-xl border border-rose-500/40 transition"
                      >
                        Retirar
                      </button>
                    </div>
                  );
                }
                if (myOffer && myOffer.status === 'rejected') {
                  return (
                    <div className="bg-rose-950/50 border border-rose-500/60 rounded-2xl p-3 mb-2 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="text-xs font-black text-rose-300">
                          Oferta de ${parseFloat(myOffer.price || 0).toLocaleString('es-CO')} rechazada
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Puedes enviar otra contraoferta o aceptar el precio</p>
                      </div>
                      <button
                        onClick={() => {
                          setCounterTripId(auction.id);
                          setCounterAmount('');
                        }}
                        className="text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 px-3 py-1.5 rounded-xl border border-amber-500/40 transition"
                      >
                        Re-ofertar
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Formulario de Contraoferta / Negociación en Subasta */}
              {counterTripId === auction.id ? (
                <div className="bg-gray-800/90 rounded-2xl p-2.5 border border-cyan-500/60 mb-2">
                  <div className="text-[11px] text-cyan-300 font-bold mb-1.5 flex justify-between items-center">
                    <span>💡 Tu Contraoferta (Subasta):</span>
                    <button onClick={() => setCounterTripId(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Ej: 17000"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <button 
                      onClick={() => handleSendCounterOffer(auction.id, counterAmount)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black px-3 py-1.5 rounded-xl text-xs transition"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setAuctions(auctions.filter(a => a.id !== auction.id))}
                  className="w-16 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Ignorar
                </button>

                {!(auction.offers && driverId && auction.offers[driverId]?.status === 'pending') && (
                  <>
                    <button 
                      onClick={() => {
                        setCounterTripId(counterTripId === auction.id ? null : auction.id);
                        setCounterAmount(auction.price || '');
                      }}
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1"
                    >
                      💬 Negociar
                    </button>
                    
                    <button 
                      onClick={() => handleAcceptTrip(auction.id)}
                      className="flex-[1.4] bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black py-2.5 rounded-xl shadow-lg transition active:scale-95 flex justify-center items-center gap-1 text-xs"
                    >
                      <Check size={16} />
                      Aceptar ${parseFloat(auction.price || 0).toLocaleString('es-CO')}
                    </button>
                  </>
                )}
              </div>
              
            </div>
          ))}
          
        </div>
      )}

      {/* MODAL DE EMERGENCIA / SOS PÁNICO */}
      <EmergencyModal 
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        trip={activeTrip}
        userRole="conductor"
        userName={vehicleData?.brand ? `${vehicleData.brand} (${vehicleData.license_plate})` : 'Conductor TEI'}
      />

      {/* MODAL HISTORIAL DE VIAJES */}
      <TripHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        userRole="conductor"
      />

      {/* MODAL RECIBO DIGITAL INDIVIDUAL */}
      <DigitalReceiptModal
        isOpen={Boolean(receiptTrip)}
        onClose={() => setReceiptTrip(null)}
        trip={receiptTrip}
        userRole="conductor"
        backLabel={finishedTripForRating ? "Volver a Calificar" : "Volver al Radar"}
      />

      {/* MODAL CALIFICACIÓN MUTUA AL PASAJERO */}
      {finishedTripForRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Star className="text-gray-950 w-9 h-9 fill-gray-950" />
            </div>
            
            <h2 className="text-2xl font-black text-center text-white mb-1">
              ¡Viaje Finalizado!
            </h2>
            <p className="text-emerald-400 text-xs font-semibold text-center mb-4">
              ¿Cómo fue tu experiencia con el pasajero ({finishedTripForRating.passenger || 'Cliente TEI'})?
            </p>

            {/* Resumen de Liquidación si fue Pago Digital TEI */}
            {completedSettlement && completedSettlement.is_digital && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 mb-4 text-xs space-y-1.5 shadow-inner">
                <span className="text-[10px] font-black text-emerald-300 uppercase block tracking-wider text-center">
                  ✅ VIAJE PAGADO DIGITALMENTE — NO COBRAR EFECTIVO
                </span>
                <div className="flex justify-between text-gray-300">
                  <span>Tarifa del Viaje #{completedSettlement.trip_id}:</span>
                  <span className="font-bold text-white">${parseFloat(completedSettlement.total_fare || 0).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>(-) Comisión TEI ({completedSettlement.platform_fee_percent || 10}%):</span>
                  <span>-${parseFloat(completedSettlement.platform_fee || 0).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-black border-t border-gray-800 pt-1 text-sm">
                  <span>Ganancia Neta Acreditada:</span>
                  <span>+${parseFloat(completedSettlement.driver_net_earnings || 0).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 border-t border-gray-800 pt-1">
                  <span>Saldo Anterior: ${(completedSettlement.previous_balance_cop || 0).toLocaleString('es-CO')}</span>
                  <span className="text-cyan-300 font-bold">➔ Nuevo: ${(completedSettlement.new_balance_cop || 0).toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            )}

            {/* Selector de 5 estrellas */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPassengerRating(star)}
                  className="transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star 
                    className={`w-9 h-9 ${passengerRating >= star ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-gray-600'}`} 
                  />
                </button>
              ))}
            </div>

            {/* Etiquetas rápidas */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {["Puntual", "Muy amable", "Respetuoso", "Excelente usuario"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPassengerComment(prev => prev ? `${prev}, ${tag}` : tag)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-700 transition"
                >
                  +{tag}
                </button>
              ))}
            </div>

            {/* Comentario opcional */}
            <textarea
              rows={2}
              value={passengerComment}
              onChange={(e) => setPassengerComment(e.target.value)}
              placeholder="Comentario sobre el pasajero (opcional)..."
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 mb-4"
            />

            {/* Botones de acción del Conductor */}
            <div className="space-y-2">
              <button
                onClick={handleSubmitPassengerRating}
                disabled={isSubmittingRating}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-sm transition shadow-lg flex justify-center items-center gap-2 active:scale-95"
              >
                {isSubmittingRating ? 'Guardando Calificación...' : 'Enviar Calificación y Finalizar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const finalAmt = parseFloat(finishedTripForRating.final_price || finishedTripForRating.price || 0);
                  const feeAmt = finishedTripForRating.platform_fee !== undefined 
                    ? parseFloat(finishedTripForRating.platform_fee) 
                    : Math.round(finalAmt * 0.15);
                  
                  const receiptData = {
                    id: finishedTripForRating.id,
                    role: 'conductor',
                    status: 'completed',
                    completed_at: new Date().toLocaleString('es-CO'),
                    origin_address: finishedTripForRating.origin || 'Origen del viaje',
                    destination_address: finishedTripForRating.destination || 'Destino del viaje',
                    distance_km: finishedTripForRating.distance_km || 0,
                    final_price: finalAmt,
                    platform_fee: feeAmt,
                    net_earnings: Math.max(0, finalAmt - feeAmt),
                    passenger_name: finishedTripForRating.passenger || 'Cliente TEI',
                    driver_name: vehicleData ? `${vehicleData.brand} ${vehicleData.model}` : 'Conductor TEI',
                    vehicle_plate: vehicleData?.license_plate || ''
                  };
                  setReceiptTrip(receiptData);
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold rounded-xl text-xs transition border border-gray-700 flex justify-center items-center gap-1.5 active:scale-95"
              >
                <FileText size={14} />
                Ver Factura / Recibo del Viaje
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
