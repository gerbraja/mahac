import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MarketingBubbles = () => {
    const [bubbles, setBubbles] = useState([]);
    const [ws, setWs] = useState(null);

    // Fetch initial list
    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/marketing/recent-active');
                if (response.ok) {
                    const data = await response.json();
                    // Take only the last 5 for the bubbles display initially to avoid clutter, or show them sequentially
                    // For now, let's just show the most recent one if any, or a few.
                    // The requirement says "sale los ultimos 20 activos 1 a 1".
                    // Maybe we should show them one by one in a cycle if there are many?
                    // Or just show new ones as they come in, and maybe cycle through the list.
                    // Let's implement a queue system.
                    setBubbles(data.slice(0, 5)); // Initial load
                }
            } catch (error) {
                console.error("Error fetching recent active members:", error);
            }
        };

        fetchRecent();

        // WebSocket connection
        const socket = new WebSocket('ws://localhost:8000/ws/notificaciones');

        socket.onopen = () => {
            console.log('Connected to notifications WebSocket');
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_active_member') {
                    addBubble(message.data);
                }
            } catch (e) {
                console.error("Error parsing websocket message", e);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from notifications WebSocket');
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, []);

    const addBubble = (data) => {
        const newBubble = { ...data, id: Date.now() };
        setBubbles((prev) => [newBubble, ...prev].slice(0, 5)); // Keep max 5 visible

        // Auto remove after 5 seconds
        setTimeout(() => {
            setBubbles((prev) => prev.filter(b => b.id !== newBubble.id));
        }, 8000);
    };

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
            <AnimatePresence>
                {bubbles.map((bubble) => (
                    <motion.div
                        key={bubble.id || bubble.timestamp} // Fallback key
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/90 backdrop-blur-md border border-blue-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 min-w-[250px]"
                    >
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                            {bubble.country ? bubble.country.substring(0, 2).toUpperCase() : 'GL'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{bubble.name}</span>
                            <span className="text-xs text-blue-600">¡Nuevo Socio Activo! {bubble.country}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default MarketingBubbles;
