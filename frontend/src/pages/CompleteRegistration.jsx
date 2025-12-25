import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function CompleteRegistration({ referralCode = "", onBack = null }) {
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
        referral_code: ""
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Pre-fill referral code from prop
    useEffect(() => {
        if (referralCode) {
            setFormData(prev => ({ ...prev, referral_code: referralCode }));
        }
    }, [referralCode]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/register", formData);

            setMessage(`¡Registro Exitoso! 🎉 Tu link de referido: ${window.location.origin}${response.data.referral_link}`);

            // Store token in localStorage for auto-login
            localStorage.setItem("access_token", response.data.access_token);

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
        <div style={{ padding: "1rem" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ color: "white", fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                        Crea tu Cuenta
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.1rem" }}>
                        Completa todos los datos para registrarte y obtener tu link de referido
                    </p>
                </div>

                {/* Form */}
                <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}>
                    <form onSubmit={handleSubmit}>
                        {/* Account Information */}
                        <div style={{ marginBottom: "2rem" }}>
                            <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                                Información de Cuenta
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                                            outline: "none"
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
                                            outline: "none"
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
                                            outline: "none"
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
                                            outline: "none"
                                        }}
                                        placeholder="Usuario que te refirió"
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
                                            outline: "none"
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
                                            outline: "none"
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

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                                            outline: "none"
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
                                            outline: "none"
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
                                            outline: "none"
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
                                            outline: "none"
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

                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                        País *
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid rgba(59, 130, 246, 0.3)",
                                            outline: "none"
                                        }}
                                        placeholder="Ej: Colombia, España, México"
                                    />
                                </div>

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
                                            outline: "none"
                                        }}
                                        placeholder="Calle, número, apartamento, etc."
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                            Ciudad *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                borderRadius: "0.5rem",
                                                border: "2px solid rgba(59, 130, 246, 0.3)",
                                                outline: "none"
                                            }}
                                            placeholder="Ciudad"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                            Provincia/Estado *
                                        </label>
                                        <input
                                            type="text"
                                            name="province"
                                            value={formData.province}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                borderRadius: "0.5rem",
                                                border: "2px solid rgba(59, 130, 246, 0.3)",
                                                outline: "none"
                                            }}
                                            placeholder="Provincia"
                                        />
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
                                                outline: "none"
                                            }}
                                            placeholder="Código postal"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                background: "linear-gradient(to right, #3b82f6, #1e40af)",
                                color: "white",
                                fontWeight: "bold",
                                padding: "1rem",
                                borderRadius: "0.75rem",
                                border: "none",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.5 : 1,
                                fontSize: "1.125rem",
                                marginTop: "1rem",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {loading ? "Registrando..." : "Crear Cuenta →"}
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
                    </form>
                </div>
            </div>
        </div>
    );
}
