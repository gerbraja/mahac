import React, { useState } from 'react';
import { api } from '../../../api/api';

const COP_RATE = 4500;
const MIN_TRANSFER_USD = 3.0;
const MAX_DAILY_TRANSFER_USD = 600.0; // $2.700.000 COP

const calculateSystemFeeUsd = (amountUsd) => {
    const val = parseFloat(amountUsd);
    if (!val || isNaN(val) || val <= 0) return 0.0;
    const cop = Math.round(val * COP_RATE);
    if (cop > 2000000) return 2.20;
    if (cop > 1200000) return 1.10;
    if (cop > 200000) return 0.50;
    return 0.0;
};

const TransferModal = ({ isOpen, onClose, onTransferSuccess, balance }) => {
    const [step, setStep] = useState(1);
    const [recipientIdentifier, setRecipientIdentifier] = useState('');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await api.get(`/api/wallet/lookup_user?query=${recipientIdentifier}`);
            setTargetUser(res.data);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || "Usuario no encontrado.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setError(null);
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount < MIN_TRANSFER_USD) {
            setError("El monto mínimo para transferir es de $3.00 USD ($13.500 COP).");
            return;
        }
        if (parsedAmount > MAX_DAILY_TRANSFER_USD) {
            setError("El límite máximo diario entre usuarios es de $600.00 USD ($2.700.000 COP).");
            return;
        }
        const feeUsd = calculateSystemFeeUsd(parsedAmount);
        const totalRequired = Number((parsedAmount + feeUsd).toFixed(2));
        if (totalRequired > Number(balance || 0)) {
            setError(`Saldo insuficiente para cubrir el monto ($${parsedAmount.toFixed(2)} USD) más la tarifa de uso del sistema (+$${feeUsd.toFixed(2)} USD). Total requerido: $${totalRequired.toFixed(2)} USD.`);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/wallet/transfer', {
                recipient_identifier: targetUser.username,
                amount: parsedAmount,
                pin: pin
            });
            setSuccessMsg(res.data?.message || "¡Transferencia enviada con éxito!");
            setTimeout(() => {
                onTransferSuccess();
                handleClose();
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al procesar la transferencia.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setRecipientIdentifier('');
        setAmount('');
        setPin('');
        setTargetUser(null);
        setError(null);
        setSuccessMsg(null);
        onClose();
    };

    if (!isOpen) return null;

    const parsedAmount = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;
    const approxCop = parsedAmount > 0 ? Math.round(parsedAmount * COP_RATE) : 0;
    const systemFeeUsd = calculateSystemFeeUsd(parsedAmount);
    const totalDeductUsd = Number((parsedAmount + systemFeeUsd).toFixed(2));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-up">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-5 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Transferir Saldo</h2>
                        <p className="text-sm opacity-90">Envía dinero a otros usuarios (Máx. $600 USD / día)</p>
                    </div>
                    <button onClick={handleClose} className="text-white hover:bg-white/20 p-2 rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    {successMsg ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                ✓
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{successMsg}</h3>
                            <p className="text-gray-500">El dinero ya está en la cuenta del destinatario.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 text-center">
                                <p className="text-gray-500 text-xs uppercase">Tu Saldo Disponible</p>
                                <p className="text-2xl font-bold text-gray-800">${balance?.toLocaleString() || '0.00'} USD</p>
                                <p className="text-[11px] text-purple-700 mt-1 font-medium">
                                    Tope máximo diario: $600.00 USD ($2.700.000 COP)
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center">
                                    <span className="mr-2">⚠️</span> {error}
                                </div>
                            )}

                            {step === 1 && (
                                <form onSubmit={handleLookup}>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Destinatario</label>
                                        <input
                                            type="text"
                                            value={recipientIdentifier}
                                            onChange={(e) => setRecipientIdentifier(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Ingresa ID o Username"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Buscaremos al usuario para que confirmes antes de enviar.</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !recipientIdentifier}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Buscando...' : 'Siguiente'}
                                    </button>
                                </form>
                            )}

                            {step === 2 && targetUser && (
                                <form onSubmit={handleTransfer}>
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xl">
                                            {targetUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-500 font-bold uppercase">Enviar a:</p>
                                            <p className="font-bold text-gray-800">{targetUser.name}</p>
                                            <p className="text-xs text-gray-500">@{targetUser.username}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Monto a Enviar (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="3"
                                            max={Math.min(balance || 0, MAX_DAILY_TRANSFER_USD)}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Mínimo $3.00 USD — Máx. $600.00 USD"
                                            required
                                        />
                                        <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-500">Mín: $3.00 USD · Máx: $600.00 USD</span>
                                            {amount && (
                                                <span className="font-bold text-purple-700">
                                                    Equivalente aprox: {formatCurrency(approxCop)} COP
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span>Tarifa de uso del sistema:</span>
                                                <span className={`font-bold ${systemFeeUsd > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                    {systemFeeUsd > 0
                                                        ? `+$${systemFeeUsd.toFixed(2)} USD (${formatCurrency(systemFeeUsd * COP_RATE)})`
                                                        : '$0.00 USD (Gratis hasta $200.000 COP)'}
                                                </span>
                                            </div>
                                            {parsedAmount > 0 && (
                                                <div className="flex justify-between items-center pt-1 border-t border-purple-200 font-bold text-purple-950">
                                                    <span>Total a descontar:</span>
                                                    <span>${totalDeductUsd.toFixed(2)} USD</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-gray-700 text-sm font-bold">Segunda Clave (Clave de Transacciones)</label>
                                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                                Máx. 3 intentos (24h)
                                            </span>
                                        </div>
                                        <input
                                            type="password"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none tracking-widest font-mono"
                                            placeholder="Ingresa tu Segunda Clave"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition-colors"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !amount || parseFloat(amount) < 3 || !pin || totalDeductUsd > balance}
                                            className="w-2/3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-3 rounded-lg transition-all shadow-md disabled:opacity-50"
                                        >
                                            {loading ? 'Procesando...' : 'Confirmar Envío'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
