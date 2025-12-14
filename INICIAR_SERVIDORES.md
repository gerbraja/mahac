# Instrucciones para Iniciar Frontend y Backend Local

## 🚀 Pasos para Ver las Matrices en el Frontend

### 1. Iniciar el Backend (Terminal 1)

Desde la carpeta `backend/`:

```powershell
cd backend
uvicorn main:app --reload --port 8000
```

Deberías ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

### 2. Iniciar el Frontend (Terminal 2)

Desde la carpeta `frontend/`:

```powershell
cd frontend
npm run dev
```

Deberías ver:
```
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

---

### 3. Acceder a las Matrices

Abre tu navegador en:
```
http://localhost:5173/dashboard/matrix
```

**Resultado esperado:**
- MATRIX CONSUMIDOR
- Progreso: **3 / 12 posiciones**
- Nivel 2: 2/3 llenos
- Nivel 3: 1/9 llenos

---

## ⚠️ Solución de Problemas

### Si el backend no inicia:
```powershell
# Desde la raíz del proyecto
cd c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Si el frontend no inicia:
```powershell
# Desde la raíz del proyecto
cd c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
cd frontend
npm install  # Solo si faltan dependencias
npm run dev
```

---

## 📊 Verificar que todo funcione

Una vez iniciados ambos servidores:

1. **Backend:** Visita http://localhost:8000/
   - Deberías ver: `{"message":"Welcome to the TEI Shopping Center Backend 🚀"}`

2. **Frontend:** Visita http://localhost:5173/
   - Deberías ver la página de inicio

3. **Login:** Inicia sesión con usuario `admin`

4. **Matrices:** Ve a Dashboard → Matrices
   - Deberías ver las 4 matrices con progreso real
