
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';

// Icons/Flags could be assets. Using emoji for now.

const KYCValidation = () => {
    const [step, setStep] = useState(1); // 1: Country, 2: Form
    const [country, setCountry] = useState(null);
    const [user, setUser] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        is_facturador_electronico: null,
        is_declarante_renta: null,

        is_pep: null,
        pep_position: '',
        pep_dates: '',

        has_foreign_accounts: null,
        has_signature_power_foreign: null,

        is_pep_associate: null,
        pep_associate_details: '',

        has_conflict_interest: null,
        conflict_details: '',

        uses_crypto: null,

        accepted_data_policy: false,
        accepted_commercial_contract: false,
        accepted_sagrilaft: false
    });

    const [files, setFiles] = useState({
        rut: null,
        cedula: null,
        bank_certificate: null,
        profile_photo: null
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        api.get('/auth/me').then(res => setUser(res.data));
    }, []);

    const handleCountrySelect = (c) => {
        setCountry(c);
        setStep(2);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e, type) => {
        if (e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validations
        if (!files.rut || !files.cedula || !files.bank_certificate || !files.profile_photo) {
            alert("Por favor carga los 4 documentos requeridos.");
            return;
        }
        if (!formData.accepted_data_policy || !formData.accepted_commercial_contract || !formData.accepted_sagrilaft) {
            alert("Debes aceptar todas las políticas y términos legales.");
            return;
        }

        setLoading(true);
        const payload = new FormData();

        // Append JSON data
        const dataToSend = { ...formData, country: country.name };
        payload.append('compliance_data', JSON.stringify(dataToSend));

        // Append Files
        payload.append('rut', files.rut);
        payload.append('cedula', files.cedula);
        payload.append('bank_certificate', files.bank_certificate);
        payload.append('profile_photo', files.profile_photo);

        try {
            const res = await api.post('/api/kyc/validate', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000
            });
            setResult(res.data);
        } catch (error) {
            console.error("KYC Error:", error);
            setResult({
                status: 'failed',
                message: error.response?.data?.detail || "Error en la validación.",
                reason: "Verifica tu conexión o los archivos."
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Cargando perfil...</div>;

    // STEP 1: Country Selection
    if (step === 1) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">Selecciona tu País</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CountryCard name="Colombia" flag="🇨🇴" onClick={() => handleCountrySelect({ name: 'Colombia' })} />
                    <CountryCard name="Panamá" flag="🇵🇦" onClick={() => handleCountrySelect({ name: 'Panama' })} />
                    <CountryCard name="Rep. Dominicana" flag="🇩🇴" onClick={() => handleCountrySelect({ name: 'Republica Dominicana' })} />
                </div>
            </div>
        );
    }

    // STEP 2: Main Form
    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <button onClick={() => setStep(1)} className="text-blue-600 mb-4">← Volver a selección de país</button>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-2 text-center text-blue-900">Proceso de Compensaciones {country.name}</h1>
                <p className="text-sm text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    Con el objetivo de realizar los procedimientos de conocimiento aplicables a TEI S.A.S. y establecidos en el SAGRILAFT, por favor proporcione la siguiente información.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* 1. Review Personal Info */}
                    <Section title="1. Información Básica">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <InfoField label="Nombre" value={user.name || ''} />
                            <InfoField label="Email" value={user.email || ''} />
                            <InfoField label="Documento" value={user.document_id || 'Pendiente'} />
                            <InfoField label="País Seleccionado" value={country.name} />
                        </div>
                    </Section>

                    {/* 2. Tax Info */}
                    <Section title="2. Información Tributaria">
                        <YesNoQuestion
                            label="¿Es usted Facturador Electrónico? (Verifique en su RUT)"
                            value={formData.is_facturador_electronico}
                            onChange={(v) => handleInputChange('is_facturador_electronico', v)}
                        />
                        <YesNoQuestion
                            label="¿Es usted Declarante de Renta?"
                            value={formData.is_declarante_renta}
                            onChange={(v) => handleInputChange('is_declarante_renta', v)}
                        />
                    </Section>

                    {/* 3. PEP Declaration */}
                    <Section title="3. Declaración PEP (Persona Expuesta Políticamente)">
                        <YesNoQuestion
                            label="¿Es usted actualmente una Persona Expuesta Políticamente (PEP)?"
                            value={formData.is_pep}
                            onChange={(v) => handleInputChange('is_pep', v)}
                        />

                        {formData.is_pep === true && (
                            <div className="ml-4 mt-2 p-4 border-l-4 border-blue-500 bg-blue-50 space-y-3">
                                <InputField
                                    label="¿Qué cargo ocupa como PEP?"
                                    value={formData.pep_position}
                                    onChange={(v) => handleInputChange('pep_position', v)}
                                />
                                <InputField
                                    label="Fecha de Vinculación / Desvinculación"
                                    placeholder="DD/MM/AAAA"
                                    value={formData.pep_dates}
                                    onChange={(v) => handleInputChange('pep_dates', v)}
                                />
                            </div>
                        )}

                        <YesNoQuestion
                            label="¿Tiene cuentas financieras en países extranjeros?"
                            value={formData.has_foreign_accounts}
                            onChange={(v) => handleInputChange('has_foreign_accounts', v)}
                        />
                        {formData.has_foreign_accounts === true && (
                            <YesNoQuestion
                                className="ml-4 mt-2"
                                label="¿Tiene poder de firma sobre la cuenta en el exterior?"
                                value={formData.has_signature_power_foreign}
                                onChange={(v) => handleInputChange('has_signature_power_foreign', v)}
                            />
                        )}

                        <YesNoQuestion
                            label="¿Usted tiene familiares PEP o es asociado de negocios de un PEP?"
                            value={formData.is_pep_associate}
                            onChange={(v) => handleInputChange('is_pep_associate', v)}
                        />
                        {formData.is_pep_associate === true && (
                            <div className="ml-4 mt-2 p-4 border-l-4 border-blue-500 bg-blue-50">
                                <InputField
                                    label="Indique nombre, cargo y entidad del familiar o asociado"
                                    value={formData.pep_associate_details}
                                    onChange={(v) => handleInputChange('pep_associate_details', v)}
                                />
                            </div>
                        )}
                    </Section>

                    {/* 4. Conflicts & Crypto */}
                    <Section title="4. Otros">
                        <YesNoQuestion
                            label="¿Tiene alguna relación personal o familiar con un Empleado o Administrador de TEI?"
                            value={formData.has_conflict_interest}
                            onChange={(v) => handleInputChange('has_conflict_interest', v)}
                        />
                        {formData.has_conflict_interest === true && (
                            <div className="ml-4 mt-2">
                                <InputField
                                    label="Indique nombre y parentesco"
                                    value={formData.conflict_details}
                                    onChange={(v) => handleInputChange('conflict_details', v)}
                                />
                            </div>
                        )}

                        <YesNoQuestion
                            label="¿Tiene o realiza transacciones con monedas digitales? (Bitcoin, USDT, etc)"
                            value={formData.uses_crypto}
                            onChange={(v) => handleInputChange('uses_crypto', v)}
                        />
                    </Section>

                    {/* 5. Attachments */}
                    <Section title="5. Anexos Requeridos">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileInput label="Cargar RUT Actualizado" onChange={(e) => handleFileChange(e, 'rut')} file={files.rut} />
                            <FileInput label="Fotocopia Doc. Identidad" onChange={(e) => handleFileChange(e, 'cedula')} file={files.cedula} />
                            <FileInput label="Certificación Bancaria" onChange={(e) => handleFileChange(e, 'bank_certificate')} file={files.bank_certificate} />
                            <FileInput label="Foto Fondo Blanco (Para Ascensos)" onChange={(e) => handleFileChange(e, 'profile_photo')} file={files.profile_photo} />
                        </div>
                    </Section>

                    {/* 6. Legal Checkboxes */}
                    <Section title="6. Declaraciones Legales">
                        <div className="space-y-4">
                            <Checkbox
                                checked={formData.accepted_data_policy}
                                onChange={(v) => handleInputChange('accepted_data_policy', v)}
                                label={<>He leído, conozco y acepto la <a href="https://tuempresainternacional.com/documentos/politica_datos.html?v=3" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800" onClick={(e) => e.stopPropagation()}>Política de Tratamiento de Datos</a> de TEI.</>}
                            />
                            <Checkbox
                                checked={formData.accepted_commercial_contract}
                                onChange={(v) => handleInputChange('accepted_commercial_contract', v)}
                                label={<>He leído y acepto los términos del <a href="https://tuempresainternacional.com/documentos/contrato_comercial.html?v=3" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800" onClick={(e) => e.stopPropagation()}>Contrato Comercial de Ventas Multinivel</a>.</>}
                            />
                            <Checkbox
                                checked={formData.accepted_sagrilaft}
                                onChange={(v) => handleInputChange('accepted_sagrilaft', v)}
                                label={<>He leído, comprendido y acepto las políticas del <a href="https://tuempresainternacional.com/documentos/manual_sagrilaft.html?v=3" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800" onClick={(e) => e.stopPropagation()}>SAGRILAFT</a> y realizo las declaraciones de cumplimiento.</>}
                            />
                        </div>
                    </Section>

                    {/* Result Message */}
                    {result && (
                        <div className={`p-4 rounded-xl text-center ${result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <h3 className="font-bold text-xl">{result.message}</h3>
                            {result.reason && <p>{result.reason}</p>}
                        </div>
                    )}


                    {/* Submit Button */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-lg transition-all
                                ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-2xl hover:-translate-y-1'
                                }`}
                        >
                            {loading ? 'Validando y Enviando...' : 'ENVIAR DOCUMENTACIÓN'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const CountryCard = ({ name, flag, onClick }) => (
    <div onClick={onClick} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all hover:-translate-y-2 border border-gray-100 text-center group">
        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{flag}</div>
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
        <p className="text-sm text-gray-500 mt-2">Clic para registrar documentación</p>
    </div>
);

const Section = ({ title, children }) => (
    <div className="border-b border-gray-200 pb-8 last:border-0">
        <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide border-l-4 border-blue-600 pl-3">{title}</h2>
        {children}
    </div>
);

const InfoField = ({ label, value }) => (
    <div>
        <label className="block text-xs text-gray-500 font-bold uppercase">{label}</label>
        <div className="text-gray-800">{value}</div>
    </div>
);

const YesNoQuestion = ({ label, value, onChange, className = "" }) => (
    <div className={`mb-4 ${className}`}>
        <p className="mb-2 font-medium text-gray-700">{label} *</p>
        <div className="flex gap-4">
            <label className={`
                flex-1 p-3 border rounded-lg cursor-pointer text-center transition-colors
                ${value === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}
            `}>
                <input type="radio" className="hidden" checked={value === true} onChange={() => onChange(true)} />
                SI
            </label>
            <label className={`
                flex-1 p-3 border rounded-lg cursor-pointer text-center transition-colors
                ${value === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}
            `}>
                <input type="radio" className="hidden" checked={value === false} onChange={() => onChange(false)} />
                NO
            </label>
        </div>
    </div>
);

const InputField = ({ label, value, onChange, placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const FileInput = ({ label, onChange, file }) => (
    <div>
        <label className="block font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
            <input
                type="file"
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer
                "
                onChange={onChange}
                accept="image/*,.pdf"
            />
            {file && <span className="text-xs text-green-600 mt-1 block">✅ Archivo seleccionado</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1">Máximo 15 MB</p>
    </div>
);

const Checkbox = ({ label, checked, onChange }) => (
    <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
        />
        <div
            className="text-sm text-gray-700 cursor-pointer select-none"
            onClick={(e) => {
                // Prevent toggling if a link was clicked (though stopPropagation on link should handle this too)
                if (e.target.tagName !== 'A') {
                    onChange(!checked);
                }
            }}
        >
            {label}
        </div>
    </div>
);

export default KYCValidation;
