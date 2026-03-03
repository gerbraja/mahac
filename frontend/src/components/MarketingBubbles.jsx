import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MarketingBubbles = () => {
    const [currentBubble, setCurrentBubble] = useState(null);
    const queueRef = useRef([]);
    const [ws, setWs] = useState(null);
    const apiBase = import.meta.env.VITE_API_BASE || 'https://mlm-backend-s52yictoyq-rj.a.run.app';


    // Fetch initial list
    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await fetch(`${apiBase}/api/marketing/recent-active`);
                if (response.ok) {
                    const data = await response.json();
                    // Add to queue
                    queueRef.current = [...queueRef.current, ...data];
                }
            } catch (error) {
                console.error("Error fetching recent active members:", error);
            }
        };

        fetchRecent();

        // WebSocket connection
        // Convert http/https to ws/wss
        const wsProtocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
        const wsUrl = apiBase.replace(/^http(s?):/, wsProtocol);

        console.log(`Attempting to connect to WebSocket at: ${wsUrl}/ws/notificaciones`);

        let socket;
        try {
            socket = new WebSocket(`${wsUrl}/ws/notificaciones`);
        } catch (e) {
            console.error("Failed to create WebSocket:", e);
            return;
        }

        socket.onopen = () => {
            console.log('Connected to notifications WebSocket');
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_pre_affiliate' || message.type === 'new_active_member') {
                    // Add to front of queue for immediate attention
                    queueRef.current = [message.data, ...queueRef.current];
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
            if (socket) {
                socket.close();
            }
        };
    }, []);

    // Process queue
    useEffect(() => {
        const interval = setInterval(() => {
            if (!currentBubble && queueRef.current.length > 0) {
                const nextBubble = queueRef.current.shift();
                setCurrentBubble({ ...nextBubble, id: Date.now() });

                // Remove after 3 seconds
                setTimeout(() => {
                    setCurrentBubble(null);
                }, 3000);
            }
        }, 1000); // Check queue every second

        return () => clearInterval(interval);
    }, [currentBubble]);

    return (
        <div className="fixed top-24 right-4 flex flex-col gap-2 z-50 pointer-events-none">
            <AnimatePresence>
                {currentBubble && (
                    <motion.div
                        key={currentBubble.id}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/95 backdrop-blur-md border-l-4 border-blue-600 shadow-2xl rounded-lg px-4 py-2 flex items-center gap-3 min-w-[200px]"
                    >
                        <div className="text-2xl flex items-center justify-center">
                            {currentBubble.flag_emoji || '🌍'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800">{currentBubble.name}</span>
                            <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">
                                ¡Nuevo Pre-Afiliado!
                            </span>
                            <span className="text-[10px] text-gray-600 font-medium mt-0.5">
                                📍 {currentBubble.country || 'Global'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketingBubbles;
