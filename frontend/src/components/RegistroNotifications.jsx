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

      // Automatically delete after 5 seconds
      setTimeout(() => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    };

    socket.onopen = () => console.log('WebSocket connected');
    socket.onclose = () => console.log('WebSocket closed');

    return () => socket.close();
  }, []);

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
      <AnimatePresence>
        {notificaciones.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.4 }}
            style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center', minWidth: 260 }}
          >
            {n.user && (
              <img src={`https://flagcdn.com/24x18/${(n.user.country || '').toLowerCase().slice(0, 2)}.png`} alt="flag" style={{ width: 24, height: 18 }} onError={(e) => { e.target.style.display = 'none' }} />
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{n.user?.name || 'Nuevo usuario'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{n.user?.city || ''}{n.user?.country ? `, ${n.user.country}` : ''} — {n.event === 'activacion' ? 'Activación' : 'Registro'}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
