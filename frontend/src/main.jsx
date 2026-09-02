import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";

// Global handler for dynamic import (chunk) failures
window.addEventListener("vite:preloadError", (event) => {
    console.warn("Vite chunk preload error detected. Reloading page...");
    window.location.reload();
});

// Fallback for Safari syntax errors caused by returning HTML instead of JS
window.addEventListener("error", (e) => {
    if (e.message && (e.message.includes("Maximum call stack") || e.message.includes("Unexpected token '<'") || e.message.includes("SyntaxError"))) {
        const lastReload = sessionStorage.getItem("tei_error_reload");
        if (!lastReload || (Date.now() - parseInt(lastReload)) > 10000) {
            sessionStorage.setItem("tei_error_reload", Date.now().toString());
            console.warn("Critical JS syntax or stack error detected. Forcing cache reload...");
            // Force reload bypassing cache
            window.location.reload(true);
        }
    }
});

console.log("🚀 [MAIN] Application starting mount process...");
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <CartProvider>
                <App />
            </CartProvider>
        </BrowserRouter>
    </React.StrictMode>
);

// Register PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("🚀 [PWA] Service Worker registrado con éxito: ", registration.scope);
      })
      .catch((error) => {
        console.error("❌ [PWA] Error al registrar el Service Worker: ", error);
      });
  });
}
