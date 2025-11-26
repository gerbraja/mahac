import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/api";

export default function CompleteRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [formData, setFormData] = useState({
        email: email,
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
        postal_code: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/complete-registration", formData);

            setMessage(`¡Registro Completado! 🎉 Tu link de referido: ${window.location.origin}${response.data.referral_link}`);

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                navigate("/dashboard");
            }, 3000);
        } catch (error) {
            setMessage(error.response?.data?.detail || "Error al completar el registro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", padding: "2rem" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ color: "#1e3a8a", fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                        Completa tu Registro
                    </h1>
                    <p style={{ color: "#3b82f6", fontSize: "1rem" }}>
                        Último paso para activar tu cuenta y obtener tu link de referido
                    </p>
                </div>

                {/* Form */}
                <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)" }}>
                    <form onSubmit={handleSubmit}>
                        {/* Account Information */}
                        <div style={{ marginBottom: "2rem" }}>
                            <h3 style={{ color: "#1e3a8a", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.5rem" }}>
                                Información de Cuenta
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        readOnly
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "0.5rem",
                                            border: "2px solid #e5e7eb",
                                            background: "#f9fafb",
                                            color: "#6b7280"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", color: "#1e3a8a", fontWeight: "500", marginBottom: "0.5rem" }}>
                                        Username *
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
                                        placeholder="Número de documento"
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
                                marginTop: "1rem"
                            }}
                        >
                            {loading ? "Completando Registro..." : "Completar Registro →"}
                        </button>

                        {/* Message */}
                        {message && (
                            <div style={{
                                marginTop: "1rem",
                                padding: "1rem",
                                borderRadius: "0.75rem",
                                background: message.includes("Completado") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                color: message.includes("Completado") ? "#16a34a" : "#dc2626",
                                border: message.includes("Completado") ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(239, 68, 68, 0.5)"
                            }}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
