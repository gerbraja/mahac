import { useNavigate, useLocation } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";

export default function CompleteRegistration() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get referral code from state (passed from Home) or default to empty
    const referralCode = location.state?.referral_code || "";

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div style={{ padding: "1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ color: "white", fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                        Crea tu Cuenta
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.1rem" }}>
                        Completa todos los datos para registrarte y obtener tu link de referido
                    </p>
                </div>

                {/* Using Shared Component */}
                <RegisterForm
                    referralCode={referralCode}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
}
