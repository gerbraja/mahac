import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegistroNotifications() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || 'https://mlm-backend-s52yictoyq-rj.a.run.app';
    const wsProtocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
    const wsUrl = apiBase.replace(/^http(s?):/, wsProtocol);
    const socket = new WebSocket(`${wsUrl}/ws/notificaciones`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const id = Date.now() + Math.random();

      setNotificaciones((prev) => [{ id, ...data }, ...prev]);

      // Automatically delete after 10 seconds
      setTimeout(() => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      }, 10000);
    };

    socket.onopen = () => console.log('WebSocket connected');
    socket.onclose = () => console.log('WebSocket closed');

    return () => socket.close();
  }, []);

  // Extract first name and first surname
  const getShortName = (fullName) => {
    if (!fullName) return 'Nuevo Usuario';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0] || 'Nuevo Usuario';
  };

  // Get country code for flag
  const getCountryCode = (country) => {
    if (!country) return 'co'; // Default to Colombia
    const countryMap = {
      'colombia': 'co',
      'méxico': 'mx',
      'mexico': 'mx',
      'españa': 'es',
      'espana': 'es',
      'argentina': 'ar',
      'chile': 'cl',
      'perú': 'pe',
      'peru': 'pe',
      'venezuela': 've',
      'ecuador': 'ec',
      'bolivia': 'bo',
      'paraguay': 'py',
      'uruguay': 'uy',
      'costa rica': 'cr',
      'panamá': 'pa',
      'panama': 'pa',
      'guatemala': 'gt',
      'honduras': 'hn',
      'el salvador': 'sv',
      'nicaragua': 'ni',
      'república dominicana': 'do',
      'dominicana': 'do',
      'puerto rico': 'pr',
      'cuba': 'cu',
    };
    return countryMap[country.toLowerCase()] || 'co';
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AnimatePresence>
        {notificaciones.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 320,
              maxWidth: 400,
              borderRadius: 20,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden', // Ensure background image doesn't spill out
              background: '#1a1a1a', // Fallback color
            }}
          >
            {/* Background Image Layer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(https://flagcdn.com/w640/${getCountryCode(n.user?.country)}.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.4)', // Darken image for readability
              zIndex: 0
            }} />

            {/* Gradient Overlay for extra readability */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.4))',
              zIndex: 1
            }} />

            {/* Content Container (z-index ensure it's above background) */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Flag Circle - Kept as requested by "flag of each country" but integrated harmoniously */}
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                flexShrink: 0,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={`https://flagcdn.com/w80/${getCountryCode(n.user?.country)}.png`}
                  alt={n.user?.country || 'flag'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://flagcdn.com/w80/co.png';
                  }}
                />
              </div>

              {/* Text Content */}
              <div style={{ flex: 1, color: 'white' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 4,
                  opacity: 0.9,
                  color: '#ffd700'
                }}>
                  🎉 {n.event === 'activacion' ? 'Nuevo Afiliado' : 'Nuevo Registro'}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)' // Stronger shadow
                }}>
                  {getShortName(n.user?.name)}
                </div>
                <div style={{
                  fontSize: 12,
                  opacity: 0.95,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>📍</span>
                  <span>{n.user?.city || ''}{n.user?.city && n.user?.country ? ', ' : ''}{n.user?.country || ''}</span>
                </div>
              </div>
            </div>

            {/* Pulse Animation */}
            <div style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#ffd700',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 10px #ffd700',
              zIndex: 3
            }} />
          </motion.div>
        ))}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
