# Implementación Frontend - Sistema de Referidos

## Paso 1: Actualizar Home.jsx

### 1.1 Cambiar imports (líneas 1-4)

**BUSCAR:**
```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
```

**REEMPLAZAR POR:**
```jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
```

---

### 1.2 Agregar estados para referidos (después de `const [message, setMessage] = useState("");`)

**AGREGAR:**
```jsx
const [searchParams] = useSearchParams();
const [referralCode, setReferralCode] = useState("");
const [referrerName, setReferrerName] = useState("");
```

---

### 1.3 Agregar useEffect para capturar código de URL (después de definir los estados)

**AGREGAR:**
```jsx
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
```

---

### 1.4 Actualizar handleSubmit para enviar código de referido

**BUSCAR en handleSubmit:**
```jsx
const response = await api.post("/auth/register", {
  name: formData.name,
  email: formData.email,
});
```

**REEMPLAZAR POR:**
```jsx
const response = await api.post("/auth/register", {
  name: formData.name,
  email: formData.email,
  referral_code: referralCode || undefined,
});
```

---

### 1.5 Mostrar mensaje de referido en el formulario

**BUSCAR (dentro del formulario, después del título "Pre-Regístrate Ahora"):**
```jsx
<p style={{ color: "#3b82f6", fontSize: "0.875rem" }}>
  Asegura tu posición en la red global. Da el primer paso hoy.
</p>
```

**AGREGAR DESPUÉS:**
```jsx
{referrerName && (
  <div style={{
    background: "rgba(34, 197, 94, 0.1)",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    marginTop: "1rem",
    border: "1px solid rgba(34, 197, 94, 0.3)"
  }}>
    <p style={{ color: "#16a34a", fontSize: "0.875rem", margin: 0, textAlign: "center" }}>
      👥 Referido por: <strong>{referrerName}</strong>
    </p>
  </div>
)}
```

---

## Paso 2: Crear endpoint para obtener datos del usuario

### 2.1 Agregar endpoint en backend/routers/auth.py

**AGREGAR al final del archivo (antes de la última línea):**
```python
@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    """Get current user data (for testing - in production use JWT token)."""
    # TODO: In production, get user_id from JWT token
    # For now, return the last activated user for testing
    user = db.query(UserModel).filter(UserModel.referral_code != None).order_by(UserModel.id.desc()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No active user found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "referral_code": user.referral_code,
        "username": user.username
    }
```

---

## Paso 3: Mostrar link de referido en Dashboard

### 3.1 Actualizar frontend/src/pages/dashboard/Overview.jsx

**AGREGAR al inicio del componente (después de los imports):**
```jsx
import { useState, useEffect } from "react";
import { api } from "../../api/api";
```

**AGREGAR dentro del componente (antes del return):**
```jsx
const [referralLink, setReferralLink] = useState("");
const [copied, setCopied] = useState(false);

useEffect(() => {
  // Get current user data
  api.get("/auth/me")
    .then(response => {
      if (response.data.referral_code) {
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/?ref=${response.data.referral_code}`);
      }
    })
    .catch(error => {
      console.error("Error getting user data:", error);
    });
}, []);

const copyToClipboard = () => {
  navigator.clipboard.writeText(referralLink);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

**AGREGAR en el JSX (al inicio del contenido principal):**
```jsx
{referralLink && (
  <div style={{
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    padding: "1.5rem",
    borderRadius: "1rem",
    border: "2px solid rgba(59, 130, 246, 0.2)",
    marginBottom: "2rem",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)"
  }}>
    <h3 style={{ 
      color: "#1e3a8a", 
      marginBottom: "1rem",
      fontSize: "1.25rem",
      fontWeight: "bold"
    }}>
      🔗 Tu Link de Referido
    </h3>
    <p style={{ 
      color: "#3b82f6", 
      fontSize: "0.875rem", 
      marginBottom: "1rem" 
    }}>
      Comparte este link para invitar a otras personas a unirse a tu red
    </p>
    <div style={{
      background: "white",
      padding: "1rem",
      borderRadius: "0.5rem",
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      flexWrap: "wrap"
    }}>
      <input
        type="text"
        value={referralLink}
        readOnly
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "0.5rem",
          border: "1px solid #ddd",
          borderRadius: "0.25rem",
          fontSize: "0.875rem",
          color: "#1e3a8a"
        }}
      />
      <button
        onClick={copyToClipboard}
        style={{
          background: copied ? "#10b981" : "#3b82f6",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "0.25rem",
          border: "none",
          cursor: "pointer",
          fontWeight: "500",
          transition: "all 0.3s"
        }}
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
      <button
        onClick={() => {
          const message = encodeURIComponent(`¡Únete a TEI! ${referralLink}`);
          window.open(`https://wa.me/?text=${message}`, '_blank');
        }}
        style={{
          background: "#25D366",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "0.25rem",
          border: "none",
          cursor: "pointer",
          fontWeight: "500"
        }}
      >
        📱 WhatsApp
      </button>
    </div>
  </div>
)}
```

---

## Paso 4: Probar el Sistema

### 4.1 Probar captura de referido

1. Abre: `http://localhost:5173/?ref=ANA-CDCF55`
2. Deberías ver: "Referido por: Ana Martinez"
3. Completa el pre-registro
4. Verifica en la base de datos que el `referred_by_id` apunta a Ana

### 4.2 Probar link de referido en dashboard

1. Abre: `http://localhost:5173/dashboard`
2. Deberías ver tu link de referido
3. Prueba el botón "Copiar"
4. Prueba el botón "WhatsApp"

---

## Resumen de Cambios

| Archivo | Cambios |
|---------|---------|
| `frontend/src/pages/Home.jsx` | Captura código de URL, muestra referidor, envía código al backend |
| `backend/routers/auth.py` | Endpoint `/auth/me` para obtener datos del usuario |
| `frontend/src/pages/dashboard/Overview.jsx` | Muestra link de referido con botones de copiar y WhatsApp |

---

## Comandos para Probar

```bash
# Ver usuarios y sus códigos
python ver_registros.py

# Activar usuario (genera código)
python ver_registros.py activar 6 100

# Probar link de referido
# Abre en navegador: http://localhost:5173/?ref=ANA-CDCF55
```

---

## Notas Importantes

1. **Endpoint `/auth/me`**: Actualmente retorna el último usuario activado para pruebas. En producción, deberías usar JWT para obtener el usuario actual.

2. **Seguridad**: El link de referido es público y puede ser compartido libremente.

3. **Validación**: El sistema verifica que el código de referido existe antes de mostrarlo.

4. **UX**: El mensaje "Referido por" solo aparece si hay un código válido en la URL.
