import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import TeiLogo from "../components/TeiLogo";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [stats, setStats] = useState({
    total_members: 0,
    total_commissions: 0,
    total_countries: 0
  });

  // Fetch public stats
  useEffect(() => {
    api.get('/api/public/stats')
      .then(response => {
        setStats(response.data);
      })
      .catch(error => {
        console.error('Error fetching stats:', error);
      });
  }, []);

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

  const handleRegister = () => {
    // Navigate to complete registration with referral code if present
    navigate("/complete-registration", { state: { referral_code: referralCode } });
  };

  return (
    <div style={{ minHeight: "100vh", background: "white", position: "relative", overflow: "hidden" }}>
      {/* Header Azul */}
      <header style={{ position: "relative", zIndex: 10, padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}>
        <div style={{ color: "white", fontSize: "1.875rem", fontWeight: "bold" }}>
          <span>TEI</span>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "transparent",
              color: "white",
              padding: "0.625rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => navigate("/personal")}
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
            Personal
          </button>
        </div>
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
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #3b82f6, #1e40af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stats.total_members}</div>
                <div style={{ fontSize: "0.875rem", color: "#3b82f6", marginTop: "0.25rem" }}>Miembros</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #10b981, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>${stats.total_commissions.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: "0.875rem", color: "#10b981", marginTop: "0.25rem" }}>Comisiones</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #8b5cf6, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stats.total_countries}</div>
                <div style={{ fontSize: "0.875rem", color: "#8b5cf6", marginTop: "0.25rem" }}>Países</div>
              </div>
            </div>
          </div>

          {/* Registration CTA */}
          <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%" }}>
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", backdropFilter: "blur(20px)", borderRadius: "1rem", padding: "2rem", border: "2px solid rgba(59, 130, 246, 0.2)", boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h3 style={{ color: "#1e3a8a", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                  Regístrate Ahora
                </h3>
                <p style={{ color: "#3b82f6", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  Completa tu registro en una sola vez con todos tus datos. Crea tu cuenta y obtén tu link de referido de inmediato.
                </p>

                {/* Show referrer if present */}
                {referrerName && (
                  <div style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(34, 197, 94, 0.3)"
                  }}>
                    <p style={{ color: "#16a34a", fontSize: "0.875rem", margin: 0 }}>
                      👥 Referido por: <strong>{referrerName}</strong>
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleRegister}
                style={{
                  width: "100%",
                  background: "linear-gradient(to right, #3b82f6, #1e40af)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)"
                }}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                Crear Cuenta Completa →
              </button>

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
