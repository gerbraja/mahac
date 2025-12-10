import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegistroNotifications() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/notificaciones');

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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 20,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              minWidth: 320,
              maxWidth: 400,
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4), 0 0 20px rgba(118, 75, 162, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              position: 'relative'
            }}
          >
            {/* Country Flag Circle */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              flexShrink: 0,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={`https://flagcdn.com/w80/${getCountryCode(n.user?.country)}.png`}
                alt={n.user?.country || 'flag'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://flagcdn.com/w80/co.png'; // Fallback to Colombia
                }}
              />
            </div>

            {/* Content */}
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
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
              boxShadow: '0 0 10px #ffd700'
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
