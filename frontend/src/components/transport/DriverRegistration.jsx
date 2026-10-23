import React, { useState, useRef } from 'react';
import { Camera, Car, Bike, Truck, ShieldCheck, ArrowRight, Upload, User, X, ScrollText, AlertTriangle, CheckCircle2, Loader2, FileText, Eye } from 'lucide-react';
import { api } from '../../api/api';

// ─────────────────────────────────────────────────────────────────────────────
// TERMS AND CONDITIONS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <ScrollText className="text-emerald-400" size={22} />
            <h2 className="text-base font-bold text-white leading-tight">
              Contrato Marco — Conductor Arrendador
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
            <X size={22} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-5 space-y-5 text-sm text-gray-300 leading-relaxed">

          <p className="text-gray-400 italic text-xs">
            Términos y Condiciones que rigen el acceso y uso de la plataforma operada por <strong className="text-white">TU EMPRESA INTERNACIONAL S.A.S.</strong> Al registrarse, acceder o utilizar el aplicativo, el CONDUCTOR ARRENDADOR acepta de forma vinculante las siguientes cláusulas, conforme a la Ley 527 de 1999 y la legislación comercial y civil de la República de Colombia.
          </p>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA PRIMERA – NATURALEZA JURÍDICA EXCLUSIVA DE INTERMEDIACIÓN TECNOLÓGICA</h4>
            <p>LA EMPRESA es una entidad privada cuyo objeto exclusivo es el desarrollo, licenciamiento y operación de software, aplicaciones telemáticas y servicios de intermediación y corretaje comercial (Código de Comercio, Arts. 1340 y ss.).</p>
            <p className="mt-2"><strong className="text-emerald-400">Parágrafo Primero:</strong> LA EMPRESA <strong className="text-white">NO ES UNA EMPRESA DE TRANSPORTE PÚBLICO</strong>, no presta servicios directos de transporte terrestre de pasajeros, no cuenta con habilitación de empresa de transporte, y no posee flota vehicular propia ni arrendada.</p>
            <p className="mt-2"><strong className="text-emerald-400">Parágrafo Segundo:</strong> La labor de LA PLATAFORMA se limita estrictamente a poner a disposición un canal digital para que dos voluntades independientes coincidan libremente.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA SEGUNDA – CONTRATO BILATERAL DE ARRENDAMIENTO DE VEHÍCULO CON CONDUCTOR</h4>
            <p>Cada vez que a través de LA PLATAFORMA un USUARIO ARRENDATARIO solicita un desplazamiento y un CONDUCTOR ARRENDADOR acepta la propuesta, se perfecciona un Contrato Civil Atípico y Bilateral de Arrendamiento de Vehículo con Conductor (Arts. 1973, 1974 del Código Civil Colombiano).</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-400">
              <li><strong className="text-gray-200">Arrendador:</strong> El CONDUCTOR ARRENDADOR concede temporalmente el uso y conducción del automotor.</li>
              <li><strong className="text-gray-200">Arrendatario:</strong> El USUARIO ARRENDATARIO contrata temporalmente el vehículo y el servicio de conducción.</li>
              <li><strong className="text-gray-200">Tercero Facilitador:</strong> LA EMPRESA actúa exclusivamente como mandatario digital y corredor informático.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA TERCERA – LIBERTAD TARIFARIA Y CANON DE ARRENDAMIENTO</h4>
            <p>El valor económico total pactado para el trayecto no constituye una tarifa regulada de transporte público, sino el <strong className="text-white">canon de arrendamiento temporal libremente acordado</strong> entre las partes. El pago se realiza directamente entre las partes sin que LA EMPRESA custodie dicho valor.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA CUARTA – COMISIÓN DE INTERMEDIACIÓN (15%) Y BILLETERA PREPAGO</h4>
            <p>El CONDUCTOR ARRENDADOR se obliga a pagar a LA EMPRESA una tarifa de intermediación tecnológica equivalente al <strong className="text-emerald-400">quince por ciento (15%)</strong> sobre el valor total del canon por cada servicio completado. Dicho cobro se debita automáticamente de la billetera prepago del conductor. En caso de saldo insuficiente, la cuenta se pausará automáticamente.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA QUINTA – RESPONSABILIDAD OPERATIVA, TRÁNSITO Y RIESGOS</h4>
            <p>El CONDUCTOR asume de manera <strong className="text-white">personal, directa y exclusiva</strong> cualquier sanción, comparendo o inmovilización impuesta por autoridades de tránsito durante la operación. Es el único responsable de mantener vigentes:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-400">
              <li>Licencia de conducción vigente.</li>
              <li>Seguro Obligatorio de Accidentes de Tránsito (SOAT) vigente.</li>
              <li>Certificado de Revisión Técnico-Mecánica al día.</li>
              <li>Estado mecánico óptimo del vehículo.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA SEXTA – AUSENCIA DE RELACIÓN LABORAL</h4>
            <p>El uso de LA PLATAFORMA <strong className="text-white">no crea ningún tipo de contrato de trabajo</strong> ni relación de subordinación laboral. El CONDUCTOR goza de absoluta libertad para conectarse, determinar sus horarios, elegir solicitudes y prestar servicios en otras plataformas simultáneamente.</p>
          </div>

          {/* ── CLÁUSULA ADICIONAL NUEVA ── */}
          <div className="border border-amber-500/40 rounded-2xl p-4 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-amber-400 shrink-0" size={18} />
              <h4 className="font-bold text-amber-300">CLÁUSULA ADICIONAL – AUTONOMÍA EN LA NATURALEZA DEL VEHÍCULO Y RESPONSABILIDAD SECTORIAL EXCLUSIVA</h4>
            </div>

            <p className="mb-3"><strong className="text-white">Neutralidad del Software:</strong> LA PLATAFORMA opera como una herramienta digital neutral y <strong className="text-white">no categoriza, clasifica, audita de oficio ni garantiza la modalidad</strong> (pública o particular) bajo la cual el CONDUCTOR/OPERADOR decide vincularse o prestar su servicio.</p>

            <p className="mb-3"><strong className="text-white">Declaración Jurada:</strong> Todo conductor que registre un automotor en el aplicativo declara bajo juramento que conoce la legislación aplicable a su vehículo en la República de Colombia y asume plena responsabilidad por la modalidad en la que opera.</p>

            <p className="mb-2"><strong className="text-amber-300">Obligaciones del Conductor de Servicio Público (Taxis / Placas Blancas):</strong> Si el conductor opera un vehículo homologado como de servicio público individual de pasajeros, reconoce y acepta expresamente que:</p>
            <ul className="space-y-1 list-disc list-inside text-gray-400 mb-3">
              <li>Actúa a título individual bajo su propia cuenta y riesgo o conforme a las autorizaciones de su empresa de transporte habilitada.</li>
              <li>Es el único y exclusivo responsable de dar cumplimiento al <strong className="text-gray-200">régimen tarifario oficial, al uso del taxímetro reglamentario</strong> y a los decretos municipales vigentes en su jurisdicción.</li>
              <li>Cualquier canon acordado a través de la aplicación se entenderá, para efectos legales del conductor, como el valor regulado o una compensación libremente convenida bajo su exclusiva responsabilidad, <strong className="text-gray-200">manteniendo a LA EMPRESA ajena a cualquier investigación por presunta alteración de tarifas</strong> (infracción C18 o similares).</li>
              <li>Cuenta con <strong className="text-gray-200">tarjeta de operación, tarjeta de control y pólizas de Responsabilidad Civil Contractual (RCC) y Extracontractual (RCE)</strong> vigentes ante su empresa habilitadora.</li>
            </ul>

            <p className="mb-3"><strong className="text-white">Indemnidad Total por Sanciones Administrativas:</strong> El conductor mantendrá totalmente indemne a LA EMPRESA, sus accionistas, representantes legales y directivos frente a cualquier investigación administrativa, sanción o multa impuesta por la <strong className="text-gray-200">Superintendencia de Transporte, secretarías de movilidad locales o inspectores de policía</strong>, derivada del incumplimiento de normas del servicio público de transporte o regulaciones gremiales.</p>

            <p><strong className="text-white">Comisión del 15% — Aplicación Universal:</strong> El pago del quince por ciento (15%) a favor de LA EMPRESA se causará de manera <strong className="text-white">indistinta e invariable</strong>, sin importar si el vehículo es particular o de servicio público, remunerando estrictamente el acceso a la tecnología telemática y la intermediación mercantil digital.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA SÉPTIMA – TRATAMIENTO DE DATOS PERSONALES Y GEOLOCALIZACIÓN</h4>
            <p>En cumplimiento de la Ley Estatutaria 1581 de 2012, las partes autorizan a LA EMPRESA para capturar, almacenar, procesar y geolocalizar sus dispositivos en tiempo real durante la ejecución del servicio, con fines de: cálculo de rutas, auditoría de canon, monitoreo de seguridad, despacho algorítmico y facturación electrónica de comisiones.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">CLÁUSULA OCTAVA – LEY APLICABLE Y JURISDICCIÓN</h4>
            <p>Los presentes Términos se rigen conforme a las leyes mercantiles y civiles de la República de Colombia. Cualquier controversia será sometida preferentemente a mecanismos de conciliación en Bogotá D.C., antes de acudir a la jurisdicción ordinaria.</p>
          </div>

          <p className="text-xs text-gray-500 italic">
            El registro digital del conductor (IP, fecha, hora y versión del documento) almacenado en los servidores de TEI servirá como prueba plena de la aceptación voluntaria de este Contrato Marco. Versión: <span className="text-emerald-400 font-mono">v1.0-2026</span>
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 shrink-0 flex justify-end">
          <button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all">
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DriverRegistration() {
  const [formData, setFormData] = useState({
    type: 'carro',
    brand: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    cargo_capacity_kg: '',
    selfie_url: '',
    license_url: '',
    property_card_url: ''
  });
  const [uploadingDoc, setUploadingDoc] = useState({
    selfie: false,
    license: false,
    property_card: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs para inputs de archivo
  const selfieInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const propertyCardInputRef = useRef(null);

  // ── Checkboxes obligatorios (2 independientes)
  const [docsDeclared, setDocsDeclared] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const bothChecked = docsDeclared && termsAccepted;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleanVal = value;

    if (name === 'brand') {
      // Limitar brand a un máximo de 14 caracteres, permitiendo únicamente letras, números y espacios estándar (rechaza < > = + @ [ ] { })
      cleanVal = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.\-]/g, '').slice(0, 14);
    } else if (name === 'model') {
      // En Cuadro de Modelo solo debe ir el año que son 4 numeros no permitir mas de 4 caracteres
      cleanVal = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, model: cleanVal, year: cleanVal }));
      return;
    } else if (name === 'color') {
      // En el cuadro de Color permitir maximo 12 caracteres
      cleanVal = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 12);
    } else if (name === 'license_plate') {
      cleanVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    }

    setFormData(prev => ({ ...prev, [name]: cleanVal }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo seleccionado supera el límite de 10 MB.');
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [field]: true }));
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/api/media/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data.url;
      const keyName = field === 'selfie' ? 'selfie_url' : field === 'license' ? 'license_url' : 'property_card_url';
      setFormData(prev => ({ ...prev, [keyName]: url }));
    } catch (err) {
      console.error('Error subiendo documento:', err);
      setErrorMsg(err.response?.data?.detail || 'Error al subir el archivo. Intenta con formato JPG, PNG o PDF.');
    } finally {
      setUploadingDoc(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.selfie_url || !formData.license_url || !formData.property_card_url) {
      setErrorMsg('Por favor sube los 3 documentos obligatorios: Selfie, Licencia y Tarjeta de Propiedad (SOAT).');
      return;
    }
    if (formData.brand.trim().length > 14) {
      setErrorMsg('La Marca no puede superar 14 caracteres.');
      return;
    }
    if (formData.model.length !== 4) {
      setErrorMsg('En el campo Modelo solo debe ir el año del vehículo (4 números, ej. 2024).');
      return;
    }
    if (formData.color.trim().length > 12) {
      setErrorMsg('El Color no puede superar 12 caracteres.');
      return;
    }
    if (formData.license_plate.length < 5 || formData.license_plate.length > 7) {
      setErrorMsg('La Placa debe tener entre 5 y 7 caracteres alfanuméricos.');
      return;
    }
    if (!bothChecked) {
      setErrorMsg('Debes marcar ambas declaraciones obligatorias para continuar.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('access_token');

      // ── PASO 1: Registrar aceptación legal en la base de datos (auditoría)
      await api.post(
        `/api/transport/vehicle/accept-terms?docs_declared_ok=true&terms_accepted=true`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ── PASO 2: Registrar el vehículo con los documentos
      const payload = {
        type: formData.type,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.model || formData.year),
        color: formData.color.trim(),
        license_plate: formData.license_plate.trim().toUpperCase(),
        cargo_capacity_kg: formData.cargo_capacity_kg ? parseInt(formData.cargo_capacity_kg) : null,
        selfie_url: formData.selfie_url,
        license_url: formData.license_url,
        property_card_url: formData.property_card_url
      };

      await api.post('/api/transport/vehicle', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error registrando vehículo:", error);
      setErrorMsg(error.response?.data?.detail || "Hubo un error al registrar el vehículo. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
          <ShieldCheck className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-center">¡Solicitud Enviada!</h2>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Hemos recibido los datos de tu vehículo y tu declaración legal. Nuestro equipo validará tu información en las próximas 24 horas. ¡Prepárate para empezar a ganar!
        </p>
        <button onClick={() => setIsSuccess(false)} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-8 py-3 rounded-xl font-bold transition-all">
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white font-sans overflow-y-auto pb-12 relative">

      {/* TERMS MODAL */}
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}

      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER */}
      <div className="pt-12 pb-6 px-6 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Conviértete en <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Conductor</span></h1>
        <p className="text-gray-400">Registra tu vehículo y empieza a recibir viajes al instante.</p>
      </div>

      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit} className="px-4 relative z-10">
        <div className="backdrop-blur-xl bg-gray-900/60 border border-gray-700/50 rounded-3xl p-6 shadow-2xl">

          {/* VEHICLE TYPE */}
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">1. Tipo de Vehículo</h3>
          <div className="flex justify-between gap-3 mb-8">
            {[
              { val: 'moto', label: 'Moto', Icon: Bike, color: 'emerald' },
              { val: 'carro', label: 'Carro', Icon: Car, color: 'cyan' },
              { val: 'camion', label: 'Carga', Icon: Truck, color: 'amber' },
            ].map(({ val, label, Icon, color }) => (
              <button
                key={val}
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: val } })}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  formData.type === val
                    ? `bg-${color}-500/20 border-${color}-500 text-${color}-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]`
                    : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <Icon size={28} className="mb-2" />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>

          {/* VEHICLE DETAILS */}
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">2. Datos del Vehículo</h3>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Marca</label>
                <input required type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Ej. Chevrolet" maxLength={14}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="text-[10px] text-gray-500 mt-1 block">Máx. 14 caracteres</span>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Modelo (Año)</label>
                <input required type="text" inputMode="numeric" name="model" value={formData.model} onChange={handleChange} placeholder="Ej. 2024" maxLength={4}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="text-[10px] text-gray-500 mt-1 block">Solo 4 números (Año)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Color</label>
                <input required type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Ej. Azul" maxLength={12}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="text-[10px] text-gray-500 mt-1 block">Máx. 12 caracteres</span>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Placa</label>
                <input required type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} placeholder="Ej. XYZ123" maxLength={7}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white uppercase placeholder-gray-500 font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="text-[10px] text-gray-500 mt-1 block">5 a 7 caracteres alfanuméricos</span>
              </div>
            </div>
            {formData.type === 'camion' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Capacidad de Carga (KG)</label>
                <input type="number" name="cargo_capacity_kg" value={formData.cargo_capacity_kg} onChange={handleChange} placeholder="Ej. 1500"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              </div>
            )}
          </div>

          {/* DOCUMENTS */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">3. Documentos y Seguridad *</h3>
            <span className="text-xs text-emerald-400">JPG, PNG o PDF (Máx. 10MB)</span>
          </div>
          
          <div className="space-y-3 mb-8">
            {/* Inputs ocultos */}
            <input 
              ref={selfieInputRef}
              type="file" 
              accept="image/*" 
              capture="user"
              className="hidden" 
              onChange={(e) => handleFileUpload('selfie', e.target.files[0])}
            />
            <input 
              ref={licenseInputRef}
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={(e) => handleFileUpload('license', e.target.files[0])}
            />
            <input 
              ref={propertyCardInputRef}
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={(e) => handleFileUpload('property_card', e.target.files[0])}
            />

            {/* DOCUMENTO 1: SELFIE */}
            <div 
              onClick={() => !uploadingDoc.selfie && selfieInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                formData.selfie_url 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  formData.selfie_url ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {uploadingDoc.selfie ? (
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  ) : formData.selfie_url ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tomar Selfie (Rostro Descubierto)</h4>
                  <p className="text-xs text-gray-400">
                    {uploadingDoc.selfie ? 'Subiendo selfie...' : formData.selfie_url ? '✅ Fotografía cargada correctamente' : 'Haz clic para abrir la cámara o seleccionar foto'}
                  </p>
                </div>
              </div>
              <div>
                {formData.selfie_url ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    Cambiar
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                    Subir foto
                  </span>
                )}
              </div>
            </div>

            {/* DOCUMENTO 2: LICENCIA */}
            <div 
              onClick={() => !uploadingDoc.license && licenseInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                formData.license_url 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  formData.license_url ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {uploadingDoc.license ? (
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  ) : formData.license_url ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Camera size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Foto Frontal de la Licencia</h4>
                  <p className="text-xs text-gray-400">
                    {uploadingDoc.license ? 'Subiendo licencia...' : formData.license_url ? '✅ Licencia cargada correctamente' : 'Haz clic para subir foto o PDF legible de la licencia'}
                  </p>
                </div>
              </div>
              <div>
                {formData.license_url ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    Cambiar
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                    Subir archivo
                  </span>
                )}
              </div>
            </div>

            {/* DOCUMENTO 3: TARJETA DE PROPIEDAD / SOAT */}
            <div 
              onClick={() => !uploadingDoc.property_card && propertyCardInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                formData.property_card_url 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  formData.property_card_url ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {uploadingDoc.property_card ? (
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  ) : formData.property_card_url ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tarjeta de Propiedad (SOAT)</h4>
                  <p className="text-xs text-gray-400">
                    {uploadingDoc.property_card ? 'Subiendo documento...' : formData.property_card_url ? '✅ Tarjeta / SOAT cargado correctamente' : 'Haz clic para subir foto o PDF del SOAT o matrícula'}
                  </p>
                </div>
              </div>
              <div>
                {formData.property_card_url ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    Cambiar
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                    Subir archivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── TÉRMINOS Y DECLARACIONES JURADAS ── */}
          <div className="mb-6 space-y-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              4. Declaraciones Obligatorias y Términos
            </h3>

            {/* Leer T&C */}
            <div className="flex items-start justify-between bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-3 mb-3">
              <span className="text-xs text-gray-400 mr-3">Antes de marcar las casillas, lee el contrato completo:</span>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold text-xs whitespace-nowrap transition-colors shrink-0"
              >
                📄 Ver Contrato Marco
              </button>
            </div>

            {/* ── CHECKBOX 1 ── */}
            <div className={`flex items-start gap-3 rounded-xl p-4 border transition-colors ${docsDeclared ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-gray-800/50 border-gray-700'}`}>
              <input
                id="docs-checkbox"
                type="checkbox"
                checked={docsDeclared}
                onChange={(e) => { setDocsDeclared(e.target.checked); setErrorMsg(''); }}
                className="mt-0.5 w-5 h-5 shrink-0 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="docs-checkbox" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                <strong className="text-white">Declaro que mi documentación está al día:</strong> Cuento con licencia de conducción, SOAT y revisión técnico-mecánica vigentes. Si opero taxi o vehículo de servicio público, cuento además con tarjeta de operación, tarjeta de control y pólizas RCC y RCE vigentes ante mi empresa habilitadora. <span className="text-gray-400">Asumo total responsabilidad legal por la operación de mi vehículo bajo la legislación colombiana.</span>
              </label>
            </div>

            {/* ── CHECKBOX 2 ── */}
            <div className={`flex items-start gap-3 rounded-xl p-4 border transition-colors ${termsAccepted ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-gray-800/50 border-gray-700'}`}>
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setErrorMsg(''); }}
                className="mt-0.5 w-5 h-5 shrink-0 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                <strong className="text-white">Acepto las condiciones comerciales:</strong> Autorizo el descuento automático del <strong className="text-emerald-400">15% de comisión de software</strong> sobre cada servicio completado y acepto los{' '}
                <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:text-emerald-300 underline font-semibold transition-colors">
                  Términos y Condiciones de Uso
                </button>{' '}
                y la Política de Tratamiento de Datos Personales de TEI.
              </label>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-6 text-sm">
              {errorMsg}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || !bothChecked}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>ACTIVAR MI CUENTA Y EMPEZAR A CONDUCIR</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {!bothChecked && (
            <p className="text-center text-xs text-gray-500 mt-3">
              ⚠️ Debes marcar <strong>ambas declaraciones</strong> para habilitar el botón de activación.
            </p>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            Al activar, TEI registrará tu IP, dispositivo y timestamp como prueba fehaciente de aceptación legal (v1.0-2026).
          </p>

        </div>
      </form>
    </div>
  );
}
