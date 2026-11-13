import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";

// Global handler for dynamic import (chunk) failures
const handleChunkError = (err) => {
    const msg = (err && (err.message || err.toString())) || "";
    if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module") ||
        msg.includes("Loading chunk") ||
        msg.includes("Unexpected token '<'") ||
        msg.includes("Maximum call stack")
    ) {
        const lastReload = sessionStorage.getItem("tei_chunk_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
            sessionStorage.setItem("tei_chunk_reload", now.toString());
            console.warn("🔄 Dynamic import / chunk failure detected. Clearing cache and refreshing app...");
            if ("caches" in window) {
                caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
                    .catch(() => {})
                    .finally(() => {
                        window.location.reload();
                    });
            } else {
                window.location.reload();
            }
        }
    }
};

window.addEventListener("vite:preloadError", (event) => {
    console.warn("Vite chunk preload error detected. Reloading page...");
    event.preventDefault();
    handleChunkError(new Error("Failed to fetch dynamically imported module"));
});

window.addEventListener("unhandledrejection", (event) => {
    if (event.reason) {
        handleChunkError(event.reason);
    }
});

window.addEventListener("error", (e) => {
    if (e.message) {
        handleChunkError(e.message);
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
