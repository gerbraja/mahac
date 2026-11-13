import React, { useState, useEffect } from 'react';
import { api } from '../../../api/api';

const PaymentRequestModal = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeRequest, setActiveRequest] = useState(null);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Poll for pending requests every 5 seconds
        const pollRequests = async () => {
            try {
                const res = await api.get('/api/wallet/pos/pending');
                if (res.data && res.data.length > 0) {
                    setPendingRequests(res.data);
                    if (!activeRequest) {
                        setActiveRequest(res.data[0]);
                    }
                } else {
                    setPendingRequests([]);
                    setActiveRequest(null);
                }
            } catch (e) {
                // Ignore silent polling errors
            }
        };

        pollRequests(); // initial load
        const interval = setInterval(pollRequests, 5000);
        return () => clearInterval(interval);
    }, [activeRequest]);

    const handleApprove = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post(`/api/wallet/pos/approve/${activeRequest.id}`, { pin });
            setMessage('✅ Pago enviado exitosamente.');
            setTimeout(() => {
                setPin('');
                setMessage('');
                setActiveRequest(null);
            }, 2500);
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.detail || 'Clave o saldo inválido.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            await api.post(`/api/wallet/pos/reject/${activeRequest.id}`);
            setActiveRequest(null);
            setPin('');
            setMessage('');
        } catch (error) {
            console.error("Error rejecting", error);
        } finally {
            setLoading(false);
        }
    };

    if (!activeRequest) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up border-4 border-blue-500">
                <div className="bg-blue-600 p-4 text-center text-white">
                    <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl animate-bounce">
                        🔔
                    </div>
                    <h2 className="text-xl font-bold">Solicitud de Cobro</h2>
                    <p className="text-blue-100 text-sm">Un comercio está esperando tu pago</p>
                </div>

                <div className="p-6">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center mb-6">
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">Comercio / Taxi</p>
                        <p className="text-lg font-bold text-gray-800">{activeRequest.merchant_name}</p>
                        
                        <div className="my-4 border-t border-gray-200"></div>
                        
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">Total a Pagar</p>
                        <p className="text-4xl font-black text-blue-600">${activeRequest.amount} <span className="text-lg">USD</span></p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm mb-4 font-bold text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleApprove}>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
                                Digita tu Clave de Transacciones (PIN)
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none text-center text-xl tracking-widest font-mono"
                                placeholder="******"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={loading}
                                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                            >
                                Rechazar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !pin}
                                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Pagar Ahora'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentRequestModal;
