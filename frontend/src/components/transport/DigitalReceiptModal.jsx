import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck, MapPin, User, Car, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

export default function DigitalReceiptModal({ isOpen, onClose, trip, userRole = 'pasajero', backLabel = 'Volver a Calificar' }) {
  if (!isOpen || !trip) return null;

  const isDriver = userRole === 'conductor' || trip.role === 'conductor';
  const finalPrice = trip.final_price || trip.price || trip.proposed_price || 0;
  const platformFee = trip.platform_fee || 0;
  const netEarnings = trip.net_earnings !== undefined ? trip.net_earnings : Math.max(0, finalPrice - platformFee);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white relative print:border-none print:shadow-none print:text-black print:bg-white">
        
        {/* Cabecera del Recibo */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-center relative print:bg-none print:text-black print:p-2 print:border-b">
          
          {/* Flecha para Volver Atrás */}
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-bold rounded-xl transition print:hidden shadow-md"
            title="Volver atrás"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition print:hidden"
            title="Cerrar recibo"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl mb-2 shadow-inner">
            <CheckCircle className="text-white w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black tracking-wider uppercase text-white print:text-black">
            TEI RIDE
          </h2>
          <p className="text-emerald-100 text-xs font-semibold print:text-gray-600">
            Comprobante Oficial de Servicio de Transporte
          </p>
          <div className="inline-block mt-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-emerald-200 border border-white/10 print:border-gray-300 print:text-gray-800">
            Nº RECIBO: TEI-{trip.id || '0000'}
          </div>
        </div>

        {/* Cuerpo del Recibo */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Fecha y Estado */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-800 print:border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-400 print:text-gray-600">
              <Calendar size={14} />
              <span>{trip.completed_at || trip.created_at || 'Fecha del viaje'}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              trip.status === 'completed' || trip.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {trip.status === 'cancelled' || trip.status === 'CANCELLED' ? 'Cancelado' : 'Servicio Completado'}
            </span>
          </div>

          {/* Personas involucradas */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-800 print:border-gray-200">
            <div className="bg-gray-800/50 p-2.5 rounded-xl print:bg-gray-50">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Pasajero</span>
              <p className="font-bold text-gray-100 print:text-gray-900 truncate">
                {trip.passenger_name || trip.passenger || 'Cliente TEI'}
              </p>
            </div>
            <div className="bg-gray-800/50 p-2.5 rounded-xl print:bg-gray-50">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Conductor</span>
              <p className="font-bold text-gray-100 print:text-gray-900 truncate">
                {trip.driver_name || trip.name || 'Conductor Asignado'}
              </p>
              {trip.vehicle_plate && (
                <span className="inline-block mt-0.5 text-[10px] bg-amber-400 text-gray-950 px-1.5 py-0.2 rounded font-black">
                  {trip.vehicle_plate}
                </span>
              )}
            </div>
          </div>

          {/* Ruta */}
          <div className="space-y-2 pb-3 border-b border-gray-800 print:border-gray-200">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
              <div className="truncate">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Origen</span>
                <p className="text-gray-200 print:text-gray-800 truncate">{trip.origin_address || trip.origin || 'Origen del viaje'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded bg-rose-500 mt-1 shrink-0"></div>
              <div className="truncate">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Destino</span>
                <p className="text-gray-200 print:text-gray-800 truncate">{trip.destination_address || trip.destination || 'Destino final'}</p>
              </div>
            </div>
            {trip.distance_km && (
              <p className="text-[11px] text-gray-400 pl-4 font-mono">
                Distancia estimada: {trip.distance_km} km
              </p>
            )}
          </div>

          {/* Desglose Financiero */}
          <div className="bg-gray-950/70 p-4 rounded-2xl border border-gray-800 print:bg-gray-50 print:border-gray-200 space-y-2">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Desglose Financiero ({isDriver ? 'Liquidación Conductor' : 'Total Pasajero'})
            </div>

            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-300 print:text-gray-700">Valor del Trayecto:</span>
              <span className="text-white print:text-gray-900 font-mono">
                ${parseFloat(finalPrice).toLocaleString('es-CO')} COP
              </span>
            </div>

            {isDriver && (
              <>
                <div className="flex justify-between items-center text-xs text-rose-400 font-medium">
                  <span>(-) Cuota de Plataforma / Comisión:</span>
                  <span className="font-mono">-${parseFloat(platformFee).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="pt-2 border-t border-gray-800 print:border-gray-300 flex justify-between items-center text-base font-black text-emerald-400 print:text-emerald-700">
                  <span>(=) Ganancia Neta Acreditada:</span>
                  <span className="font-mono">${parseFloat(netEarnings).toLocaleString('es-CO')} COP</span>
                </div>
              </>
            )}

            {!isDriver && (
              <div className="pt-2 border-t border-gray-800 print:border-gray-300 flex justify-between items-center text-base font-black text-emerald-400 print:text-emerald-700">
                <span>Total Abonado:</span>
                <span className="font-mono">${parseFloat(finalPrice).toLocaleString('es-CO')} COP</span>
              </div>
            )}
          </div>

          {/* Sello de Seguridad */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 print:text-gray-600 pt-1">
            <ShieldCheck size={14} className="text-emerald-400 print:text-gray-600" />
            <span>Transacción auditada electrónicamente bajo red TEI RIDE</span>
          </div>

          {/* Botones de acción (no se imprimen) */}
          <div className="flex gap-2 pt-2 print:hidden">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition border border-gray-700 shadow-md active:scale-95"
            >
              <ArrowLeft size={16} />
              {backLabel || 'Volver a Calificar'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition border border-gray-700"
              title="Imprimir comprobante"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-xs transition shadow-lg flex justify-center items-center gap-1.5 active:scale-95"
            >
              <CheckCircle size={16} />
              Cerrar Recibo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
