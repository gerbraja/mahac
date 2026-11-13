import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { 
  ShieldCheck, XCircle, CheckCircle, Car, User, FileText, 
  ExternalLink, Copy, Check, Upload, Camera, Eye, AlertCircle, 
  Loader2, Save, Bike, Truck, Phone, Mail, MapPin, Calendar, X,
  Search, RefreshCw
} from 'lucide-react';

export default function AdminTransportKYC() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [copiedText, setCopiedText] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title }
  const [updatingId, setUpdatingId] = useState(null);
  const [auditData, setAuditData] = useState({}); // { [vehicleId]: { police_record_capture_url, procuraduria_capture_url, runt_capture_url, verifier_notes } }
  const [uploadingCapture, setUploadingCapture] = useState({}); // { `${vehicleId}_${field}`: boolean }

  useEffect(() => {
    fetchVehicles(statusFilter);
  }, [statusFilter]);

  const fetchVehicles = async (status = 'pending') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get(`/api/transport/admin/vehicles?status_filter=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setVehicles(data);

      // Initialize local audit state for each vehicle
      const initialAudit = {};
      data.forEach(v => {
        initialAudit[v.id] = {
          police_record_capture_url: v.police_record_capture_url || '',
          procuraduria_capture_url: v.procuraduria_capture_url || '',
          runt_capture_url: v.runt_capture_url || '',
          verifier_notes: v.verifier_notes || ''
        };
      });
      setAuditData(initialAudit);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}: ${text}`);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const handleCaptureUpload = async (vehicleId, field, file) => {
    if (!file) return;
    const uploadKey = `${vehicleId}_${field}`;
    setUploadingCapture(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/api/media/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data.url;
      setAuditData(prev => ({
        ...prev,
        [vehicleId]: {
          ...(prev[vehicleId] || {}),
          [field]: url
        }
      }));
    } catch (err) {
      console.error('Error subiendo captura de auditoría:', err);
      alert('Error al subir la captura. Verifica que sea una imagen (JPG, PNG) o PDF.');
    } finally {
      setUploadingCapture(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleAuditChange = (vehicleId, field, value) => {
    setAuditData(prev => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveAudit = async (vehicleId, action = null) => {
    setUpdatingId(vehicleId);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...(auditData[vehicleId] || {}),
        action
      };

      await api.post(`/api/transport/admin/vehicle/${vehicleId}/verify-audit`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (action) {
        // Remove from list or refresh
        fetchVehicles(statusFilter);
        alert(`Conductor y vehículo ${action === 'approve' ? 'APROBADO Y ACTIVADO' : 'RECHAZADO'} con éxito.`);
      } else {
        alert("Capturas y notas de auditoría guardadas correctamente.");
        fetchVehicles(statusFilter);
      }
    } catch (error) {
      console.error("Error guardando auditoría:", error);
      alert(error.response?.data?.detail || "Hubo un error al procesar la solicitud.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'moto': return <Bike size={20} className="text-amber-400" />;
      case 'camion':
      case 'carga': return <Truck size={20} className="text-blue-400" />;
      default: return <Car size={20} className="text-emerald-400" />;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Validación KYC y Seguridad — Conductores
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Revisa documentos del conductor y audita antecedentes en Policía, Procuraduría y RUNT antes de habilitar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchVehicles(statusFilter)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Notificación de texto copiado al portapapeles */}
        {copiedText && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 animate-fadeIn">
            <Check size={16} className="text-emerald-400" />
            <span>Copiado al portapapeles: <strong>{copiedText}</strong></span>
          </div>
        )}

        {/* Filtros de Estado */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
          {[
            { id: 'pending', label: '⏳ Pendientes de Revisión' },
            { id: 'approved', label: '✅ Aprobados / Activos' },
            { id: 'rejected', label: '❌ Rechazados' },
            { id: 'all', label: '📋 Todos los Registros' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Cargando solicitudes de conductores...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Car className="text-slate-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-200">No hay conductores en esta categoría</h2>
            <p className="text-slate-500 mt-2 text-sm">
              {statusFilter === 'pending' 
                ? '¡Todo al día! No hay postulaciones pendientes de validación.' 
                : 'No se encontraron registros con este filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {vehicles.map((v) => {
              const currentAudit = auditData[v.id] || {};
              const isUpdating = updatingId === v.id;

              return (
                <div 
                  key={v.id} 
                  className={`bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all ${
                    v.status === 'approved' 
                      ? 'border-emerald-500/30' 
                      : v.status === 'rejected' 
                      ? 'border-rose-500/30' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* CABECERA: CONDUCTOR Y VEHÍCULO */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
                    {/* Datos Conductor */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          Conductor Postulante
                        </span>
                        <span className="text-xs text-slate-500 font-mono">ID #{v.driver_id}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User size={20} className="text-slate-400" />
                        {v.driver_name}
                      </h3>
                      
                      {/* Documento con botón de copia */}
                      <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <FileText size={16} className="text-amber-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Documento / Cédula</p>
                          <p className="text-sm font-mono font-bold text-slate-200">
                            {v.driver_document_type}: {v.driver_document || 'No registrado'}
                          </p>
                        </div>
                        {v.driver_document && (
                          <button
                            onClick={() => handleCopy(v.driver_document, 'Cédula')}
                            title="Copiar número de documento"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            <Copy size={14} />
                            <span className="text-xs font-semibold">Copiar</span>
                          </button>
                        )}
                      </div>

                      {/* Contacto */}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                        {v.driver_phone && (
                          <a 
                            href={`https://wa.me/57${v.driver_phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-emerald-400 hover:underline"
                          >
                            <Phone size={13} />
                            {v.driver_phone}
                          </a>
                        )}
                        {v.driver_email && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Mail size={13} />
                            {v.driver_email}
                          </span>
                        )}
                        {v.driver_city && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <MapPin size={13} />
                            {v.driver_city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Datos Vehículo */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 flex items-center gap-1">
                          {getVehicleIcon(v.type)}
                          {v.type.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          v.status === 'approved' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : v.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {v.status === 'approved' ? '✓ Aprobado' : v.status === 'rejected' ? '✕ Rechazado' : '⏳ Pendiente'}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white">
                        {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                      </h4>

                      {/* Placa con botón de copia */}
                      <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Placa del Vehículo</p>
                          <p className="text-lg font-mono font-extrabold text-emerald-400 tracking-wider">
                            {v.plate}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(v.plate, 'Placa')}
                          title="Copiar placa del vehículo"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          <Copy size={14} />
                          <span className="text-xs font-semibold">Copiar</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-400">
                        Color: <strong className="text-slate-200">{v.color || 'No especificado'}</strong>
                        {v.cargo_capacity_kg ? ` | Carga: ${v.cargo_capacity_kg} KG` : ''}
                      </p>
                    </div>

                    {/* Auditoría Legal y Fechas */}
                    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auditoría Legal</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          {v.terms_accepted ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Contrato Marco Aceptado</span>
                          ) : (
                            <span className="text-amber-400">⚠ Términos pendientes</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {v.docs_declared_ok ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Declaración SOAT/Licencia bajo juramento</span>
                          ) : (
                            <span className="text-slate-500">Sin declaración explícita</span>
                          )}
                        </div>
                        {v.legal_accepted_at && (
                          <p className="text-[11px] text-slate-500">
                            Firma digital: {new Date(v.legal_accepted_at).toLocaleString('es-CO')}
                          </p>
                        )}
                        {v.created_at && (
                          <p className="text-[11px] text-slate-500">
                            Registrado: {new Date(v.created_at).toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 1: DOCUMENTOS SUBIDOS POR EL CONDUCTOR */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>1. Documentos Cargados por el Conductor</span>
                        <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                          Frontal
                        </span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Documento 1: Selfie */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Selfie de Seguridad</p>
                            <p className="text-[11px] text-slate-400">
                              {v.selfie_url ? 'Rostro descubierto' : 'No adjuntada'}
                            </p>
                          </div>
                        </div>
                        <div>
                          {v.selfie_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: v.selfie_url, title: `Selfie: ${v.driver_name}` })}
                              className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Eye size={14} /> Ver
                            </button>
                          ) : (
                            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Faltante</span>
                          )}
                        </div>
                      </div>

                      {/* Documento 2: Licencia */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Camera size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Licencia de Conducción</p>
                            <p className="text-[11px] text-slate-400">
                              {v.license_url ? 'Foto frontal' : 'No adjuntada'}
                            </p>
                          </div>
                        </div>
                        <div>
                          {v.license_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: v.license_url, title: `Licencia de Conducción: ${v.driver_name}` })}
                              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Eye size={14} /> Ver
                            </button>
                          ) : (
                            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Faltante</span>
                          )}
                        </div>
                      </div>

                      {/* Documento 3: Tarjeta Propiedad / SOAT */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Tarjeta Propiedad / SOAT</p>
                            <p className="text-[11px] text-slate-400">
                              {v.property_card_url ? 'Matrícula o SOAT' : 'No adjuntada'}
                            </p>
                          </div>
                        </div>
                        <div>
                          {v.property_card_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: v.property_card_url, title: `Tarjeta de Propiedad / SOAT: ${v.plate}` })}
                              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Eye size={14} /> Ver
                            </button>
                          ) : (
                            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Faltante</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: PORTALES OFICIALES DE VERIFICACIÓN (COLOMBIA) */}
                  <div className="mt-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <span>2. Portales Oficiales de Validación (Consulta en Vivo)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Haz clic para abrir los portales gubernamentales, pega la cédula o placa y descarga o toma captura del certificado.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Atajos rápidos:</span>
                        {v.driver_document && (
                          <button
                            onClick={() => handleCopy(v.driver_document, 'Cédula')}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded font-mono text-[11px] border border-slate-700"
                          >
                            📋 {v.driver_document}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(v.plate, 'Placa')}
                          className="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded font-mono text-[11px] border border-slate-700"
                        >
                          📋 {v.plate}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Enlace Policía */}
                      <a
                        href="https://antecedentes.policia.gov.co/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-slate-200 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">👮</span>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Policía Nacional
                            </p>
                            <p className="text-[10px] text-slate-400">Antecedentes Judiciales</p>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-400" />
                      </a>

                      {/* Enlace Procuraduría */}
                      <a
                        href="https://www.procuraduria.gov.co/Pages/certificado-antecedentes.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-slate-200 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">⚖️</span>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Procuraduría General
                            </p>
                            <p className="text-[10px] text-slate-400">Certificado Disciplinario</p>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-400" />
                      </a>

                      {/* Enlace RUNT */}
                      <a
                        href="https://www.runt.com.co/consultaCiudadana/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-slate-200 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🚗</span>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                              RUNT Ciudadano
                            </p>
                            <p className="text-[10px] text-slate-400">Licencia, SOAT y RTM</p>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-400" />
                      </a>
                    </div>
                  </div>

                  {/* SECCIÓN 3: CAPTURAS DEL VALIDADOR (EVIDENCIAS DE AUDITORÍA) */}
                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span>3. Capturas de Evidencia Guardadas por el Validador</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        Auditoría Obligatoria
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Captura 1: Policía */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              👮 Captura Policía
                            </span>
                            {currentAudit.police_record_capture_url && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                                ✓ Guardada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mb-3">
                            Captura del certificado de antecedentes judiciales emitido por la Policía Nacional.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-medium text-center border border-slate-700 transition-colors flex items-center justify-center gap-1.5">
                            {uploadingCapture[`${v.id}_police_record_capture_url`] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            <span>{currentAudit.police_record_capture_url ? 'Reemplazar' : 'Subir Captura'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleCaptureUpload(v.id, 'police_record_capture_url', e.target.files[0])}
                            />
                          </label>

                          {currentAudit.police_record_capture_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: currentAudit.police_record_capture_url, title: `Antecedentes Policía: ${v.driver_name}` })}
                              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                              title="Ver captura"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Captura 2: Procuraduría */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              ⚖️ Captura Procuraduría
                            </span>
                            {currentAudit.procuraduria_capture_url && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                                ✓ Guardada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mb-3">
                            Captura del certificado de antecedentes disciplinarios ordinario o especial.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-medium text-center border border-slate-700 transition-colors flex items-center justify-center gap-1.5">
                            {uploadingCapture[`${v.id}_procuraduria_capture_url`] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            <span>{currentAudit.procuraduria_capture_url ? 'Reemplazar' : 'Subir Captura'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleCaptureUpload(v.id, 'procuraduria_capture_url', e.target.files[0])}
                            />
                          </label>

                          {currentAudit.procuraduria_capture_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: currentAudit.procuraduria_capture_url, title: `Antecedentes Procuraduría: ${v.driver_name}` })}
                              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                              title="Ver captura"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Captura 3: RUNT */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              🚗 Captura Consulta RUNT
                            </span>
                            {currentAudit.runt_capture_url && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                                ✓ Guardada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mb-3">
                            Captura del estado activo de la licencia del conductor y vigencia del SOAT/RTM.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-medium text-center border border-slate-700 transition-colors flex items-center justify-center gap-1.5">
                            {uploadingCapture[`${v.id}_runt_capture_url`] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            <span>{currentAudit.runt_capture_url ? 'Reemplazar' : 'Subir Captura'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleCaptureUpload(v.id, 'runt_capture_url', e.target.files[0])}
                            />
                          </label>

                          {currentAudit.runt_capture_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: currentAudit.runt_capture_url, title: `Consulta RUNT: Placa ${v.plate}` })}
                              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                              title="Ver captura"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 4: OBSERVACIONES Y ACCIONES DE VALIDACIÓN */}
                  <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">
                        Observaciones del Validador (Notas internas de verificación):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Antecedentes limpios. Licencia categoría B1 vigente hasta 2029. SOAT activo."
                        value={currentAudit.verifier_notes || ''}
                        onChange={(e) => handleAuditChange(v.id, 'verifier_notes', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                      {/* Botón Guardar Evidencias */}
                      <button
                        type="button"
                        onClick={() => handleSaveAudit(v.id, null)}
                        disabled={isUpdating}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Save size={15} />
                        Guardar Evidencias
                      </button>

                      {/* Botón Rechazar */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Rechazar al conductor ${v.driver_name} (${v.plate})?`)) {
                            handleSaveAudit(v.id, 'reject');
                          }
                        }}
                        disabled={isUpdating}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle size={15} />
                        Rechazar
                      </button>

                      {/* Botón Aprobar y Habilitar */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Aprobar y habilitar inmediatamente al conductor ${v.driver_name} (${v.plate}) para recibir viajes?`)) {
                            handleSaveAudit(v.id, 'approve');
                          }
                        }}
                        disabled={isUpdating}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                        Aprobar y Habilitar
                      </button>
                    </div>
                  </div>

                  {v.verified_at && (
                    <p className="text-[10px] text-slate-500 mt-3 text-right">
                      Última verificación guardada: {new Date(v.verified_at).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE VISTA PREVIA DE DOCUMENTO / CAPTURA */}
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
