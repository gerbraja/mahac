# Frontend (Next.js) — Desarrollo local y conexión al backend

Este proyecto contiene un frontend basado en Next.js (o similar) que se integra con el backend FastAPI.

Variables de entorno

- NEXT_PUBLIC_API_BASE: URL base del backend que utilizará el frontend en desarrollo (p. ej. `http://localhost:8000`).
  - En Next.js las variables que comienzan con `NEXT_PUBLIC_` son expuestas al cliente.
  - Ejemplo `.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

- Alternativa: el proyecto también soporta `REACT_APP_API_BASE` si usas create-react-app o setups que usan esa convención.

Archivos importantes

- `frontend/src/api/api.js` — helper de API centralizado. Usa `process.env.NEXT_PUBLIC_API_BASE` si está definida, si no usa `REACT_APP_API_BASE`, y como fallback `http://127.0.0.1:8000`.
- `frontend/src/components/` — componentes UI (p. ej. `honor`, `ranks`, `orders`, `ProductList.jsx`).

Arrancar localmente (PowerShell)

1. Instalar dependencias del frontend:

```powershell
cd miweb\CentroComercialTEI\frontend
npm install
# o
pnpm install
# o
yarn install
```

2. Asegúrate de que el backend esté corriendo (ver sección siguiente).

3. Inicia el servidor de desarrollo:

```powershell
npm run dev
# o
pnpm dev
# o
yarn dev
```

Verificar la integración

- Con `NEXT_PUBLIC_API_BASE=http://localhost:8000` configurado, el frontend hará peticiones a `http://localhost:8000/api/...`.
- Abre el navegador en `http://localhost:3000` (o puerto que Next.js te indique). Revisa la consola del navegador para errores CORS o de red.
- Verifica manualmente un endpoint desde el navegador o curl, por ejemplo:

```powershell
# desde PowerShell, comprobar lista de productos
curl http://localhost:8000/api/products
```

Configurar CORS en backend (recordatorio)

- El backend ya incluye orígenes de desarrollo por defecto (`localhost:3000`, `localhost:5173`) y admite añadir uno extra con la variable de entorno `FRONTEND_ORIGIN`.
- También añade el valor de `NEXT_PUBLIC_API_BASE` si se exporta en el entorno del backend (útil en contenedores o CI).

Solución de problemas

- Si ves `CORS` errors en la consola del navegador:
  - Asegúrate de que la URL de origen (p. ej. `http://localhost:3000`) esté en la lista de `FRONTEND_ORIGINS` del backend.
  - Reinicia el backend si cambiaste variables de entorno.

- Si las llamadas fallan con 401/403, revisa los headers de autorización y que tu token sea válido.

Más pasos

- Para producción, configura las variables de entorno del hosting (Vercel/Netlify) y del backend (Heroku/DigitalOcean/App Service) según tu despliegue.
- Para seguridad, restringe `allow_origins` a los dominios de producción en el backend y añade HTTPS.

