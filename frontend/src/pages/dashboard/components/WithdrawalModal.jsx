import React, { useState, useEffect } from 'react';
import { api } from '../../../api/api';

const COP_RATE = 4500;
const MIN_WITHDRAW_USD = 11.0;
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

const calculateMaxUsableUsd = (availableUsd, capUsd = Infinity) => {
    const bal = Math.max(0, Number(availableUsd) || 0);
    if (bal <= 0) return 0;
    let candidate = Math.min(bal, capUsd);
    const feeAtCandidate = calculateSystemFeeUsd(candidate);
    if ( Number((candidate + feeAtCandidate).toFixed(2)) <= Number(bal.toFixed(2)) ) {
        return Math.floor(candidate * 100) / 100;
    }
    candidate = Math.min(capUsd, Math.max(0, bal - feeAtCandidate));
    return Math.floor(candidate * 100) / 100;
};

const WithdrawalModal = ({ onClose, onWithdrawSuccess, initialTab = 'withdraw' }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab); // 'withdraw' | 'transfer' | 'release'
    const [kycVerified, setKycVerified] = useState(true);

    // Bank Withdrawal states
    const [amount, setAmount] = useState('');
    const [paymentInfo, setPaymentInfo] = useState('');
    const [transactionPin, setTransactionPin] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // P2P Transfer states (Transferencia entre usuarios TEI)
    const [transferStep, setTransferStep] = useState(1);
    const [recipientQuery, setRecipientQuery] = useState('');
    const [targetUser, setTargetUser] = useState(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferPin, setTransferPin] = useState('');
    const [lookingUp, setLookingUp] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/api/wallet/release-status');
            setStatus(res.data);
            setKycVerified(res.data.kyc_verified);

            if (res.data.verified_bank_name && res.data.verified_bank_account_number) {
                const infoStr = `Banco: ${res.data.verified_bank_name} | Cuenta: ${res.data.verified_bank_account_type || 'Ahorros'} No. ${res.data.verified_bank_account_number}`;
                setPaymentInfo(infoStr);
            }
        } catch (err) {
            console.error("Error fetching status", err);
            setError("Error cargando estado de billetera.");
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        setError(null);
        setSuccessMsg(null);
    };

    const handleRelease = async () => {
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await api.post('/api/wallet/release', { confirm: true });
            setSuccessMsg(res.data.message);
            fetchStatus();
            onWithdrawSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Error al liberar fondos.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            setError("Ingresa un monto válido.");
            return;
        }
        if (parsedAmount < MIN_WITHDRAW_USD) {
            setError(`El monto mínimo para retirar a Banco Personal es de $${MIN_WITHDRAW_USD.toFixed(2)} USD ($${(MIN_WITHDRAW_USD * COP_RATE).toLocaleString('es-CO')} COP).`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/api/wallet/withdraw', {
                amount: parsedAmount,
                payment_info: paymentInfo,
                pin: transactionPin
            });
            setSuccessMsg(res.data?.message || "Solicitud de retiro enviada exitosamente.");
            setAmount('');
            setTransactionPin('');
            fetchStatus();
            onWithdrawSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Error al procesar retiro.");
            fetchStatus();
        } finally {
            setSubmitting(false);
        }
    };

    const handleLookupUser = async (e) => {
        e.preventDefault();
        if (!recipientQuery.trim()) return;
        setError(null);
        setSuccessMsg(null);
        setLookingUp(true);
        try {
            const res = await api.get(`/api/wallet/lookup_user?query=${encodeURIComponent(recipientQuery.trim())}`);
            setTargetUser(res.data);
            setTransferStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || "Usuario no encontrado.");
        } finally {
            setLookingUp(false);
        }
    };

    const handleTransferP2P = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        const parsedTransfer = parseFloat(transferAmount);
        if (!parsedTransfer || parsedTransfer <= 0) {
            setError("Ingresa un monto válido para transferir.");
            return;
        }
        if (parsedTransfer < MIN_TRANSFER_USD) {
            setError(`El monto mínimo para transferencia entre usuarios de la plataforma es de $${MIN_TRANSFER_USD.toFixed(2)} USD ($${(MIN_TRANSFER_USD * COP_RATE).toLocaleString('es-CO')} COP).`);
            return;
        }
        if (parsedTransfer > MAX_DAILY_TRANSFER_USD) {
            setError(`El límite máximo diario para transferencias entre usuarios es de $${MAX_DAILY_TRANSFER_USD.toFixed(2)} USD ($2.700.000 COP).`);
            return;
        }

        const fee = calculateSystemFeeUsd(parsedTransfer);
        const totalNeeded = Number((parsedTransfer + fee).toFixed(2));
        const avail = Number(status?.transferable_balance ?? status?.bank_balance ?? 0);
        if (totalNeeded > avail) {
            setError(`Saldo insuficiente para cubrir el monto ($${parsedTransfer.toFixed(2)} USD) más la tarifa de uso del sistema (+$${fee.toFixed(2)} USD). Total requerido: $${totalNeeded.toFixed(2)} USD.`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/api/wallet/transfer', {
                recipient_identifier: targetUser.username,
                amount: parsedTransfer,
                pin: transferPin
            });
            setSuccessMsg(res.data?.message || `¡Transferencia de $${parsedTransfer.toFixed(2)} USD a @${targetUser.username} completada con éxito!`);
            setTransferAmount('');
            setTransferPin('');
            setTransferStep(1);
            setTargetUser(null);
            setRecipientQuery('');
            fetchStatus();
            onWithdrawSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Error al procesar la transferencia.");
            fetchStatus();
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="p-8 bg-white rounded-2xl shadow-xl text-center font-medium text-gray-600">
                    Cargando información del Banco TEI...
                </div>
            </div>
        );
    }

    const bankBalance = Number(status?.bank_balance ?? status?.verified_balance ?? 0);
    const transferableBalance = Number(status?.transferable_balance ?? bankBalance ?? 0);
    const remainingDailyTransferUsd = Number(status?.remaining_daily_transfer_usd ?? MAX_DAILY_TRANSFER_USD);
    const maxWithdrawNetUsd = calculateMaxUsableUsd(bankBalance);
    const maxTransferNetUsd = calculateMaxUsableUsd(transferableBalance, remainingDailyTransferUsd);

    const canRelease = kycVerified && (status?.available_to_release || 0) > 0;
    const canWithdraw = kycVerified && bankBalance >= MIN_WITHDRAW_USD;
    const canTransfer = transferableBalance >= MIN_TRANSFER_USD && remainingDailyTransferUsd >= MIN_TRANSFER_USD;

    const parsedWithdrawAmount = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;
    const withdrawFeeUsd = calculateSystemFeeUsd(parsedWithdrawAmount);
    const withdrawTotalDeductUsd = Number((parsedWithdrawAmount + withdrawFeeUsd).toFixed(2));
    const withdrawCopEquivalent = parsedWithdrawAmount > 0
        ? Math.round(parsedWithdrawAmount * COP_RATE)
        : 0;

    const parsedTransferAmount = transferAmount && !isNaN(parseFloat(transferAmount)) ? parseFloat(transferAmount) : 0;
    const transferFeeUsd = calculateSystemFeeUsd(parsedTransferAmount);
    const transferTotalDeductUsd = Number((parsedTransferAmount + transferFeeUsd).toFixed(2));
    const transferCopEquivalent = parsedTransferAmount > 0
        ? Math.round(parsedTransferAmount * COP_RATE)
        : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            🏦 Banco TEI — Retiros y Transferencias
                        </h2>
                        <p className="text-xs text-slate-300">
                            Seguridad protegida con Segunda Clave de Transacciones
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-lg px-2">✕</button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => switchTab('withdraw')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'withdraw'
                                ? 'text-green-700 border-b-2 border-green-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        🏦 Banco Personal
                        <span className="block text-[10px] font-normal text-gray-500">Desde $11 USD</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab('transfer')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'transfer'
                                ? 'text-purple-700 border-b-2 border-purple-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        🤝 Entre Usuarios TEI
                        <span className="block text-[10px] font-normal text-gray-500">Desde $3 USD</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab('release')}
                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'release'
                                ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        🔓 Liberar Corte
                        <span className="block text-[10px] font-normal text-gray-500">Días 11 · 21 · 01</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-xs sm:text-sm font-medium flex items-start gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4 text-xs sm:text-sm font-medium flex items-start gap-2">
                            <span>✅</span>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Bloqueo de 24 horas por 3 intentos fallidos de Segunda Clave */}
                    {status?.is_pin_locked && (activeTab === 'withdraw' || activeTab === 'transfer') ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-xl text-center mb-4">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                                🔒
                            </div>
                            <h4 className="font-bold text-rose-900 text-sm mb-1">Operaciones Bloqueadas por 24 Horas</h4>
                            <p className="text-xs text-rose-700 mb-3">
                                Has superado los 3 intentos fallidos de tu Segunda Clave. Por seguridad de tus fondos, los retiros y transferencias están suspendidos por 24 horas.
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 rounded-full text-xs font-semibold text-rose-800 shadow-sm">
                                <span>⏱️ Tiempo restante: aprox. {status?.pin_locked_hours || 24} hora(s)</span>
                            </div>
                        </div>
                    ) : null}

                    {/* TAB 1: RETIRO A BANCO PERSONAL (DESDE $11 USD / $49.500 COP) */}
                    {activeTab === 'withdraw' && !status?.is_pin_locked && (
                        <div>
                            {!kycVerified && (
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <div>
                                        <strong>Verificación KYC Requerida:</strong><br />
                                        Debes tener tu verificación de identidad y cuenta bancaria aprobada para retirar fondos hacia tu Banco Personal.
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleWithdraw}>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-4 text-center">
                                    <p className="text-gray-500 text-xs uppercase font-semibold">Saldo Disponible en Banco TEI</p>
                                    <p className="text-3xl font-extrabold text-green-700 mt-1">
                                        ${bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal">USD</span>
                                    </p>
                                    <p className="text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 px-3 py-0.5 rounded-full inline-block mt-1">
                                        🇨🇴 ≈ ${(bankBalance * COP_RATE).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
                                    </p>
                                </div>

                                {/* Plazo de efectividad 24 Horas */}
                                <div className="mb-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
                                    <span className="text-base flex-shrink-0">⏳</span>
                                    <div className="leading-tight">
                                        <span className="font-bold">Plazo de Validación y Efectividad (24 Horas):</span>
                                        <p className="text-amber-800 mt-0.5">
                                            Todo retiro a cuenta bancaria entra en validación de seguridad y se hace efectivo en un plazo de <strong>hasta 24 horas</strong>.
                                        </p>
                                    </div>
                                </div>

                                {/* Aviso Contextual Programa Juvenil */}
                                <div className="mb-4 p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[11px] text-blue-900 flex items-start gap-2">
                                    <span className="text-base flex-shrink-0">🎓</span>
                                    <div className="leading-tight">
                                        <span className="font-bold">Programa Juvenil (15 a 17 años):</span>
                                        <p className="text-slate-600 mt-0.5">
                                            Retiros bancarios sujetos a aprobación de tutor legal y tope máximo de <strong>$2.700.000 COP</strong>/mes.
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-gray-700 text-xs font-bold">
                                            Monto a Retirar (USD)
                                        </label>
                                        {maxWithdrawNetUsd >= MIN_WITHDRAW_USD && (
                                            <button
                                                type="button"
                                                onClick={() => setAmount(maxWithdrawNetUsd.toFixed(2))}
                                                className="text-[11px] font-bold text-green-700 hover:text-green-800 bg-green-100 hover:bg-green-200 px-2.5 py-0.5 rounded-full transition"
                                            >
                                                Retirar Todo (${maxWithdrawNetUsd.toFixed(2)} USD)
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={MIN_WITHDRAW_USD}
                                        max={bankBalance}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-semibold"
                                        placeholder="Mínimo $11.00 USD ($49.500 COP)"
                                        required
                                        disabled={!kycVerified}
                                    />
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                        <span className="text-gray-500">
                                            Mínimo: <strong>$11.00 USD</strong> ($49.500 COP)
                                        </span>
                                        {withdrawCopEquivalent > 0 && (
                                            <span className="font-bold text-green-700">
                                                🇨🇴 Recibes aprox: ${withdrawCopEquivalent.toLocaleString('es-CO')} COP
                                            </span>
                                        )}
                                    </div>

                                    {/* Desglose de Tarifa por Uso del Sistema */}
                                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span>Tarifa de uso del sistema:</span>
                                            <span className={`font-bold ${withdrawFeeUsd > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                {withdrawFeeUsd > 0
                                                    ? `+$${withdrawFeeUsd.toFixed(2)} USD ($${Math.round(withdrawFeeUsd * COP_RATE).toLocaleString('es-CO')} COP)`
                                                    : '$0.00 USD (Gratis hasta $200.000 COP)'}
                                            </span>
                                        </div>
                                        {parsedWithdrawAmount > 0 && (
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold text-slate-900">
                                                <span>Total a descontar de Banco TEI:</span>
                                                <span>
                                                    ${withdrawTotalDeductUsd.toFixed(2)} USD (${Math.round(withdrawTotalDeductUsd * COP_RATE).toLocaleString('es-CO')} COP)
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-500 pt-0.5">
                                            Tarifas: &gt;$200.000 COP (+$0.50 USD) · &gt;$1.200.000 COP (+$1.10 USD) · &gt;$2.000.000 COP (+$2.20 USD).
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-xs font-bold mb-1">Cuenta Bancaria Destino (Titular KYC)</label>
                                    <textarea
                                        value={paymentInfo}
                                        onChange={(e) => setPaymentInfo(e.target.value)}
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs ${status?.verified_bank_name ? 'bg-gray-50 text-gray-700 font-medium cursor-not-allowed' : ''}`}
                                        rows="2"
                                        placeholder="Banco, Tipo y Número de Cuenta..."
                                        readOnly={!!status?.verified_bank_name}
                                        disabled={!kycVerified}
                                    />
                                    {status?.verified_bank_name && (
                                        <p className="text-[11px] text-green-600 mt-1 flex items-center font-medium">
                                            <span className="mr-1">✔</span> Cuenta bancaria personal verificada por KYC
                                        </p>
                                    )}
                                </div>

                                <div className="mb-5">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-gray-700 text-xs font-bold">
                                            🔑 Segunda Clave (Clave de Transacciones)
                                        </label>
                                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                            Máx. 3 intentos (Bloqueo 24h)
                                        </span>
                                    </div>
                                    <input
                                        type="password"
                                        value={transactionPin}
                                        onChange={(e) => setTransactionPin(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none tracking-widest"
                                        placeholder="Ingresa tu Segunda Clave"
                                        required
                                        disabled={!kycVerified}
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Por seguridad, si olvidas o fallas la clave 3 veces se bloqueará el retiro por 24 horas.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canWithdraw || submitting}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
                                        canWithdraw
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {submitting
                                        ? 'Validando Segunda Clave...'
                                        : !kycVerified
                                        ? 'KYC Requerido para Retirar'
                                        : bankBalance < MIN_WITHDRAW_USD
                                        ? `Saldo mínimo requerido: $11.00 USD ($49.500 COP)`
                                        : 'Solicitar Retiro a Banco Personal 💸'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: TRANSFERENCIA ENTRE USUARIOS DE LA PLATAFORMA (DESDE $3 USD / $13.500 COP HASTA $600 USD / $2.700.000 COP DIARIO) */}
                    {activeTab === 'transfer' && !status?.is_pin_locked && (
                        <div>
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 mb-4 text-center">
                                <p className="text-gray-500 text-xs uppercase font-semibold">Saldo Disponible para Transferir</p>
                                <p className="text-3xl font-extrabold text-purple-700 mt-1">
                                    ${transferableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal">USD</span>
                                </p>
                                <p className="text-xs font-bold text-purple-800 bg-purple-100 border border-purple-300 px-3 py-0.5 rounded-full inline-block mt-1">
                                    🇨🇴 ≈ ${(transferableBalance * COP_RATE).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
                                </p>
                                <div className="mt-2 pt-2 border-t border-purple-200/70 flex justify-between items-center text-[11px] text-purple-900">
                                    <span>Tope máx. diario: <strong>$600 USD ($2.700.000 COP)</strong></span>
                                    <span>Cupo hoy: <strong>${remainingDailyTransferUsd.toFixed(2)} USD</strong></span>
                                </div>
                            </div>

                            <div className="mb-4 p-3 rounded-xl border border-purple-200 bg-purple-50/60 text-xs text-purple-900 flex items-start gap-2">
                                <span className="text-base flex-shrink-0">🤝</span>
                                <div className="leading-tight">
                                    <span className="font-bold">Transferencia Interna entre Usuarios TEI:</span>
                                    <p className="text-purple-800 mt-0.5">
                                        Envía desde <strong>$3.00 USD ($13.500 COP)</strong> hasta <strong>$600.00 USD ($2.700.000 COP) diarios</strong>, validando siempre con tu <strong>Segunda Clave de Transacciones</strong>.
                                    </p>
                                </div>
                            </div>

                            {transferStep === 1 && (
                                <form onSubmit={handleLookupUser}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-xs font-bold mb-1.5">
                                            Usuario Destinatario (Username, Cédula, Correo o ID)
                                        </label>
                                        <input
                                            type="text"
                                            value={recipientQuery}
                                            onChange={(e) => setRecipientQuery(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                            placeholder="Ej: usuario123, número de cédula o ID..."
                                            required
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Verificaremos los datos del usuario antes de que ingreses el monto y tu Segunda Clave.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={lookingUp || !recipientQuery.trim()}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                                    >
                                        {lookingUp ? 'Buscando usuario...' : 'Buscar y Verificar Destinatario →'}
                                    </button>
                                </form>
                            )}

                            {transferStep === 2 && targetUser && (
                                <form onSubmit={handleTransferP2P}>
                                    <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                {(targetUser.name || targetUser.username || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-indigo-600 font-bold uppercase">Destinatario Verificado</p>
                                                <p className="font-bold text-gray-800 text-sm">{targetUser.name}</p>
                                                <p className="text-xs text-gray-500">@{targetUser.username} (ID #{targetUser.id})</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTransferStep(1);
                                                setTargetUser(null);
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                                        >
                                            Cambiar
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-gray-700 text-xs font-bold">
                                                Monto a Transferir (USD)
                                            </label>
                                            {maxTransferNetUsd >= MIN_TRANSFER_USD && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTransferAmount(maxTransferNetUsd.toFixed(2))}
                                                    className="text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2.5 py-0.5 rounded-full transition"
                                                >
                                                    Usar Máx. (${maxTransferNetUsd.toFixed(2)} USD)
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={MIN_TRANSFER_USD}
                                            max={Math.min(transferableBalance, remainingDailyTransferUsd)}
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-semibold"
                                            placeholder="Mínimo $3.00 USD — Máximo $600.00 USD"
                                            required
                                        />
                                        <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-500">
                                                Mín: <strong>$3.00 USD</strong> · Máx diario: <strong>$600.00 USD</strong>
                                            </span>
                                            {transferCopEquivalent > 0 && (
                                                <span className="font-bold text-purple-700">
                                                    🇨🇴 Recibe: ${transferCopEquivalent.toLocaleString('es-CO')} COP
                                                </span>
                                            )}
                                        </div>

                                        {/* Desglose de Tarifa por Uso del Sistema en Transferencia */}
                                        <div className="mt-2.5 p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span>Tarifa de uso del sistema (a cargo de quien transfiere):</span>
                                                <span className={`font-bold ${transferFeeUsd > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                    {transferFeeUsd > 0
                                                        ? `+$${transferFeeUsd.toFixed(2)} USD ($${Math.round(transferFeeUsd * COP_RATE).toLocaleString('es-CO')} COP)`
                                                        : '$0.00 USD (Gratis hasta $200.000 COP)'}
                                                </span>
                                            </div>
                                            {parsedTransferAmount > 0 && (
                                                <div className="flex justify-between items-center pt-1 border-t border-purple-200 font-bold text-purple-950">
                                                    <span>Total a descontar de tu saldo:</span>
                                                    <span>
                                                        ${transferTotalDeductUsd.toFixed(2)} USD (${Math.round(transferTotalDeductUsd * COP_RATE).toLocaleString('es-CO')} COP)
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-slate-500 pt-0.5">
                                                Tarifas: &gt;$200.000 COP (+$0.50 USD) · &gt;$1.200.000 COP (+$1.10 USD) · &gt;$2.000.000 COP (+$2.20 USD).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-gray-700 text-xs font-bold">
                                                🔑 Segunda Clave (Clave de Transacciones)
                                            </label>
                                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                                Máx. 3 intentos (Bloqueo 24h)
                                            </span>
                                        </div>
                                        <input
                                            type="password"
                                            value={transferPin}
                                            onChange={(e) => setTransferPin(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none tracking-widest"
                                            placeholder="Ingresa tu Segunda Clave para confirmar"
                                            required
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            La transferencia es inmediata una vez validada tu Segunda Clave.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setTransferStep(1)}
                                            className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!canTransfer || submitting}
                                            className={`w-2/3 py-3 rounded-xl font-bold text-white shadow-md transition-all text-sm ${
                                                canTransfer
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                            }`}
                                        >
                                            {submitting ? 'Procesando...' : 'Confirmar Transferencia 💸'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 3: LIBERAR GANANCIAS EN DÍAS DE CORTE */}
                    {activeTab === 'release' && (
                        <div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs text-blue-800 uppercase font-bold mb-1">Estado del día ({status?.current_date})</p>
                                <p className="text-sm text-blue-900 mb-2">{status?.message}</p>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                    <span className="text-blue-700 text-sm">Disponible para liberar:</span>
                                    <span className="font-bold text-lg text-blue-900">${status?.available_to_release?.toLocaleString()} USD</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleRelease}
                                disabled={!canRelease || submitting}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
                                    canRelease
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                {submitting ? 'Procesando...' : 'Liberar Fondos a Caja Fuerte'}
                            </button>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                Los fondos liberados pasan a tu Caja Fuerte y al Banco Digital.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalModal;
