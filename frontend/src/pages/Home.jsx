import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import TeiLogo from "../components/TeiLogo";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState("");

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
      // Verify referral code and get referrer name
      api.get(`/auth/verify-referral/${refCode}`)
        .then(response => {
          if (response.data.valid) {
            setReferrerName(response.data.referrer_name);
          }
        })
        .catch(() => {
          // Invalid referral code, ignore
        });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        referral_code: referralCode || undefined,
      });

      await api.post(`/api/binary/pre-register/${response.data.id}`);

      setMessage("¡Pre-Registro Completado Exitosamente! 🎉 Tu posición en la red ha sido asegurada.");
      setFormData({ name: "", email: "", phone: "" });

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Error en el registro. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: "100vh", background: "white", position: "relative", overflow: "hidden" }}>
      {/* Header Azul */}
      <header style={{ position: "relative", zIndex: 10, padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}>
        <div style={{ color: "white", fontSize: "1.875rem", fontWeight: "bold" }}>
          <span>TEI</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            padding: "0.625rem 1.5rem",
            borderRadius: "9999px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
        >
          Iniciar Sesión
        </button>
      </header>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>

        {/* TEI Branding */}
        <div style={{ marginBottom: "4rem" }}>
          <TeiLogo size="large" showSubtitle={true} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", alignItems: "center" }}>

          {/* Content Section */}
          <div style={{ color: "#1e3a8a", textAlign: "center", marginBottom: "2rem" }}>

            {/* Product Message Badge */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))",
                color: "#1e40af",
                padding: "1rem 1.5rem",
                borderRadius: "1rem",
                fontSize: "1.125rem",
                fontWeight: "700",
                border: "2px solid rgba(59, 130, 246, 0.3)",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.2)",
                letterSpacing: "0.5px",
                maxWidth: "900px",
                margin: "0 auto"
              }}>
                🛍️ Compra Todos Tus Productos Directamente de Fábrica y Genera Grandes Ingresos Por Recomendar
              </div>
            </div>

            <h2 style={{ fontSize: "3rem", fontWeight: "bold", lineHeight: "1.2", marginBottom: "1rem", color: "#1e3a8a" }}>
              El Futuro que Mereces{" "}
              <span style={{ background: "linear-gradient(to right, #3b82f6, #1e40af, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Está a Un Clic
              </span>
            </h2>

            <p style={{ fontSize: "1.5rem", color: "#3b82f6", marginBottom: "2rem", lineHeight: "1.6" }}>
              Gana mientras ayudas a otros a crecer. Aquí comienza tu futuro financiero.
            </p>

            {/* Benefits */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#1e40af" }}>
                ✅ Sistema probado. Resultados reales.
              </div>
              <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#1e40af" }}>
                ✅ Tu éxito nos importa.
              </div>
              <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#1e40af" }}>
                ✅ Lo mejor está por venir.
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #3b82f6, #1e40af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>0</div>
                <div style={{ fontSize: "0.875rem", color: "#3b82f6", marginTop: "0.25rem" }}>Miembros</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #10b981, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$0</div>
                <div style={{ fontSize: "0.875rem", color: "#10b981", marginTop: "0.25rem" }}>Comisiones</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #8b5cf6, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>0</div>
                <div style={{ fontSize: "0.875rem", color: "#8b5cf6", marginTop: "0.25rem" }}>Países</div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%" }}>
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", backdropFilter: "blur(20px)", borderRadius: "1rem", padding: "2rem", border: "2px solid rgba(59, 130, 246, 0.2)", boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#1e3a8a", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                  Pre-Regístrate Ahora
                </h3>
                <p style={{ color: "#3b82f6", fontSize: "0.875rem" }}>
                  Asegura tu posición en la red global. Da el primer paso hoy.
                </p>

                {/* Show referrer if present */}
                {referrerName && (
                  <div style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    marginTop: "1rem",
                    border: "1px solid rgba(34, 197, 94, 0.3)"
                  }}>
                    <p style={{ color: "#16a34a", fontSize: "0.875rem", margin: 0 }}>
                      👥 Referido por: <strong>{referrerName}</strong>
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    background: "white",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                    color: "#1e3a8a",
                    outline: "none",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                  placeholder="Nombre Completo"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    background: "white",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                    color: "#1e3a8a",
                    outline: "none",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                  placeholder="Correo Electrónico"
                />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    background: "white",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                    color: "#1e3a8a",
                    outline: "none",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                  placeholder="País"
                />

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
                    transition: "all 0.3s",
                    fontSize: "1rem"
                  }}
                >
                  {loading ? "Registrando..." : "Comenzar Ahora →"}
                </button>

                {message && (
                  <div style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.875rem",
                    background: message.includes("exitoso") || message.includes("Completado") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: message.includes("exitoso") || message.includes("Completado") ? "#16a34a" : "#dc2626",
                    border: message.includes("exitoso") || message.includes("Completado") ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(239, 68, 68, 0.5)"
                  }}>
                    {message}
                  </div>
                )}
              </form>

              <p style={{ color: "#64748b", fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem" }}>
                Al registrarte, aceptas nuestros{" "}
                <a
                  href="/terminos-y-condiciones.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "underline", fontWeight: "600" }}
                >
                  Términos y Condiciones
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
