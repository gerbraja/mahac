import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, PlusSquare, Smartphone } from "lucide-react";

function getPwaContext(pathname) {
  if (pathname.startsWith("/transport/driver")) {
    return {
      key: "driver",
      manifestHref: "/manifest-driver.json",
      storageKey: "tei_pwa_dismissed_driver",
      appTitle: "TEI Conductor",
      pageTitle: "TEI Conductor",
      heading: "Instalar TEI Conductor",
      subtitle: "Recibe alertas de viajes más rápido y trabaja a pantalla completa.",
      description:
        "Instala la app ligera de TEI Conductor en tu pantalla de inicio para recibir carreras al instante sin abrir el navegador.",
    };
  }
  if (pathname.startsWith("/transport/passenger")) {
    return {
      key: "passenger",
      manifestHref: "/manifest-passenger.json",
      storageKey: "tei_pwa_dismissed_passenger",
      appTitle: "TEI Pasajero",
      pageTitle: "TEI Pasajero",
      heading: "Instalar TEI Pasajero",
      subtitle: "Pide viajes en segundos desde tu pantalla de inicio.",
      description:
        "Instala la app ligera de TEI Pasajero en tu celular para solicitar transporte de forma rápida y a pantalla completa.",
    };
  }
  return {
    key: "tei",
    manifestHref: "/manifest.json",
    storageKey: "tei_pwa_dismissed",
    appTitle: "TEI",
    pageTitle: "Centro Comercial TEI",
    heading: "Instalar App de TEI",
    subtitle: "Acceso más rápido y mejor experiencia móvil.",
    description:
      "Instala la app directamente en tu pantalla de inicio para navegar de forma fluida y a pantalla completa.",
  };
}

export default function PwaInstallPrompt() {
  const location = useLocation();
  const pwaContext = getPwaContext(location.pathname);

  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState(""); // 'ios', 'android', or ''
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Keep manifest, apple-mobile-web-app-title and document title synced on SPA navigation
  useEffect(() => {
    const manifestLink = document.getElementById("pwa-manifest");
    if (manifestLink && manifestLink.getAttribute("href") !== pwaContext.manifestHref) {
      manifestLink.setAttribute("href", pwaContext.manifestHref);
    }
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.setAttribute("content", pwaContext.appTitle);
    }
    if (pwaContext.key !== "tei") {
      document.title = pwaContext.pageTitle;
    }
  }, [pwaContext.key, pwaContext.manifestHref, pwaContext.appTitle, pwaContext.pageTitle]);

  // 1. Detect platform and capture the browser prompt event
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    if (isIOS) {
      setPlatform("ios");
    } else {
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setPlatform("android");
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  // 2. Automated pop-up trigger on page load / route change (if not dismissed or already installed)
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Check if dismissed in last 7 days for this specific app context
    try {
      const dismissedTime = localStorage.getItem(pwaContext.storageKey);
      if (dismissedTime) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissedTime, 10) < sevenDays) {
          setIsVisible(false);
          return;
        }
      }
    } catch (e) {
      console.warn("[PWA] Error reading localStorage:", e);
    }

    // Auto show prompt after 2.5 seconds
    const timer = setTimeout(() => {
      // Only auto-show if we have detected iOS or Android with install capability
      if (platform === "ios" || (platform === "android" && deferredPrompt)) {
        setIsVisible(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [platform, deferredPrompt, pwaContext.storageKey]);

  // 3. Listen to manual trigger event (e.g. from buttons on different pages)
  useEffect(() => {
    const handleTriggerInstall = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      if (isStandalone) {
        alert(`¡La aplicación ${pwaContext.appTitle} ya está instalada en tu dispositivo!`);
        return;
      }

      setIsVisible(true);

      // Directly trigger native prompt on Android/Chrome if ready
      if (platform === "android" && deferredPrompt) {
        deferredPrompt.prompt();
      }
    };

    window.addEventListener("trigger-pwa-install", handleTriggerInstall);
    return () => {
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, [platform, deferredPrompt, pwaContext.appTitle]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If we don't have the event yet but user clicked, show fallback message
      alert("Para instalar la App, por favor usa el menú de opciones de tu navegador y selecciona 'Instalar' o 'Agregar a la pantalla de inicio'.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(pwaContext.storageKey, Date.now().toString());
    } catch (e) {
      console.warn("[PWA] Error writing localStorage:", e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="backdrop-blur-lg bg-slate-900/95 border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-5 text-white flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800/80 p-1.5 rounded-full transition-all duration-200"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/30 text-blue-400">
              <Smartphone size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-white tracking-wide font-sans">
                {pwaContext.heading}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                {pwaContext.subtitle}
              </p>
            </div>
          </div>

          {/* Body Content based on Platform */}
          {platform === "ios" ? (
            <div className="text-sm text-slate-300 font-sans flex flex-col gap-3 pr-2">
              <p className="leading-relaxed">
                Disfruta de una experiencia de aplicación completa en tu iPhone siguiendo estos pasos:
              </p>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                    1
                  </span>
                  <span>
                    Presiona el botón de <strong>Compartir</strong>
                  </span>
                  <div className="p-1.5 bg-slate-800 rounded border border-slate-700 text-blue-400 flex items-center justify-center">
                    <Share size={14} />
                  </div>
                  <span>en la barra de Safari.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                    2
                  </span>
                  <span>
                    Selecciona <strong>Agregar a la pantalla de inicio</strong>
                  </span>
                  <div className="p-1.5 bg-slate-800 rounded border border-slate-700 text-emerald-400 flex items-center justify-center">
                    <PlusSquare size={14} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-300 font-sans flex flex-col gap-3">
              <p className="leading-relaxed">
                {pwaContext.description}
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-1"
              >
                <Download size={16} />
                Instalar Ahora
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
