import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, Star, MapPin, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/api';
import DigitalReceiptModal from './DigitalReceiptModal';

export default function TripHistoryModal({ isOpen, onClose, userRole = 'pasajero' }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, cancelled
  const [selectedReceiptTrip, setSelectedReceiptTrip] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/transport/trips/history');
      if (res.data && res.data.trips) {
        setTrips(res.data.trips);
      }
    } catch (error) {
      console.error("Error al cargar historial de viajes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTrips = trips.filter(t => {
    if (filter === 'completed') return t.status === 'completed' || t.status === 'COMPLETED';
    if (filter === 'cancelled') return t.status === 'cancelled' || t.status === 'CANCELLED';
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in">
        <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] text-white overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Historial de Viajes</h2>
                <p className="text-xs text-gray-400">
                  {userRole === 'conductor' ? 'Tus servicios conducidos' : 'Tus viajes como pasajero'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchHistory}
                className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full border border-gray-700 transition"
                title="Actualizar historial"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full border border-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-5 py-3 bg-gray-950/50 border-b border-gray-800/80 flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'completed', label: 'Completados' },
              { id: 'cancelled', label: 'Cancelados' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filter === f.id
                    ? 'bg-emerald-500 text-gray-950 shadow-md'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de viajes */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-gray-800/40">
            {loading ? (
              <div className="text-center py-12 text-gray-400 animate-pulse text-sm">
                Cargando tu historial de viajes...
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                No tienes viajes registrados en esta categoría.
              </div>
            ) : (
              filteredTrips.map(trip => (
                <div 
                  key={trip.id} 
                  className="bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/60 rounded-2xl p-4 transition shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        trip.status === 'completed' || trip.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {trip.status === 'cancelled' || trip.status === 'CANCELLED' ? 'Cancelado' : 'Completado'}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium ml-2">
                        {trip.completed_at || trip.created_at}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">
                        ${parseFloat(trip.final_price || 0).toLocaleString('es-CO')}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">
                        {userRole === 'conductor' ? `Neto: $${parseFloat(trip.net_earnings || 0).toLocaleString('es-CO')}` : 'Total'}
                      </div>
                    </div>
                  </div>

                  {/* Rutas Origen / Destino */}
                  <div className="space-y-1 mb-3 text-xs pl-1">
                    <div className="flex items-center gap-2 text-gray-300 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                      <span className="truncate">{trip.origin_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white font-medium truncate">
                      <div className="w-2 h-2 rounded bg-rose-500 shrink-0"></div>
                      <span className="truncate">{trip.destination_address}</span>
                    </div>
                  </div>

                  {/* Pie de tarjeta: Conductor/Pasajero + Botón Recibo */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700/50 text-xs">
                    <div className="text-gray-400 truncate">
                      {userRole === 'conductor' ? (
                        <span>Pasajero: <strong className="text-gray-200">{trip.passenger_name}</strong></span>
                      ) : (
                        <span>
                          Conductor: <strong className="text-gray-200">{trip.driver_name}</strong>
                          {trip.vehicle_plate && <span className="ml-1 px-1 bg-amber-400 text-gray-950 font-black rounded text-[10px]">{trip.vehicle_plate}</span>}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedReceiptTrip(trip)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <FileText size={13} />
                      Ver Recibo
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-950 border-t border-gray-800 text-center">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white font-semibold"
            >
              Cerrar Historial
            </button>
          </div>

        </div>
      </div>

      {/* Modal de Recibo Digital Individual */}
      {selectedReceiptTrip && (
        <DigitalReceiptModal
          isOpen={Boolean(selectedReceiptTrip)}
          onClose={() => setSelectedReceiptTrip(null)}
          trip={selectedReceiptTrip}
          userRole={userRole}
        />
      )}
    </>
  );
}
