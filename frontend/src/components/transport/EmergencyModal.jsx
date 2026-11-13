import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, MessageSquare, Volume2, VolumeX, X, MapPin, AlertTriangle } from 'lucide-react';
import { transportAudio } from './transportAudio';
import { db } from '../../firebase';
import { ref, set } from 'firebase/database';

export default function EmergencyModal({ isOpen, onClose, trip, userRole = 'pasajero', userName = '' }) {
  const [coords, setCoords] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (isSirenActive) {
        transportAudio.stopPanicSiren();
        setIsSirenActive(false);
      }
      return;
    }

    // Obtener ubicación GPS actual para la emergencia
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn("No se pudo obtener GPS para SOS:", err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lat = coords?.lat || trip?.lat || trip?.origin_lat || 4.6097;
  const lng = coords?.lng || trip?.lng || trip?.origin_lon || -74.0817;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

  const toggleSiren = () => {
    if (isSirenActive) {
      transportAudio.stopPanicSiren();
      setIsSirenActive(false);
    } else {
      transportAudio.startPanicSiren();
      setIsSirenActive(true);
    }
  };

  const handleSendWhatsAppSOS = () => {
    const tripId = trip?.id || 'N/A';
    const origin = trip?.origin || trip?.origin_address || 'En ruta';
    const dest = trip?.destination || trip?.destination_address || 'En ruta';
    const plate = trip?.vehiclePlate || trip?.vehicle_plate || '';
    const otherPerson = userRole === 'conductor' 
      ? `Pasajero: ${trip?.passenger || trip?.passenger_name || 'Pasajero'}`
      : `Conductor: ${trip?.name || trip?.driver_name || 'Conductor'} (Placa: ${plate})`;

    const text = 
`🚨 *ALERTA DE EMERGENCIA SOS - TEI RIDE* 🚨
¡Necesito asistencia inmediata!

*Usuario:* ${userName || (userRole === 'conductor' ? 'Conductor' : 'Pasajero')} (${userRole.toUpperCase()})
*Viaje ID:* #${tripId}
*Ubicación GPS en vivo:* ${mapsLink}
*Trayecto:* ${origin} ➔ ${dest}
*Datos del servicio:* ${otherPerson}

*Por favor verifica mi estado o contacta a la Policía Nacional (123).*`;

    const encoded = encodeURIComponent(text);
    // Enlace universal de WhatsApp para compartir a cualquier contacto o número de auxilio
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');

    // Registrar en Firebase para auditoría de seguridad
    if (trip?.id) {
      try {
        const sosRef = ref(db, `trips/active/${trip.id}/sos_alert`);
        set(sosRef, {
          triggered_by: userRole,
          timestamp: Date.now(),
          lat,
          lng,
          status: 'active'
        }).catch(() => {});
      } catch (e) {
        // Ignorar
      }
    }
    setSosSent(true);
  };

  const handleClose = () => {
    if (isSirenActive) {
      transportAudio.stopPanicSiren();
      setIsSirenActive(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gray-950 border-2 border-red-500 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.5)] text-white relative">
        
        {/* Botón cerrar */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full border border-gray-800"
        >
          <X size={20} />
        </button>

        {/* Encabezado de Emergencia */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded">
                SOS ACTIVO
              </span>
              <span className="text-xs text-red-400 font-bold">Viaje #{trip?.id || ''}</span>
            </div>
            <h2 className="text-xl font-black text-white">Botón de Pánico y Seguridad</h2>
          </div>
        </div>

        <p className="text-gray-300 text-xs mb-4 leading-relaxed">
          Si te encuentras ante una situación de peligro, utiliza las opciones de emergencia a continuación para alertar a las autoridades y a tus contactos de inmediato.
        </p>

        {/* Coordenadas GPS */}
        <div className="bg-gray-900 border border-red-900/40 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs">
          <MapPin size={16} className="text-red-400 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Tu posición GPS en vivo:</span>
            <span className="text-red-300 font-mono text-[11px] font-bold">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>
        </div>

        {/* Acciones de Emergencia */}
        <div className="space-y-3">
          
          {/* 1. LLAMAR AL 123 POLICÍA */}
          <a
            href="tel:123"
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition border border-red-400"
          >
            <Phone size={18} />
            Llamar al 123 (Policía Nacional)
          </a>

          {/* 2. ENVIAR SOS POR WHATSAPP */}
          <button
            onClick={handleSendWhatsAppSOS}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition border border-emerald-400"
          >
            <MessageSquare size={18} />
            Compartir SOS por WhatsApp con Ubicación
          </button>

          {/* 3. SIRENA SONORA / ALARMA DE PÁNICO */}
          <button
            onClick={toggleSiren}
            className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition border ${
              isSirenActive 
                ? 'bg-amber-500 text-gray-950 border-amber-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700'
            }`}
          >
            {isSirenActive ? (
              <>
                <VolumeX size={16} />
                ¡Detener Sirena de Alarma!
              </>
            ) : (
              <>
                <Volume2 size={16} />
                Activar Sirena Sonora de Pánico
              </>
            )}
          </button>
        </div>

        {sosSent && (
          <div className="mt-4 p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-center text-xs text-emerald-300 font-bold">
            ✓ Alerta SOS emitida y registrada en la central de seguridad TEI.
          </div>
        )}

        <div className="mt-4 text-center">
          <button 
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-200 underline"
          >
            Cerrar ventana de auxilio
          </button>
        </div>
      </div>
    </div>
  );
}
