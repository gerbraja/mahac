import React, { useState, useEffect } from 'react';
import { api } from '../../../api/api';

const WithdrawalModal = ({ onClose, onWithdrawSuccess }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [paymentInfo, setPaymentInfo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('withdraw'); // 'release' or 'withdraw'
    const [kycVerified, setKycVerified] = useState(true); // Default true to avoid flash, will update

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/api/wallet/release-status');
            setStatus(res.data);
            setKycVerified(res.data.kyc_verified);
            // Default to release tab if funds available to release
            if (res.data.available_to_release > 0) {
                setActiveTab('release');
            }
        } catch (err) {
            console.error("Error fetching status", err);
            setError("Error cargando estado.");
        } finally {
            setLoading(false);
        }
    };

    const handleRelease = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await api.post('/api/wallet/release', { confirm: true });
            setSuccessMsg(res.data.message);
            fetchStatus(); // Refresh to update bank balance
            onWithdrawSuccess(); // Externally refresh wallet view too
        } catch (err) {
            setError(err.response?.data?.detail || "Error al liberar fondos.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;

        setSubmitting(true);
        setError(null);
        try {
            await api.post('/api/wallet/withdraw', {
                amount: parseFloat(amount),
                payment_info: paymentInfo
            });
            setSuccessMsg("Solicitud de retiro enviada exitosamente.");
            setAmount('');
            fetchStatus();
            onWithdrawSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Error al procesar retiro.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 bg-white rounded shadow text-center">Cargando...</div>;

    const canRelease = kycVerified && status?.available_to_release > 0;
    const canWithdraw = kycVerified && status?.bank_balance >= 50; // Min $50

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white flex justify-between items-center">
                    <h2 className="text-lg font-bold">Gestión de Fondos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('release')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'release' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        1. Liberar Ganancias
                    </button>
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'withdraw' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        2. Retirar al Banco
                    </button>
                </div>

                <div className="p-6">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
                    {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{successMsg}</div>}

                    {!kycVerified && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded mb-4 text-sm flex items-start">
                            <span className="mr-2 text-xl">⚠️</span>
                            <div>
                                <strong>Verificación Requerida:</strong><br />
                                Debes completar tu verificación KYC (Documento de Identidad) para liberar o retirar fondos.
                            </div>
                        </div>
                    )}

                    {activeTab === 'release' && (
                        <div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                                <p className="text-xs text-blue-800 uppercase font-bold mb-1">Estado del día ({status?.current_date})</p>
                                <p className="text-sm text-blue-900 mb-2">{status?.message}</p>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                    <span className="text-blue-700 text-sm">Disponible para liberar:</span>
                                    <span className="font-bold text-lg text-blue-900">${status?.available_to_release?.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleRelease}
                                disabled={!canRelease || submitting}
                                className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${canRelease
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                {submitting ? 'Procesando...' : 'Liberar Fondos al Banco Digital'}
                            </button>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                Los fondos liberados pasan a tu Saldo Bancario y quedan disponibles indefinidamente.
                            </p>
                        </div>
                    )}

                    {activeTab === 'withdraw' && (
                        <form onSubmit={handleWithdraw}>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4 text-center">
                                <p className="text-gray-500 text-xs uppercase">Tu Saldo Bancario Disponible</p>
                                <p className="text-2xl font-bold text-green-700">${status?.bank_balance?.toLocaleString()}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-xs font-bold mb-1">Monto a Retirar</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={status?.bank_balance}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Mínimo $50.00"
                                    disabled={!kycVerified}
                                />
                                <p className="text-xs text-gray-500 mt-1">Monto mínimo: $50.00 USD</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-xs font-bold mb-1">Datos Bancarios</label>
                                <textarea
                                    value={paymentInfo}
                                    onChange={(e) => setPaymentInfo(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    rows="2"
                                    placeholder="Banco, Cuenta, Nombre..."
                                    disabled={!kycVerified}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!canWithdraw || submitting}
                                className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${canWithdraw
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                {submitting ? 'Enviando...' : 'Solicitar Retiro Externo'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalModal;
