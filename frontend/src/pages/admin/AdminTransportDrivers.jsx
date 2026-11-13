import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { 
  ShieldCheck, Car, Truck, Bike, User, Phone, Mail, MapPin, 
  FileText, Camera, Eye, ExternalLink, X, Search, RefreshCw, CheckCircle2 
} from 'lucide-react';

export default function AdminTransportDrivers() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null); // driver object for dossier modal
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title }

  useEffect(() => {
    fetchApprovedVehicles();
  }, []);

  const fetchApprovedVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/api/transport/admin/drivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching approved vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'moto': return <Bike className="text-amber-400" size={24} />;
      case 'camion':
      case 'carga': return <Truck className="text-blue-400" size={24} />;
      default: return <Car className="text-emerald-400" size={24} />;
    }
  };

  // Group and filter
  const filteredVehicles = vehicles.filter(v => {
    const matchesType = filterType === 'all' || (v.type || '').toLowerCase() === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (v.driver_name || '').toLowerCase().includes(q) ||
      (v.plate || '').toLowerCase().includes(q) ||
      (v.driver_document || '').toLowerCase().includes(q) ||
      (v.driver_phone || '').includes(q);
    return matchesType && matchesSearch;
  });
  
  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'moto', label: 'Motos / Mototaxis' },
    { id: 'carro', label: 'Carros / Taxis' },
    { id: 'camion', label: 'Carga / Camiones' }
  ];

  if (loading) {
    return <div className="p-8 text-white">Cargando base de datos de conductores...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen text-white font-sans">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Conductores Habilitados — Flota Activa
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Consulta los expedientes, documentos KYC y antecedentes de cada conductor activo en el servicio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/transport-kyc')}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <ShieldCheck size={16} />
              Ir a Validación KYC
            </button>
            <button
              onClick={fetchApprovedVehicles}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl border border-slate-700 transition-colors"
              title="Recargar lista"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Buscador y Categorías */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, placa, cédula o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Filtros por Categoría */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterType === cat.id 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen Estadístico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {categories.map(cat => {
            const count = cat.id === 'all' 
              ? vehicles.length 
              : vehicles.filter(v => (v.type || '').toLowerCase() === cat.id).length;
              
            return (
              <div key={`stat-${cat.id}`} className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800 text-center">
                <p className="text-slate-400 text-xs mb-1 font-medium">{cat.label}</p>
                <p className="text-xl font-extrabold text-emerald-400">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de Conductores Habilitados */}
      <div className="max-w-7xl mx-auto">
        {filteredVehicles.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Car className="text-slate-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-200">No hay conductores en esta categoría</h2>
            <p className="text-slate-500 mt-2 text-sm">
              Cuando un conductor sea aprobado en el módulo de KYC, aparecerá aquí con su expediente disponible.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  {/* Encabezado Vehículo */}
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        {getVehicleIcon(vehicle.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base uppercase leading-tight">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">{vehicle.type} {vehicle.year ? `• ${vehicle.year}` : ''}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <p className="text-sm font-mono font-extrabold text-emerald-400 tracking-wider">{vehicle.plate}</p>
                    </div>
                  </div>

                  {/* Datos del Conductor */}
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <User size={15} className="text-blue-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{vehicle.driver_name}</span>
                    </div>

                    {vehicle.driver_document && (
                      <div className="flex items-center gap-2.5 px-2">
                        <FileText size={14} className="text-amber-400 shrink-0" />
                        <span className="text-slate-400">
                          {vehicle.driver_document_type || 'CC'}: <strong className="text-slate-200 font-mono">{vehicle.driver_document}</strong>
                        </span>
                      </div>
                    )}

                    {vehicle.driver_phone && (
                      <div className="flex items-center gap-2.5 px-2">
                        <Phone size={14} className="text-emerald-400 shrink-0" />
                        <a 
                          href={`https://wa.me/57${vehicle.driver_phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          {vehicle.driver_phone}
                        </a>
                      </div>
                    )}

                    {vehicle.driver_city && (
                      <div className="flex items-center gap-2.5 px-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="text-slate-400">{vehicle.driver_city}</span>
                      </div>
                    )}

                    {/* Estado de Documentos */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Color</span>
                        <span className="font-medium text-slate-200">{vehicle.color || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ID Conductor</span>
                        <span className="font-mono font-medium text-slate-200">#{vehicle.driver_id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón para Abrir Expediente Completo */}
                <div className="mt-5 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedDriver(vehicle)}
                    className="w-full bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-md"
                  >
                    <Eye size={15} className="text-emerald-400" />
                    <span>Ver Expediente y Documentos KYC</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE EXPEDIENTE COMPLETO DEL CONDUCTOR */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Expediente Completo — {selectedDriver.driver_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Placa: <strong className="text-emerald-400 font-mono">{selectedDriver.plate}</strong> • Conductor ID #{selectedDriver.driver_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDriver(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Expediente */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Información Personal y Vehículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Conductor</h4>
                  <p className="text-sm font-bold text-white">{selectedDriver.driver_name}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Documento: <strong>{selectedDriver.driver_document_type || 'CC'} {selectedDriver.driver_document || 'N/A'}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Teléfono: <strong>{selectedDriver.driver_phone || 'N/A'}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Correo: <strong>{selectedDriver.driver_email || 'N/A'}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Ciudad: <strong>{selectedDriver.driver_city || 'N/A'}</strong>
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Vehículo</h4>
                  <p className="text-sm font-bold text-white">{selectedDriver.brand} {selectedDriver.model} ({selectedDriver.year || 'N/A'})</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Tipo: <strong className="uppercase">{selectedDriver.type}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Color: <strong>{selectedDriver.color || 'N/A'}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Placa: <strong className="text-emerald-400 font-mono">{selectedDriver.plate}</strong>
                  </p>
                  {selectedDriver.verified_at && (
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Auditado: {new Date(selectedDriver.verified_at).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </div>

              {/* Documentos del Conductor */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>1. Documentos Subidos por el Conductor</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Selfie */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Selfie de Rostro</p>
                      <p className="text-[11px] text-slate-400">{selectedDriver.selfie_url ? 'Disponible' : 'No cargada'}</p>
                    </div>
                    {selectedDriver.selfie_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.selfie_url, title: `Selfie: ${selectedDriver.driver_name}` })}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>

                  {/* Licencia */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Licencia Conducción</p>
                      <p className="text-[11px] text-slate-400">{selectedDriver.license_url ? 'Disponible' : 'No cargada'}</p>
                    </div>
                    {selectedDriver.license_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.license_url, title: `Licencia: ${selectedDriver.driver_name}` })}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>

                  {/* Tarjeta Propiedad */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Tarjeta Propiedad / SOAT</p>
                      <p className="text-[11px] text-slate-400">{selectedDriver.property_card_url ? 'Disponible' : 'No cargada'}</p>
                    </div>
                    {selectedDriver.property_card_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.property_card_url, title: `Tarjeta Propiedad / SOAT: ${selectedDriver.plate}` })}
                        className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>
                </div>
              </div>

              {/* Capturas de Auditoría Oficiales */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>2. Capturas de Auditoría Oficial (Policía, Procuraduría y RUNT)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Captura Policía */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">👮 Policía Nacional</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedDriver.police_record_capture_url ? 'Captura guardada' : 'Sin captura'}
                      </p>
                    </div>
                    {selectedDriver.police_record_capture_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.police_record_capture_url, title: `Antecedentes Policía: ${selectedDriver.driver_name}` })}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>

                  {/* Captura Procuraduría */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">⚖️ Procuraduría General</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedDriver.procuraduria_capture_url ? 'Captura guardada' : 'Sin captura'}
                      </p>
                    </div>
                    {selectedDriver.procuraduria_capture_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.procuraduria_capture_url, title: `Antecedentes Procuraduría: ${selectedDriver.driver_name}` })}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>

                  {/* Captura RUNT */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">🚗 Consulta RUNT</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedDriver.runt_capture_url ? 'Captura guardada' : 'Sin captura'}
                      </p>
                    </div>
                    {selectedDriver.runt_capture_url ? (
                      <button
                        onClick={() => setPreviewDoc({ url: selectedDriver.runt_capture_url, title: `Consulta RUNT: Placa ${selectedDriver.plate}` })}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </div>
                </div>
              </div>

              {/* Observaciones del Validador */}
              {selectedDriver.verifier_notes && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Observaciones y Notas de la Auditoría
                  </h4>
                  <p className="text-xs text-slate-300 italic">
                    "{selectedDriver.verifier_notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedDriver(null);
                  navigate('/admin/transport-kyc');
                }}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                Abrir módulo de Validación KYC para editar o re-auditar
              </button>

              <button
                onClick={() => setSelectedDriver(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE ARCHIVO / IMAGEN */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                {previewDoc.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={14} /> Abrir Original
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950/50">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-[70vh] rounded-lg border border-slate-800"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
