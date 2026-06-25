import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { Country, State, City } from 'country-state-city';
import { COLOMBIA_ZIP_CODES } from '../../data/colombiaZipCodes';
import { COLOMBIA_DIVIPOLA_COMPLETO } from '../../data/colombiaDivipolaCompleto';

export default function RegisterForm({ referralCode = "", onSuccess = null, onBack = null }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        person_type: "Natural",
        email: "",
        username: "",
        password: "",
        confirm_password: "",
        document_type: "",
        document_id: "",
        verification_digit: "",
        gender: "",
        birth_date: "",
        phone: "+57 ",
        address: "",
        city: "",
        province: "",
        country: "Colombia",
        postal_code: "",
        municipio_id: "",   // Código DIVIPOLA/DANE 5 dígitos (DIAN)
        referral_code: "",
        acceptedTerms: false,
        acceptedDataPolicy: false,
        acceptedSagrilaft: false
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showTerms, setShowTerms] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState("CO");
    const [selectedStateCode, setSelectedStateCode] = useState("");

    // Extraer solo el username si referralCode es una URL completa
    const getExtractedReferral = (code) => {
        if (!code) return "";

        // Handle URL with query parameter (?ref=...)
        if (code.includes('?ref=') || code.includes('&ref=')) {
            try {
                const search = code.split('?')[1] || '';
                return (new URLSearchParams(search).get('ref') || code).trim();
            } catch (e) { return code.trim(); }
        }

        // Handle URL structure like .../usuario/username
        if (code.includes('/usuario/')) {
            try {
                const parts = code.split('/usuario/');
                return (parts[parts.length - 1].split(/[?#]/)[0] || code).trim();
            } catch (e) { return code.trim(); }
        }

        return code.trim();
    };

    const extractedReferral = getExtractedReferral(referralCode);

    // Pre-fill referral code from prop
    useEffect(() => {
        if (extractedReferral) {
            setFormData(prev => ({ ...prev, referral_code: extractedReferral }));
        }
    }, [referralCode]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ————————————————————————————————————————————————————————
    // DIAN DV Calculator — Algoritmo oficial (serie de primos)
    // Solo aplica para CC y NIT en Colombia.
    // ————————————————————————————————————————————————————————
    const PRIME_SERIES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

    const calculateDV = (docNumber) => {
        const digits = String(docNumber).replace(/\D/g, "");
        if (!digits || digits.length < 6) return "";
        let sum = 0;
        const reversed = digits.split("").reverse();
        reversed.forEach((d, i) => {
            sum += parseInt(d, 10) * PRIME_SERIES[i % PRIME_SERIES.length];
        });
        const remainder = sum % 11;
        const dv = remainder === 0 ? 0 : remainder === 1 ? 1 : 11 - remainder;
        return String(dv);
    };

    const showsDV = (docType, countryCode) =>
        countryCode === "CO" && (docType === "CC" || docType === "NIT");

    // Tipos de documento por región del país seleccionado
    const getDocumentTypes = (isoCode) => {
        const LATAM = [
            "AR", "BO", "BR", "CL", "CR", "CU", "DO", "EC", "GT", "HN",
            "MX", "NI", "PA", "PE", "PY", "SV", "UY", "VE"
        ];
        const EUROPE = [
            "ES", "FR", "DE", "IT", "PT", "GB", "NL", "BE", "CH", "AT",
            "PL", "SE", "NO", "DK", "FI"
        ];

        if (isoCode === "CO") {
            return [
                { value: "CC",       label: "Cédula de Ciudadanía (CC)" },
                { value: "TI",       label: "Tarjeta de Identidad (TI)" },
                { value: "NIT",      label: "NIT (Empresa)" },
                { value: "CE",       label: "Cédula de Extranjería (CE)" },
                { value: "PPT",      label: "Permiso de Protección Temporal (PPT)" },
                { value: "PASAPORTE", label: "Pasaporte" },
            ];
        } else if (LATAM.includes(isoCode)) {
            return [
                { value: "CI",        label: "Cédula de Identidad (CI)" },
                { value: "DNI",       label: "Documento Nacional de Identidad (DNI)" },
                { value: "RUC",       label: "RUC (Empresa)" },
                { value: "CE",        label: "Cédula de Extranjería (CE)" },
                { value: "PASAPORTE", label: "Pasaporte" },
            ];
        } else if (EUROPE.includes(isoCode)) {
            return [
                { value: "NIF",       label: "NIF / DNI (España y Europa)" },
                { value: "PASAPORTE", label: "Pasaporte" },
                { value: "NAT_ID",    label: "National ID" },
            ];
        } else {
            return [
                { value: "PASAPORTE", label: "Pasaporte" },
                { value: "NAT_ID",    label: "National ID / Documento Nacional" },
            ];
        }
    };

    const handleDocumentTypeChange = (e) => {
        const newType = e.target.value;
        const newDV = showsDV(newType, selectedCountryCode)
            ? calculateDV(formData.document_id)
            : "";
        setFormData({ ...formData, document_type: newType, verification_digit: newDV });
    };

    const handleDocumentIdChange = (e) => {
        const newId = e.target.value;
        const newDV = showsDV(formData.document_type, selectedCountryCode)
            ? calculateDV(newId)
            : "";
        setFormData({ ...formData, document_id: newId, verification_digit: newDV });
    };


    const handleCountryChange = (e) => {
        const isoCode = e.target.value;
        const country = Country.getCountryByCode(isoCode);
        setSelectedCountryCode(isoCode);
        setSelectedStateCode("");

        // Auto-fill phone code if country exists
        const phonePrefix = country ? `+${country.phonecode} ` : "";

        // Reset document type when country changes (types vary by region)
        setFormData({
            ...formData,
            country: country ? country.name : "",
            province: "",
            city: "",
            phone: phonePrefix,
            document_type: "",
            verification_digit: ""
        });
    };

    const handleStateChange = (e) => {
        const isoCode = e.target.value;
        const state = State.getStateByCodeAndCountry(isoCode, selectedCountryCode);
        setSelectedStateCode(isoCode);
        setFormData({
            ...formData,
            province: state ? state.name : "",
            city: ""
        });
    };

    const handleCityChange = (e) => {
        const cityName = e.target.value;
        let newPostalCode = formData.postal_code;
        let newMunicipioId = formData.municipio_id;

        if (selectedCountryCode === 'CO') {
            // Auto-fill código DIVIPOLA/DANE (5 dígitos, DIAN obligatorio)
            const divipolaCode = COLOMBIA_DIVIPOLA_COMPLETO[selectedStateCode]?.[cityName];
            if (divipolaCode) {
                newMunicipioId = divipolaCode;
                newPostalCode = divipolaCode; // Use DIVIPOLA as the postal code
            } else {
                newMunicipioId = "";
                newPostalCode = "";
            }
        }

        setFormData({ ...formData, city: cityName, postal_code: newPostalCode, municipio_id: newMunicipioId });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // Validar que el username no tenga espacios
            if (formData.username.includes(" ")) {
                setMessage("El nombre de usuario no puede contener espacios");
                setLoading(false);
                return;
            }

            // Trim referral code and other sensitive fields
            const dataToSubmit = {
                ...formData,
                first_name: formData.first_name?.trim(),
                last_name: formData.last_name?.trim(),
                referral_code: formData.referral_code?.trim(),
                username: formData.username?.trim(),
                email: formData.email?.trim(),
                // Opcional — backend acepta null
                document_type: formData.document_type || null,
                verification_digit: formData.verification_digit || null,
                person_type: formData.person_type || "Natural",
                municipio_id: formData.municipio_id || null,
            };

            const response = await api.post("/auth/register", dataToSubmit);

            setMessage(`¡Registro Exitoso! 🎉 Tu link de referido: ${window.location.origin}${response.data.referral_link}`);

            // Store token in localStorage for auto-login
            localStorage.setItem("access_token", response.data.access_token);

            // Execute custom success callback if provided
            if (onSuccess) {
                onSuccess(response.data);
            }

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                navigate("/dashboard");
            }, 3000);
        } catch (error) {
            console.error("Registration error:", error);

            // Extract the most specific error message
            let errorMessage = "Error al registrarse. Por favor intenta de nuevo.";

            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h2 style={{ color: "#1e3a8a", fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Crea tu Cuenta
                </h2>
                <p style={{ color: "#64748b", fontSize: "1rem" }}>
                    Completa tus datos para unirte y obtener acceso inmediato.
                </p>
                {extractedReferral && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
                        <p className="text-green-700 text-sm m-0">
                            👥 Referido por: <strong>{extractedReferral}</strong>
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="text-left">
                {/* Country Selection */}
                <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                        Ubicación
                    </h3>
                    <div>
                        <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                            País *
                        </label>
                        <select
                            name="country"
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            required
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                border: "2px solid rgba(59, 130, 246, 0.3)",
                                outline: "none",
                                color: "#333",
                                backgroundColor: "white"
                            }}
                        >
                            <option value="">Selecciona un país</option>
                            {Country.getAllCountries().map((country) => (
                                <option key={country.isoCode} value={country.isoCode}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Account Information */}
                <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                        Información de Cuenta
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombres */}
                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Nombres * <span style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: "normal" }}>(máx. 60 caracteres)</span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                maxLength={60}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Ej: Juan Carlos"
                            />
                        </div>

                        {/* Apellidos */}
                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Apellidos * <span style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: "normal" }}>(máx. 60 caracteres)</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                maxLength={60}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Ej: Pérez Gómez"
                            />
                        </div>

                        {/* Tipo de Persona (Siigo/DIAN) — solo visible si país = Colombia o NIT */}
                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Tipo de Persona *{" "}
                                <span style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: "normal" }}>(DIAN / Siigo)</span>
                            </label>
                            <select
                                name="person_type"
                                value={formData.person_type}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333",
                                    backgroundColor: "white"
                                }}
                            >
                                <option value="Natural">Persona Natural (CC, CE, PPT…)</option>
                                <option value="Juridica">Persona Jurídica (NIT / Empresa)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Nombre de Usuario *
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Ej: Dianis75"
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Código de Referido *
                            </label>
                            <input
                                type="text"
                                name="referral_code"
                                value={formData.referral_code}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333",
                                    backgroundColor: referralCode ? "#f0fdf4" : "white"
                                }}
                                placeholder="Usuario que te refirió"
                                readOnly={!!referralCode}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Confirmar Contraseña *
                            </label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Repite la contraseña"
                            />
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                        Información Personal
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Documento de Identidad — Tipo + Número + DV */}
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Documento de Identidad *
                            </label>

                            {/* Fila: Tipo | Número */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                {/* Selector tipo */}
                                <div>
                                    <select
                                        name="document_type"
                                        value={formData.document_type}
                                        onChange={handleDocumentTypeChange}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: formData.document_type ? "#333" : "#9ca3af",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">Tipo de documento...</option>
                                        {getDocumentTypes(selectedCountryCode).map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Número de documento */}
                                <div>
                                    <input
                                        type="text"
                                        name="document_id"
                                        value={formData.document_id}
                                        onChange={handleDocumentIdChange}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: "#333"
                                        }}
                                        placeholder="Número de documento"
                                    />
                                </div>
                            </div>

                            {/* Badge DV — solo visible si país=CO y tipo=CC o NIT */}
                            {showsDV(formData.document_type, selectedCountryCode) && (
                                <div style={{
                                    marginTop: "0.6rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: formData.verification_digit !== "" ? "#eff6ff" : "#f8fafc",
                                    border: `1px solid ${formData.verification_digit !== "" ? "#bfdbfe" : "#e2e8f0"}`,
                                    borderRadius: "0.5rem",
                                    padding: "0.45rem 0.85rem",
                                    fontSize: "0.9rem"
                                }}>
                                    <span style={{ color: "#64748b" }}>Dígito de Verificación (DV):</span>
                                    <span style={{
                                        fontWeight: "bold",
                                        fontSize: "1.1rem",
                                        color: formData.verification_digit !== "" ? "#1e40af" : "#94a3b8",
                                        minWidth: "1.5rem",
                                        textAlign: "center"
                                    }}>
                                        {formData.verification_digit !== "" ? formData.verification_digit : "—"}
                                    </span>
                                    <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                                        (calculado automáticamente · DIAN)
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Sexo *
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                            >
                                <option value="">Selecciona...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Fecha de Nacimiento *
                            </label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="+57 300 123 4567"
                            />
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                        Información de Dirección
                    </h3>

                    <div className="grid grid-cols-1 gap-4">

                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Dirección Completa *
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid rgba(59, 130, 246, 0.3)",
                                    outline: "none",
                                    color: "#333"
                                }}
                                placeholder="Calle, número, apartamento, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                    Provincia/Estado *
                                </label>
                                {selectedCountryCode && State.getStatesOfCountry(selectedCountryCode).length > 0 ? (
                                    <select
                                        name="province"
                                        value={selectedStateCode}
                                        onChange={handleStateChange}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: "#333",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">Selecciona...</option>
                                        {State.getStatesOfCountry(selectedCountryCode).map((state) => (
                                            <option key={state.isoCode} value={state.isoCode}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="province"
                                        value={formData.province}
                                        onChange={handleChange}
                                        required
                                        placeholder="Provincia"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: "#333"
                                        }}
                                    />
                                )}
                            </div>

                            <div>
                                <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                    Ciudad *
                                </label>
                                {selectedStateCode && City.getCitiesOfState(selectedCountryCode, selectedStateCode).length > 0 ? (
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleCityChange}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: "#333",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">Selecciona...</option>
                                        {City.getCitiesOfState(selectedCountryCode, selectedStateCode).map((city) => (
                                            <option key={city.name} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ciudad"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none",
                                            color: "#333"
                                        }}
                                    />
                                )}
                            </div>

                            <div>
                                <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                    {selectedCountryCode === "CO" ? "Código DIVIPOLA *" : "Código Postal *"}
                                </label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    required
                                    maxLength={selectedCountryCode === "CO" ? 5 : 20}
                                    pattern={selectedCountryCode === "CO" ? "^[0-9]{5}$" : undefined}
                                    title={selectedCountryCode === "CO" ? "El código DIVIPOLA debe tener exactamente 5 dígitos" : undefined}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "0.5rem",
                                        border: "2px solid rgba(59, 130, 246, 0.3)",
                                        outline: "none",
                                        color: "#333"
                                    }}
                                    placeholder="Código postal"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal Consent Checkboxes (Three explicit checkpoints) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                    {/* 1. Terms & Conditions & Commercial Contract */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <input
                            type="checkbox"
                            id="terms"
                            checked={formData.acceptedTerms}
                            onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                            required
                            style={{
                                marginTop: "0.25rem",
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer"
                            }}
                        />
                        <label htmlFor="terms" style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.4" }}>
                            He leído y acepto los <button type="button" onClick={() => setShowTerms(true)} style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Términos y Condiciones</button> y los términos del <a href="https://tuempresainternacional.com/documentos/contrato_comercial.html?v=3" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline" }}>Contrato Comercial de Ventas Multinivel</a> de TEI.
                        </label>
                    </div>

                    {/* 2. Data Treatment Policy */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <input
                            type="checkbox"
                            id="dataPolicy"
                            checked={formData.acceptedDataPolicy}
                            onChange={(e) => setFormData({ ...formData, acceptedDataPolicy: e.target.checked })}
                            required
                            style={{
                                marginTop: "0.25rem",
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer"
                            }}
                        />
                        <label htmlFor="dataPolicy" style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.4" }}>
                            He leído, conozco y acepto la <a href="https://tuempresainternacional.com/documentos/politica_datos.html?v=3" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline" }}>Política de Tratamiento de Datos</a> de TEI.
                        </label>
                    </div>

                    {/* 3. SAGRILAFT Manual & Declarations */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <input
                            type="checkbox"
                            id="sagrilaft"
                            checked={formData.acceptedSagrilaft}
                            onChange={(e) => setFormData({ ...formData, acceptedSagrilaft: e.target.checked })}
                            required
                            style={{
                                marginTop: "0.25rem",
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer"
                            }}
                        />
                        <label htmlFor="sagrilaft" style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.4" }}>
                            He leído, comprendido y acepto las políticas del <a href="https://tuempresainternacional.com/documentos/manual_sagrilaft.html?v=3" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline" }}>SAGRILAFT</a> y realizo las declaraciones de cumplimiento.
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.acceptedTerms || !formData.acceptedDataPolicy || !formData.acceptedSagrilaft}
                    style={{
                        width: "100%",
                        background: loading || !formData.acceptedTerms || !formData.acceptedDataPolicy || !formData.acceptedSagrilaft ? "#cbd5e1" : "linear-gradient(to right, #3b82f6, #1e40af)",
                        color: "white",
                        fontWeight: "bold",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "none",
                        cursor: loading || !formData.acceptedTerms || !formData.acceptedDataPolicy || !formData.acceptedSagrilaft ? "not-allowed" : "pointer",
                        opacity: loading || !formData.acceptedTerms || !formData.acceptedDataPolicy || !formData.acceptedSagrilaft ? 0.7 : 1,
                        fontSize: "1.125rem",
                        marginTop: "1rem",
                        transition: "all 0.3s ease",
                        boxShadow: loading || !formData.acceptedTerms || !formData.acceptedDataPolicy || !formData.acceptedSagrilaft ? "none" : "0 4px 15px rgba(37, 99, 235, 0.4)"
                    }}
                >
                    {loading ? "Registrando..." : "Crear Cuenta Completar →"}
                </button>

                {/* Message */}
                {message && (
                    <div style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background: message.includes("Exitoso") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: message.includes("Exitoso") ? "#16a34a" : "#dc2626",
                        border: message.includes("Exitoso") ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(239, 68, 68, 0.5)"
                    }}>
                        {message}
                    </div>
                )}
            </form>

            {/* Back Button */}
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        width: "100%",
                        background: "transparent",
                        color: "#64748b",
                        border: "2px solid #e2e8f0",
                        fontWeight: "500",
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        cursor: "pointer",
                        marginTop: "1rem",
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#f1f5f9";
                        e.target.style.color = "#1e3a8a";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#64748b";
                    }}
                >
                    ← Atrás
                </button>
            )}

            {/* Terms Modal */}
            {showTerms && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                    padding: "1rem"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "1rem",
                        width: "100%",
                        maxWidth: "800px",
                        maxHeight: "85vh",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}>
                        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b" }}>Términos y Condiciones</h3>
                            <button onClick={() => setShowTerms(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}>&times;</button>
                        </div>
                        <div style={{ padding: "1.5rem", overflowY: "auto", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                            {TERMS_CONTENT}
                        </div>
                        <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, acceptedTerms: true }));
                                    setShowTerms(false);
                                }}
                                style={{
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    padding: "0.75rem 1.5rem",
                                    borderRadius: "0.5rem",
                                    fontWeight: "bold",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                Aceptar y Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main zip codes moved to src/data/colombiaZipCodes.js

const TERMS_CONTENT = `TÉRMINOS Y CONDICIONES - CONTRATO DE VINCULACIÓN DE VENDEDOR INDEPENDIENTE

IMPORTANTE: LEA DETENIDAMENTE EL PRESENTE CONTRATO DE ADHESIÓN. AL DILIGENCIAR EL FORMULARIO DE REGISTRO EN NUESTRA PLATAFORMA VIRTUAL Y HACER CLIC EN EL BOTÓN "REGISTRARME", "ACEPTAR", "INSCRIBIRSE" O CUALQUIER OTRO BOTÓN DE ACCIÓN SIMILAR, USTED ACEPTA VINCULARSE JURÍDICAMENTE BAJO LOS TÉRMINOS AQUÍ DESCRITOS.

LAS PARTES:

LA COMPAÑÍA: Tu Empresa Internacional S.A.S. (identificada con NIT 902045325-4), sociedad debidamente constituida y válidamente existente de acuerdo con las leyes de la República de Colombia, dedicada al ejercicio de las actividades de comercialización en red o mercadeo multinivel (“Mercadeo Multinivel”), de acuerdo con el artículo 2 de la Ley 1700 de 2013 y cualquier otra normativa que la reglamente, modifique, adicione o derogue, según consta en el certificado de existencia y representación legal de la compañía.

EL VENDEDOR INDEPENDIENTE (USTED): La persona natural o jurídica que diligencia el formulario de registro electrónico, cuyos datos se consideran veraces y fidedignos para todos los efectos legales.

Este acuerdo se rige por la Ley 1700 de 2013, la Ley 527 de 1999 (Comercio Electrónico) y las siguientes cláusulas:

### CLÁUSULA PRIMERA: ACEPTACIÓN Y OBJETO
Al completar el proceso de inscripción, EL VENDEDOR INDEPENDIENTE acepta el derecho no exclusivo de comercializar los productos de LA COMPAÑÍA y de construir su propia red de mercadeo de acuerdo con el Plan de Compensación.

### CLÁUSULA SEGUNDA: NATURALEZA DE LA RELACIÓN
Usted entiende y acepta que su relación con LA COMPAÑÍA es MERCANTIL E INDEPENDIENTE.
* NO EXISTE RELACIÓN LABORAL: Usted no es empleado, socio, ni representante legal de LA COMPAÑÍA.
* AUTONOMÍA: Usted decide su propio horario y métodos de venta, respetando las políticas de la empresa.
* RESPONSABILIDAD TRIBUTARIA: Usted es responsable de declarar y pagar sus propios impuestos y seguridad social.

### CLÁUSULA TERCERA: DERECHOS
Al aceptar estos términos, usted adquiere el derecho a:
1. Comprar productos a precio de distribuidor y revenderlos.
2. Vincular a nuevos vendedores independientes a su equipo.
3. Participar en el Plan de Compensación y recibir las comisiones generadas, sujeto al cumplimiento de requisitos.

### CLÁUSULA CUARTA: OBLIGACIONES
Usted se compromete a:
1. Proporcionar información real y actualizada en el registro.
2. Desarrollar el negocio con ética, sin engaños ni falsas promesas de ingresos.
3. No promocionar el negocio como un esquema de inversión o pirámide.
4. Cumplir manuales y políticas publicados en la oficina virtual.

### CLÁUSULA QUINTA: DERECHO DE RETRACTO (LEY 1700)
De conformidad con el Artículo 14 de la Ley 1700 de 2013, usted tiene derecho a terminar este contrato y solicitar el reembolso del dinero pagado por bienes o servicios iniciales, dentro de los cinco (5) días hábiles siguientes a su registro o recibo del producto, siempre y cuando devuelva los bienes en las mismas condiciones.
PARÁGRAFO: Al retractarse y pedir el reembolso, LA COMPAÑÍA se reserva el derecho de admisión para una nueva vinculación antes de cumplir cinco (5) años del retracto.

### CLÁUSULA SEXTA: PROHIBICIONES EXPRESAS
Queda terminantemente prohibido al VENDEDOR INDEPENDIENTE:
1. Reclutamiento Cruzado (Cross-Line Recruiting): Intentar persuadir a vendedores independientes de otras líneas de patrocinio dentro de LA COMPAÑÍA para que cambien de equipo o patrocinador.
2. Promoción de Competencia: Ofrecer, promocionar o vender productos, servicios u oportunidades de negocio de otras compañías de Mercadeo en Red, Venta Directa o similares a los miembros de la red de LA COMPAÑÍA.
3. Manipulación del Plan: Crear cuentas ficticias, realizar compras simuladas o cualquier maniobra destinada a manipular el Plan de Compensación para obtener rangos o comisiones no devengadas legítimamente.
4. Desluring: Hacer declaraciones falsas, engañosas o despectivas contra LA COMPAÑÍA, sus productos, directivos, empleados u otros vendedores independientes.

### CLÁUSULA SÉPTIMA: PROPIEDAD INTELECTUAL
El VENDEDOR INDEPENDIENTE reconoce que el nombre comercial, marcas, logotipos y material publicitario de TU EMPRESA INTERNACIONAL S.A.S. son propiedad exclusiva de LA COMPAÑÍA.
* Uso Permitido: Usted podrá utilizar únicamente los materiales y logos oficiales proporcionados en su oficina virtual para la promoción del negocio.
* Restricciones: No podrá crear páginas web, nombres de dominio, direcciones de correo electrónico o perfiles en redes sociales que incluyan el nombre de LA COMPAÑÍA o sus marcas de manera que confundan al público o aparenten ser canales oficiales corporativos.

### CLÁUSULA OCTAVA: CONFIDENCIALIDAD
Usted reconoce que los reportes de genealogía, listas de clientes, estructuras de equipo y datos de contacto disponibles en su oficina virtual son información confidencial y propiedad exclusiva de LA COMPAÑÍA (Secretos Comerciales).
* Esta información se entrega a usted en estricta confidencialidad y solo para el desarrollo de su negocio con LA COMPAÑÍA.
* Está prohibido usar estos reportes para promocionar otros negocios, vender la información a terceros o utilizarla tras la terminación de este contrato.

### CLÁUSULA NOVENA: CAUSALES DE TERMINACIÓN
LA COMPAÑÍA podrá dar por terminado este contrato de manera unilateral e inmediata, desactivando su código y reteniendo comisiones pendientes, en los siguientes casos:
1. Violación de cualquiera de las cláusulas de este contrato o de las Políticas y Procedimientos.
2. Realizar actos que afecten la reputación o imagen de LA COMPAÑÍA.
3. Violación de las leyes locales, incluyendo normatividad sobre captación ilegal de dinero o publicidad engañosa.
4. Inactividad prolongada según lo definido en el Plan de Compensación (ej. falta de reconsumo por 6 meses consecutivos).

### CLÁUSULA DÉCIMA: PROTECCIÓN DE DATOS PERSONALES
Usted autoriza a TU EMPRESA INTERNACIONAL S.A.S. para recolectar, almacenar y tratar sus datos personales conforme a la Ley 1581 de 2012 y su Política de Tratamiento de Datos. La finalidad incluye: gestión administrativa, fiscal, comercial, pago de comisiones, envío de información corporativa y transferencia internacional de datos si el servidor lo requiere. Usted puede ejercer sus derechos de conocer, actualizar y rectificar a través de los canales oficiales de servicio al cliente.

PARÁGRAFO RGPD (PARA RESIDENTES EN EUROPA): De conformidad con el Reglamento General de Protección de Datos (UE) 2016/679, se informa que sus datos serán tratados por TU EMPRESA INTERNACIONAL S.A.S. en Colombia. Al aceptar estos términos, usted consiente expresamente la transferencia internacional de sus datos a Colombia, necesaria para la ejecución de este contrato. Asimismo, se le garantizan los derechos de acceso, rectificación, supresión ("derecho al olvido"), limitación del tratamiento, portabilidad de datos y oposición, los cuales podrá ejercer enviando una solicitud al correo electrónico de soporte de la compañía.

### CLÁUSULA DECIMOPRIMERA: RESOLUCIÓN DE CONFLICTOS
Cualquier controversia o diferencia relativa a este contrato se intentará resolver inicialmente mediante arreglo directo entre las partes en un término no mayor a 30 días calendario.
Si no se llegare a un acuerdo, las partes acuerdan someterse a la jurisdicción ordinaria de los jueces de la República de Colombia.

### CLÁUSULA DECIMOSEGUNDA: MODIFICACIONES
LA COMPAÑÍA se reserva el derecho de modificar estos términos, el Plan de Compensación, precios y políticas en cualquier momento. Las modificaciones serán efectivas tras su publicación en el sitio web oficial o la oficina virtual. La continuación de las actividades del Vendedor Independiente o la realización de compras tras la publicación constituye la aceptación tácita de las nuevas condiciones.

### CLÁUSULA DECIMOTERCERA: FIRMA ELECTRÓNICA Y VALIDEZ
Conforme a la Ley 527 de 1999, la aceptación de estos términos a través de medios electrónicos (clic en "Aceptar", "Registrarme" o similares) y a través del mecanismo de doble factor de autenticación (si aplicase) u otros mecanismos de seguridad de la plataforma, tiene plena validez jurídica y fuerza probatoria equivalente a la firma autógrafa.

---
AL DAR CLIC EN EL BOTÓN DE REGISTRO, USTED DECLARA BAJO LA GRAVEDAD DE JURAMENTO QUE LA INFORMACIÓN SUMINISTRADA ES VERAZ Y QUE HA LEÍDO, ENTENDIDO Y ACEPTADO LA TOTALIDAD DE ESTOS TÉRMINOS Y CONDICIONES.
`;
