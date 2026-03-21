import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { Country, State, City } from 'country-state-city';
import { COLOMBIA_ZIP_CODES } from '../../data/colombiaZipCodes';
// Updated zip codes import v2 (Cache Buster)

export default function RegisterForm({ referralCode = "", onSuccess = null, onBack = null }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username: "",
        password: "",
        confirm_password: "",
        document_id: "",
        gender: "",
        birth_date: "",
        phone: "",
        address: "",
        city: "",
        province: "",
        country: "",
        postal_code: "",
        referral_code: "",
        acceptedTerms: false
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showTerms, setShowTerms] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState("");
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

    const handleCountryChange = (e) => {
        const isoCode = e.target.value;
        const country = Country.getCountryByCode(isoCode);
        setSelectedCountryCode(isoCode);
        setSelectedStateCode("");

        // Auto-fill phone code if country exists
        const phonePrefix = country ? `+${country.phonecode} ` : "";

        setFormData({
            ...formData,
            country: country ? country.name : "",
            province: "",
            city: "",
            phone: phonePrefix
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

        // Auto-fill zip code using nested structure: [StateCode][CityName]
        if (selectedCountryCode === 'CO' && selectedStateCode && COLOMBIA_ZIP_CODES[selectedStateCode] && COLOMBIA_ZIP_CODES[selectedStateCode][cityName]) {
            newPostalCode = COLOMBIA_ZIP_CODES[selectedStateCode][cityName];
        }

        setFormData({ ...formData, city: cityName, postal_code: newPostalCode });
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
                referral_code: formData.referral_code?.trim(),
                username: formData.username?.trim(),
                email: formData.email?.trim()
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
                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
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
                                placeholder="Ej: Juan Pérez Gómez"
                            />
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
                        <div>
                            <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                Documento de Identidad *
                            </label>
                            <input
                                type="text"
                                name="document_id"
                                value={formData.document_id}
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
                                placeholder="Cédula, pasaporte, DNI, etc."
                            />
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
                                    Código Postal *
                                </label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
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
                                    placeholder="Código postal"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
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
                        He leído y acepto los <button type="button" onClick={() => setShowTerms(true)} style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Términos y Condiciones</button>, incluyendo las políticas de privacidad y tratamiento de datos.
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.acceptedTerms}
                    style={{
                        width: "100%",
                        background: loading || !formData.acceptedTerms ? "#cbd5e1" : "linear-gradient(to right, #3b82f6, #1e40af)",
                        color: "white",
                        fontWeight: "bold",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "none",
                        cursor: loading || !formData.acceptedTerms ? "not-allowed" : "pointer",
                        opacity: loading || !formData.acceptedTerms ? 0.7 : 1,
                        fontSize: "1.125rem",
                        marginTop: "1rem",
                        transition: "all 0.3s ease",
                        boxShadow: loading || !formData.acceptedTerms ? "none" : "0 4px 15px rgba(37, 99, 235, 0.4)"
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

LA COMPAÑÍA: TU EMPRESA INTERNACIONAL S.A.S., sociedad comercial domiciliada en Medellín.

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
Si no se llegare a un acuerdo, las partes acuerdan someterse a la jurisdicción ordinaria de los jueces de la República de Colombia, fijando como domicilio contractual la ciudad de Medellín.

### CLÁUSULA DECIMOSEGUNDA: MODIFICACIONES
LA COMPAÑÍA se reserva el derecho de modificar estos términos, el Plan de Compensación, precios y políticas en cualquier momento. Las modificaciones serán efectivas tras su publicación en el sitio web oficial o la oficina virtual. La continuación de las actividades del Vendedor Independiente o la realización de compras tras la publicación constituye la aceptación tácita de las nuevas condiciones.

### CLÁUSULA DECIMOTERCERA: FIRMA ELECTRÓNICA Y VALIDEZ
Conforme a la Ley 527 de 1999, la aceptación de estos términos a través de medios electrónicos (clic en "Aceptar", "Registrarme" o similares) y a través del mecanismo de doble factor de autenticación (si aplicase) u otros mecanismos de seguridad de la plataforma, tiene plena validez jurídica y fuerza probatoria equivalente a la firma autógrafa.

---
AL DAR CLIC EN EL BOTÓN DE REGISTRO, USTED DECLARA BAJO LA GRAVEDAD DE JURAMENTO QUE LA INFORMACIÓN SUMINISTRADA ES VERAZ Y QUE HA LEÍDO, ENTENDIDO Y ACEPTADO LA TOTALIDAD DE ESTOS TÉRMINOS Y CONDICIONES.
`;
