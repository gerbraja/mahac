import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, ArrowUpRight, ShieldCheck, Activity, ArrowLeft, RefreshCw, AlertCircle, PlusCircle, ArrowDownLeft, Building2, CheckCircle2, X, Landmark, Lock, ArrowRightLeft, Gift, Sparkles, Clock, Coins, Award, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { ref, onValue, off } from 'firebase/database';

export default function DriverWallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    user_id: null,
    available_balance_usd: 0,
    available_balance_cop: 0,
    banco_balance_usd: 0,
    banco_balance_cop: 0,
    caja_balance_usd: 0,
    caja_balance_cop: 0,
    credit_limit_usd: 0,
    credit_limit_cop: 0,
    cupo_base_cop: 38000,
    cupo_max_cop: 77000,
    paid_credits_count: 0,
    bonus_cupo_cop: 0,
    credit_used_cop: 0,
    credit_available_cop: 0,
    admin_fee_cop: 450,
    overdue_fee_cop: 2000,
    fee_structure_label: '',
    radar_restricted: false,
    can_take_activation_loan: false,
    activation_loan_used: false,
    vehicle_approved: false,
    active_credit: null,
    total_earnings_usd: 0,
    total_earnings_cop: 0,
    dias_antiguedad: 0,
    is_first_recharge: false,
    min_recharge_cop: 38000,
    is_kyc_verified: false,
    has_transaction_pin: false,
    verified_bank_name: '',
    verified_account_type: 'Ahorros',
    verified_account_number: '',
    verified_account_holder: '',
    verified_document_id: '',
    pending_withdrawals_count: 0,
    movements: []
  });

  const [isRecharging, setIsRecharging] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeSource, setRechargeSource] = useState('banco'); // 'banco' | 'wompi'
  const [customAmount, setCustomAmount] = useState('38000');
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');

  // Estados de Solicitud de Crédito / Adelanto
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditTypeToRequest, setCreditTypeToRequest] = useState('activation'); // 'activation' | 'vault_backed'
  const [creditAmountInput, setCreditAmountInput] = useState('38000');
  const [isRequestingCredit, setIsRequestingCredit] = useState(false);
  const [creditModalError, setCreditModalError] = useState('');
  const [creditModalSuccess, setCreditModalSuccess] = useState('');

  // Estados de Pago de Crédito
  const [showPayCreditModal, setShowPayCreditModal] = useState(false);
  const [payCreditMethod, setPayCreditMethod] = useState('wallet_balance'); // 'wallet_balance' | 'tei_bank'
  const [isPayingCredit, setIsPayingCredit] = useState(false);
  const [payCreditError, setPayCreditError] = useState('');
  const [payCreditSuccess, setPayCreditSuccess] = useState('');

  // Estados de Retiro a Banco / Nequi (en cualquier momento)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('50000');
  const [bankName, setBankName] = useState('Bancolombia');
  const [accountType, setAccountType] = useState('Ahorros');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [cancellingWithdrawalId, setCancellingWithdrawalId] = useState(null);
  const [isRevertingTest, setIsRevertingTest] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Estados de Transferencia de Saldo Disponible para Viajes -> Saldo Banco TEI
  const [showTransferToBankModal, setShowTransferToBankModal] = useState(false);
  const [transferToBankAmount, setTransferToBankAmount] = useState('');
  const [isTransferringToBank, setIsTransferringToBank] = useState(false);
  const [transferToBankError, setTransferToBankError] = useState('');
  const [transferToBankSuccess, setTransferToBankSuccess] = useState('');

  // Estados de Liquidación Digital (Aviso 20 minutos)
  const [recentSettlement, setRecentSettlement] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [settlementDismissed, setSettlementDismissed] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/transport/driver-wallet');
      if (res.data) {
        setWalletData(res.data);
      }
    } catch (err) {
      console.error("Error al cargar billetera del conductor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Escuchar liquidación digital reciente en Firebase (duración 20 min)
  useEffect(() => {
    if (!walletData.user_id) return;
    const settleRef = ref(db, `drivers/recent_settlements/${walletData.user_id}`);
    const unsub = onValue(settleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && data.is_digital && data.timestamp) {
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsed = nowSec - data.timestamp;
          if (elapsed < 1200) { // 20 minutos = 1200 segundos
            setRecentSettlement(data);
            setTimeLeftSeconds(1200 - elapsed);
            setSettlementDismissed(false);
          } else {
            setRecentSettlement(null);
          }
        }
      }
    });
    return () => off(settleRef);
  }, [walletData.user_id]);

  useEffect(() => {
    if (!recentSettlement || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setRecentSettlement(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recentSettlement, timeLeftSeconds > 0]);

  const handleOpenWithdrawModal = () => {
    setWithdrawError('');
    setWithdrawSuccess('');
    setTransactionPin('');
    setShowPin(false);
    if (walletData.verified_bank_name) setBankName(walletData.verified_bank_name);
    if (walletData.verified_account_type) setAccountType(walletData.verified_account_type);
    if (walletData.verified_account_number) setAccountNumber(walletData.verified_account_number);
    if (walletData.verified_account_holder) setAccountHolder(walletData.verified_account_holder);
    if (walletData.verified_document_id) setDocumentId(walletData.verified_document_id);
    setShowWithdrawModal(true);
  };

  const handleStartWithdrawal = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (!val || val < 49500) {
      setWithdrawError("El monto mínimo de retiro a Banco Personal es de $49.500 COP ($11.00 USD).");
      return;
    }
    if (val > (walletData.available_balance_cop || 0)) {
      setWithdrawError(`Saldo insuficiente. Tienes $${(walletData.available_balance_cop || 0).toLocaleString('es-CO')} COP disponibles.`);
      return;
    }
    if (!walletData.is_kyc_verified) {
      setWithdrawError("Debes tener tu verificación KYC aprobada antes de solicitar un retiro.");
      return;
    }
    if (!walletData.has_transaction_pin) {
      setWithdrawError("Debes configurar tu Segunda Clave en Seguridad antes de solicitar retiros.");
      return;
    }
    if (!transactionPin || !transactionPin.trim()) {
      setWithdrawError("Por favor ingresa tu Segunda Clave de Retiros (PIN de seguridad).");
      return;
    }

    setWithdrawError('');
    setIsWithdrawing(true);
    try {
      const res = await api.post('/api/transport/driver-wallet/withdraw', {
        amount_cop: val,
        pin: transactionPin.trim(),
        bank_name: walletData.verified_bank_name || bankName,
        account_type: walletData.verified_account_type || accountType,
        account_number: walletData.verified_account_number || accountNumber,
        account_holder: walletData.verified_account_holder || accountHolder,
        document_id: walletData.verified_document_id || documentId
      });
      setWithdrawSuccess(res.data?.message || "Solicitud de retiro registrada y autenticada con tu Segunda Clave.");
      setTransactionPin('');
      fetchWallet();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess('');
      }, 3000);
    } catch (err) {
      console.error("Error al solicitar retiro:", err);
      setWithdrawError(err.response?.data?.detail || "No se pudo procesar la solicitud de retiro.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!window.confirm("¿Deseas cancelar esta solicitud de retiro y reintegrar el dinero a tu saldo disponible inmediatamente?")) return;
    try {
      setCancellingWithdrawalId(withdrawalId);
      const res = await api.post(`/api/transport/driver-wallet/withdraw/${withdrawalId}/cancel`);
      alert(res.data?.message || "Solicitud cancelada y saldo reintegrado exitosamente.");
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al cancelar la solicitud de retiro.");
    } finally {
      setCancellingWithdrawalId(null);
    }
  };

  const handleRevertTest = async () => {
    if (!window.confirm("¿Deseas reintegrar el monto de tu retiro pendiente a tu saldo disponible inmediatamente?")) return;
    try {
      setIsRevertingTest(true);
      const res = await api.post('/api/transport/driver-wallet/revert-unverified-withdrawal');
      alert(res.data?.message || "Saldo reintegrado con éxito.");
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al reintegrar fondos.");
    } finally {
      setIsRevertingTest(false);
    }
  };

  const minRequiredCOP = walletData.active_credit
    ? ((walletData.active_credit.total_due_cop || 0) + 4500)
    : (walletData.is_first_recharge ? 38000 : (walletData.min_recharge_cop || 10000));

  const handleStartRecharge = async (amountToRecharge) => {
    const val = parseFloat(amountToRecharge);
    if (!val || val < minRequiredCOP) {
      if (walletData.active_credit) {
        setRechargeError(`Tienes un crédito pendiente por $${(walletData.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP. La recarga mínima es de $${minRequiredCOP.toLocaleString('es-CO')} COP (Deuda + 1 Dólar TEI / $4.500 COP).`);
      } else if (walletData.is_first_recharge) {
        setRechargeError(`La primera recarga como conductor debe ser de mínimo $38.000 COP.`);
      } else {
        setRechargeError(`El monto mínimo de recarga es de $${minRequiredCOP.toLocaleString('es-CO')} COP`);
      }
      return;
    }
    setRechargeError('');
    setIsRecharging(true);
    try {
      const res = await api.post('/api/transport/recharge', {
        amount_cop: val
      });
      if (res.data?.checkout_url) {
        // Redirigir a la pasarela de Wompi oficial
        window.location.href = res.data.checkout_url;
      } else {
        alert("No se pudo generar la orden de recarga Wompi.");
      }
    } catch (err) {
      console.error("Error al iniciar recarga:", err);
      setRechargeError(err.response?.data?.detail || "Error al conectar con Wompi");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleInternalRecharge = async (amountToRecharge, source) => {
    const val = parseFloat(amountToRecharge);
    if (!val || val < minRequiredCOP) {
      if (walletData.active_credit) {
        setRechargeError(`Tienes un crédito pendiente por $${(walletData.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP. La recarga mínima es de $${minRequiredCOP.toLocaleString('es-CO')} COP (Deuda + 1 Dólar TEI / $4.500 COP).`);
      } else if (walletData.is_first_recharge) {
        setRechargeError(`La primera recarga como conductor debe ser de mínimo $38.000 COP.`);
      } else {
        setRechargeError(`El monto mínimo de recarga es de $${minRequiredCOP.toLocaleString('es-CO')} COP`);
      }
      return;
    }

    const availableInSource = source === 'banco' 
      ? (walletData.banco_balance_cop || 0) 
      : (walletData.caja_balance_cop || 0);

    const sourceName = source === 'banco' ? 'Banco TEI' : 'Caja Fuerte';

    if (val > availableInSource) {
      setRechargeError(`Saldo insuficiente en ${sourceName}. Tienes $${availableInSource.toLocaleString('es-CO')} COP disponibles.`);
      return;
    }

    setRechargeError('');
    setIsRecharging(true);
    try {
      const res = await api.post('/api/transport/driver-wallet/recharge-internal', {
        amount_cop: val,
        source: source
      });
      setRechargeSuccess(res.data?.message || `¡Recarga de $${val.toLocaleString('es-CO')} COP completada con éxito!`);
      await fetchWallet();
      setTimeout(() => {
        setShowRechargeModal(false);
        setRechargeSuccess('');
      }, 2200);
    } catch (err) {
      console.error("Error al recargar desde saldo interno:", err);
      setRechargeError(err.response?.data?.detail || "Error al procesar la transferencia interna.");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleTransferToBank = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(transferToBankAmount);
    if (!val || val < 1000) {
      setTransferToBankError("El monto mínimo para transferir a Banco TEI es de $1.000 COP.");
      return;
    }
    const maxAvail = walletData.available_balance_cop || 0;
    if (val > maxAvail) {
      setTransferToBankError(`Saldo insuficiente en Saldo Disponible para Viajes. Tienes $${maxAvail.toLocaleString('es-CO')} COP disponibles.`);
      return;
    }

    setTransferToBankError('');
    setIsTransferringToBank(true);
    try {
      const res = await api.post('/api/transport/driver-wallet/transfer-to-bank', {
        amount_cop: val
      });
      setTransferToBankSuccess(res.data?.message || `¡Se transfirieron $${val.toLocaleString('es-CO')} COP a tu Saldo Banco TEI!`);
      await fetchWallet();
      setTimeout(() => {
        setShowTransferToBankModal(false);
        setTransferToBankSuccess('');
      }, 2200);
    } catch (err) {
      console.error("Error al transferir a Banco TEI:", err);
      setTransferToBankError(err.response?.data?.detail || "Error al procesar la transferencia hacia Banco TEI.");
    } finally {
      setIsTransferringToBank(false);
    }
  };

  const handleRequestCredit = async () => {
    setCreditModalError('');
    setIsRequestingCredit(true);
    try {
      const amt = creditTypeToRequest === 'activation' ? 38000 : parseFloat(creditAmountInput);
      if (creditTypeToRequest === 'vault_backed' && (!amt || amt < 10000 || amt > (walletData.credit_available_cop || 0))) {
        setCreditModalError(`El monto debe estar entre $10.000 y $${(walletData.credit_available_cop || 0).toLocaleString('es-CO')} COP.`);
        setIsRequestingCredit(false);
        return;
      }
      const res = await api.post('/api/transport/driver-credit/request', {
        credit_type: creditTypeToRequest,
        amount_cop: amt
      });
      setCreditModalSuccess(res.data?.message || "¡Crédito desembolsado exitosamente!");
      await fetchWallet();
      setTimeout(() => {
        setShowCreditModal(false);
        setCreditModalSuccess('');
      }, 2000);
    } catch (err) {
      console.error("Error al solicitar crédito:", err);
      setCreditModalError(err.response?.data?.detail || "Error al procesar la solicitud de crédito.");
    } finally {
      setIsRequestingCredit(false);
    }
  };

  const handlePayCredit = async () => {
    setPayCreditError('');
    setIsPayingCredit(true);
    try {
      const res = await api.post('/api/transport/driver-credit/pay', {
        payment_method: payCreditMethod
      });
      setPayCreditSuccess(res.data?.message || "¡Crédito liquidado exitosamente!");
      await fetchWallet();
      setTimeout(() => {
        setShowPayCreditModal(false);
        setPayCreditSuccess('');
      }, 2000);
    } catch (err) {
      console.error("Error al pagar crédito:", err);
      setPayCreditError(err.response?.data?.detail || "Error al procesar el pago del crédito.");
    } finally {
      setIsPayingCredit(false);
    }
  };

  const balanceCOP = walletData.available_balance_cop || 0;
  const creditLimitCOP = walletData.credit_limit_cop || 0;
  const usagePercentage = balanceCOP < 0 
    ? (creditLimitCOP > 0 ? Math.min((Math.abs(balanceCOP) / creditLimitCOP) * 100, 100) : 100) 
    : 0;

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white font-sans p-4 md:p-6 pb-28 max-w-2xl mx-auto">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/transport/driver')}
            className="w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800 flex justify-center items-center text-gray-300 hover:text-white hover:bg-gray-800 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Billetera de Conductor
            </h1>
            <p className="text-xs text-gray-400 font-medium">Recargas y comisiones en tiempo real</p>
          </div>
        </div>
        
        <button 
          onClick={fetchWallet}
          className="w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800 flex justify-center items-center text-emerald-400 hover:bg-gray-800 transition"
          title="Actualizar saldo"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* BANNER PERSISTENTE 20 MINUTOS: LIQUIDACIÓN DIGITAL TEI */}
      {recentSettlement && !settlementDismissed && (
        <div className="mb-6 animate-fade-in">
          <div className="bg-gray-900/95 border-2 border-emerald-400 rounded-3xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.35)] backdrop-blur-xl relative">
            <button 
              onClick={() => setSettlementDismissed(true)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
              title="Ocultar aviso"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                ✅ VIAJE PAGADO DIGITALMENTE — NO COBRAR EFECTIVO
              </h3>
            </div>

            <div className="bg-gray-950/80 rounded-2xl p-3 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Tarifa del Viaje #{recentSettlement.trip_id}:</span>
                <span className="font-bold text-white">${parseFloat(recentSettlement.total_fare || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>(-) Comisión TEI ({recentSettlement.platform_fee_percent || 15}%):</span>
                <span className="font-bold">-${parseFloat(recentSettlement.platform_fee || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-black border-t border-gray-800 pt-1.5 text-sm">
                <span>(=) Ganancia Neta Acreditada:</span>
                <span>+${parseFloat(recentSettlement.driver_net_earnings || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 border-t border-gray-800 pt-1">
                <span>Saldo Anterior: ${(recentSettlement.previous_balance_cop || 0).toLocaleString('es-CO')}</span>
                <span className="text-cyan-300 font-bold">➔ Nuevo Saldo: ${(recentSettlement.new_balance_cop || 0).toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 px-1 text-[11px]">
              <span className="text-emerald-300 font-medium">Acreditado directamente a tu Billetera TEI</span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800">
                ⏱️ {Math.floor(timeLeftSeconds / 60)}m {timeLeftSeconds % 60}s restantes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE CARD (GLASSMORPHISM) */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-6 shadow-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl">
        <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-20 ${balanceCOP >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center text-gray-400 mb-2 font-semibold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-emerald-400" />
              <span>Saldo Disponible para Viajes</span>
            </div>
            <span className="text-[11px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
              1 USD = $4.500 COP
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl md:text-5xl font-black tracking-tight ${balanceCOP < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${balanceCOP.toLocaleString('es-CO')} <span className="text-sm font-bold text-gray-400">COP</span>
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-5 font-medium">
            Equivalente a <span className="text-white font-bold">${(walletData.available_balance_usd || 0).toFixed(2)} USD</span>
          </div>

          {/* CUPO DE LIQUIDEZ OPERATIVA TEI (TARIFA FIJA & ESCALA DE CONFIANZA) */}
          <div className="bg-gray-950/80 rounded-2xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-cyan-400" />
                Cupo de Liquidez Operativa TEI
              </span>
              <span className="font-extrabold text-cyan-400">
                ${(walletData.credit_limit_cop || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            {/* BADGES REGLAS TRANSPARENTES (CERO INTERESES) */}
            <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl px-2.5 py-2 my-2 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-400" />
                  Tarifa de Gestión: $450 COP fijos
                </span>
                <span className="text-emerald-400 font-black bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 text-[10px]">
                  Cero Intereses Diarios
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-300 pt-1 border-t border-cyan-900/60">
                <span className="text-emerald-300 font-medium">📅 Días 1 a 3 (0-72h): Plazo Oportuno</span>
                <span className="text-amber-400 font-medium">🚨 Día 4+: Normalización (+$2.000 COP)</span>
              </div>
            </div>

            {/* BADGE ESCALA DE CONFIANZA (HASTA $77.000 COP) */}
            <div className="bg-gradient-to-r from-emerald-950/50 to-cyan-950/50 border border-emerald-500/40 rounded-xl px-2.5 py-2 my-2 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <Award size={14} className="text-amber-400 shrink-0" />
                  <span>Escala de Confianza: +${(walletData.bonus_cupo_cop || 0).toLocaleString('es-CO')} COP</span>
                </div>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700/60 font-semibold">
                  {walletData.paid_credits_count || 0} ciclo(s) cumplido(s)
                </span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, ((walletData.credit_limit_cop || 38000) / 77000) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                <span>Base: $38.000 COP (+ $4.500 c/u)</span>
                <span className="text-cyan-300 font-bold">Tope Máximo: $77.000 COP</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/80">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Cupo en Uso:</span>
                <span className="text-white font-bold">${(walletData.credit_used_cop || 0).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Cupo Disponible:</span>
                <span className="text-cyan-400 font-extrabold">${(walletData.credit_available_cop || 0).toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* CASO A: CUPO ACTIVO EN CURSO */}
            {walletData.active_credit ? (
              <div className={`border rounded-2xl p-3.5 mb-2 shadow-lg ${
                walletData.active_credit.is_overdue
                  ? 'bg-rose-950/40 border-rose-600/70'
                  : walletData.active_credit.is_low_balance
                  ? 'bg-amber-950/40 border-amber-500/70'
                  : 'bg-gray-900 border-emerald-500/50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className={`flex items-center gap-1.5 text-xs font-black ${
                    walletData.active_credit.is_overdue 
                      ? 'text-rose-400' 
                      : (walletData.active_credit.is_clock_running ? 'text-amber-300' : 'text-emerald-300')
                  }`}>
                    <Clock size={14} className={walletData.active_credit.is_clock_running ? "animate-pulse" : ""} />
                    <span>
                      {walletData.active_credit.is_overdue 
                        ? 'Normalización Operativa' 
                        : (walletData.active_credit.is_clock_running ? 'Plazo Oportuno Activo (Saldo ≤ $5.000 COP)' : 'Cupo Operativo Disponible')}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    walletData.active_credit.is_overdue 
                      ? 'border-rose-500/50 bg-rose-950 text-rose-300' 
                      : walletData.active_credit.is_clock_running
                      ? 'border-amber-500/40 bg-amber-950/60 text-amber-300'
                      : 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                  }`}>
                    {walletData.active_credit.is_clock_running 
                      ? `Día ${walletData.active_credit.days_elapsed} ${walletData.active_credit.is_overdue ? '(Vencido)' : 'de 3'}` 
                      : 'Sin plazo (Protegido)'}
                  </span>
                </div>

                {/* ALERTA DE MORA */}
                {walletData.active_credit.is_overdue && (
                  <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-2.5 mb-2.5 text-[11px] text-rose-200 leading-snug">
                    ⚠️ <strong>Normalización requerida:</strong> Se aplicó el cargo administrativo de normalización de <strong>+$2.000 COP</strong>. La toma de viajes en efectivo está pausada. Puedes seguir realizando viajes digitales o liquidar tu saldo para restaurar el radar.
                  </div>
                )}

                {/* ALERTA SALDO BAJO (<= $5.000 COP) */}
                {walletData.active_credit.is_low_balance && !walletData.active_credit.is_overdue && (
                  <div className="bg-amber-950/80 border border-amber-500/60 rounded-xl p-2.5 mb-2.5 text-[11px] text-amber-200 leading-snug flex items-start gap-1.5">
                    <span className="text-sm shrink-0">⚠️</span>
                    <div>
                      <strong>¡Cupo bajo!</strong> Te quedan ${(walletData.active_credit.remaining_balance_cop || 0).toLocaleString('es-CO')} COP en tu cupo de respaldo. Tienes <strong>3 días de plazo oportuno</strong> para pagar lo consumido y restaurar tu cupo al 100%.
                    </div>
                  </div>
                )}

                <div className="text-xs space-y-1.5 bg-gray-950/80 p-2.5 rounded-xl border border-gray-800 mb-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Cupo Total Asignado:</span>
                    <span className="font-bold text-white">${(walletData.active_credit.principal_cop || 38000).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>(-) Comisiones Deducidas:</span>
                    <span className="font-bold text-amber-400">-${(walletData.active_credit.used_commission_cop || 0).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between text-gray-300 font-bold border-b border-gray-800/80 pb-1">
                    <span className="text-emerald-300">Saldo Disponible de Cupo:</span>
                    <span className={walletData.active_credit.is_low_balance ? 'text-amber-400' : 'text-emerald-400'}>
                      ${(walletData.active_credit.remaining_balance_cop || 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  {walletData.active_credit.overdue_fee_cop > 0 && (
                    <div className="flex justify-between text-rose-400 font-bold">
                      <span>(+) Cargo de Normalización:</span>
                      <span>+${(walletData.active_credit.overdue_fee_cop || 2000).toLocaleString('es-CO')} COP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cyan-300 font-black pt-1 border-t border-gray-800 text-sm">
                    <span>Total a Restaurar:</span>
                    <span>${(walletData.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPayCreditError('');
                    setPayCreditSuccess('');
                    setShowPayCreditModal(true);
                  }}
                  disabled={walletData.active_credit.total_due_cop === 0 && !walletData.active_credit.is_overdue}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
                >
                  <Coins size={15} />
                  <span>
                    {walletData.active_credit.total_due_cop > 0
                      ? `Pagar y Restaurar Cupo (${(walletData.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP)`
                      : '✓ Cupo al 100% (Sin saldo pendiente)'}
                  </span>
                </button>
              </div>
            ) : (
              /* CASO B: SIN CUPO ACTIVO - ACCIONES DE SOLICITUD */
              <div className="space-y-2 mt-2">
                {/* BANNER DESTACADO DE CUPO DE BIENVENIDA */}
                {walletData.can_take_activation_loan && (
                  <div className="bg-gradient-to-r from-emerald-950/80 to-cyan-950/80 border-2 border-emerald-400/80 rounded-2xl p-3.5 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift size={16} className="text-emerald-400 animate-bounce" />
                      <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                        ¡Cupo de Bienvenida Disponible: $38.000 COP!
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed mb-2.5">
                      Tu vehículo y documentos están <strong>Aprobados ✓</strong>. Activa tu radar hoy mismo con cupo de respaldo. Tarifa fija de $450 COP al activar; el plazo de 3 días <strong>solo comienza si tu saldo llega a ≤ $5.000 COP</strong>.
                    </p>
                    <button
                      onClick={() => {
                        setCreditTypeToRequest('activation');
                        setCreditAmountInput('38000');
                        setCreditModalError('');
                        setCreditModalSuccess('');
                        setShowCreditModal(true);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98"
                    >
                      <Gift size={15} />
                      <span>Activar Radar con Cupo ($38.000 COP)</span>
                    </button>
                  </div>
                )}

                {/* BOTÓN GENERAL DE SOLICITAR CUPO DE LIQUIDEZ */}
                {(walletData.credit_available_cop || 0) >= 10000 && !walletData.can_take_activation_loan && (
                  <button
                    onClick={() => {
                      setCreditTypeToRequest('vault_backed');
                      setCreditAmountInput(Math.min(38000, walletData.credit_available_cop || 10000).toString());
                      setCreditModalError('');
                      setCreditModalSuccess('');
                      setShowCreditModal(true);
                    }}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-bold rounded-xl text-xs transition flex justify-center items-center gap-2 active:scale-98"
                  >
                    <ShieldCheck size={15} />
                    <span>Solicitar Cupo de Liquidez (Hasta ${(walletData.credit_available_cop || 0).toLocaleString('es-CO')} COP)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PLATAFORMA TEI: SALDOS DISPONIBLES EN BANCO Y CAJA FUERTE */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-5 mb-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-cyan-400" />
            <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider">
              Tus Fondos en Plataforma TEI
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full border border-gray-700 font-medium">
            Saldos para operar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BANCO TEI: RECARGA DIRECTA */}
          <div className="bg-gray-950/80 border border-cyan-500/30 rounded-2xl p-3.5 flex justify-between items-center hover:border-cyan-500/60 transition">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold mb-1">
                <Landmark size={14} />
                <span>Saldo Banco TEI</span>
              </div>
              <div className="text-base font-black text-white">
                ${(walletData.banco_balance_cop || 0).toLocaleString('es-CO')} <span className="text-[11px] text-gray-400 font-medium">COP</span>
              </div>
              <div className="text-[10px] text-gray-400">
                ${(walletData.banco_balance_usd || 0).toFixed(2)} USD (KYC ✓)
              </div>
            </div>
            <button
              onClick={() => {
                setRechargeSource('banco');
                setCustomAmount(minRequiredCOP.toString());
                setRechargeError('');
                setRechargeSuccess('');
                setShowRechargeModal(true);
              }}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
              title="Recargar billetera desde Banco TEI"
            >
              <span>Transferir</span>
              <ArrowRightLeft size={13} />
            </button>
          </div>

          {/* SALDO DISPONIBLE PARA VIAJES -> TRANSFERIR A BANCO TEI */}
          <div className="bg-gray-950/80 border border-emerald-500/30 rounded-2xl p-3.5 flex justify-between items-center hover:border-emerald-500/60 transition gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold mb-1">
                <Wallet size={14} />
                <span>Saldo Disponible para Viajes</span>
              </div>
              <div className="text-base font-black text-white">
                ${balanceCOP.toLocaleString('es-CO')} <span className="text-[11px] text-gray-400 font-medium">COP</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                Pasar saldo a tu Banco TEI ($0 costo)
              </div>
            </div>
            <button
              onClick={() => {
                const defaultTransfer = balanceCOP >= 1000 ? Math.floor(balanceCOP).toString() : '10000';
                setTransferToBankAmount(defaultTransfer);
                setTransferToBankError('');
                setTransferToBankSuccess('');
                setShowTransferToBankModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm shrink-0"
              title="Pasar tu Saldo Disponible para Viajes hacia tu Saldo Banco TEI"
            >
              <span>Transferir Saldo Banco TEI</span>
              <ArrowRightLeft size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ALERTA DE PRIMERA RECARGA */}
      {walletData.is_first_recharge && (
        <div className="bg-amber-950/40 border border-amber-500/60 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fade-in shadow-lg">
          <AlertCircle className="text-amber-400 w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-black text-amber-300 block uppercase mb-1">Primera Recarga Obligatoria: $38.000 COP</span>
            <p className="text-gray-300 leading-relaxed">
              Para activar tu cuenta de conductor y recibir servicios en el radar, la primera recarga debe ser de <strong>mínimo $38.000 COP</strong>. Puedes usar tu <strong>Saldo Banco TEI</strong>, solicitar tu <strong>Préstamo de Bienvenida</strong> o recargar externamente con <strong>Wompi</strong>. Las siguientes recargas podrán ser desde $10.000 COP.
            </p>
          </div>
        </div>
      )}

      {/* ALERTA DE RETIRO PENDIENTE / REINTEGRO */}
      {walletData.pending_withdrawals_count > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="font-bold text-xs text-amber-300">Tienes una solicitud de retiro en proceso</p>
              <p className="text-[11px] text-gray-400">Si realizaste una prueba o deseas reversar la solicitud, puedes reintegrar tus fondos a tu saldo disponible inmediatamente.</p>
            </div>
          </div>
          <button
            onClick={handleRevertTest}
            disabled={isRevertingTest}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs shrink-0 transition flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95"
          >
            {isRevertingTest ? <RefreshCw size={14} className="animate-spin" /> : <Coins size={14} />}
            <span>Reintegrar Fondos Ahora</span>
          </button>
        </div>
      )}

      {/* BOTONES DE ACCIÓN: RECARGAR & RETIRAR EN CUALQUIER MOMENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <button 
          onClick={() => {
            setRechargeSource('banco');
            setCustomAmount(minRequiredCOP.toString());
            setRechargeError('');
            setRechargeSuccess('');
            setShowRechargeModal(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black py-4 px-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all active:scale-98 flex justify-center items-center gap-2 text-sm"
        >
          <PlusCircle size={20} />
          <span>Recargar Billetera</span>
        </button>

        <button 
          onClick={handleOpenWithdrawModal}
          className="bg-gray-900 hover:bg-gray-800 text-cyan-400 hover:text-cyan-300 border-2 border-cyan-500/50 hover:border-cyan-400 font-black py-4 px-5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all active:scale-98 flex justify-center items-center gap-2 text-sm"
          title="Retira tus ganancias a tu banco o Nequi en cualquier momento con tu Segunda Clave"
        >
          <ArrowDownLeft size={20} />
          <span>Retirar a Banco / Nequi</span>
        </button>
      </div>

      {/* MODAL RECARGA (BANCO TEI & WOMPI) */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black text-white">Recarga tu Billetera</h3>
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-3">
              {walletData.is_first_recharge
                ? 'Como conductor nuevo, realiza tu primera recarga de mínimo $38.000 COP para activar tu radar.'
                : 'Selecciona el método de recarga. La comisión de los viajes que aceptes se debitará de este saldo.'}
            </p>

            {/* ALERTA DE CRÉDITO ACTIVO PENDIENTE */}
            {walletData.active_credit && (
              <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-3.5 mb-4 text-xs animate-fade-in shadow-md">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                  <Clock size={15} className="animate-pulse" />
                  <span>Crédito Activo: ${(walletData.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                  Al recargar, <strong>se descontará primero toda tu deuda pendiente</strong>. El valor excedente quedará como saldo disponible para operar en la app.
                </p>
                <div className="pt-2 border-t border-amber-500/30 flex justify-between items-center text-cyan-300 font-bold text-[11px]">
                  <span>Recarga Mínima Obligatoria:</span>
                  <span className="font-mono text-xs bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    ${minRequiredCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  (Total adeudado + 1 Dólar TEI / $4.500 COP para saldo activo)
                </div>
              </div>
            )}

            {/* SELECTOR DE ORIGEN DE FONDOS */}
            <div className="mb-4">
              <label className="text-[11px] text-gray-400 font-bold uppercase block mb-2">
                Selecciona el Método de Recarga:
              </label>
              <div className="space-y-2">
                {/* 1. Banco TEI */}
                <button
                  type="button"
                  onClick={() => {
                    setRechargeSource('banco');
                    setRechargeError('');
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                    rechargeSource === 'banco'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${rechargeSource === 'banco' ? 'bg-cyan-500 text-gray-950' : 'bg-gray-800 text-cyan-400'}`}>
                      <Landmark size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Saldo Banco TEI</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800 font-mono">Inmediato</span>
                      </div>
                      <div className="text-[11px] text-cyan-300 font-bold">
                        Disponible: ${(walletData.banco_balance_cop || 0).toLocaleString('es-CO')} COP
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rechargeSource === 'banco' ? 'border-cyan-400 bg-cyan-400 text-gray-950' : 'border-gray-600'}`}>
                    {rechargeSource === 'banco' && <CheckCircle2 size={14} className="stroke-[3]" />}
                  </div>
                </button>

                {/* 2. Wompi */}
                <button
                  type="button"
                  onClick={() => {
                    setRechargeSource('wompi');
                    setRechargeError('');
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                    rechargeSource === 'wompi'
                      ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${rechargeSource === 'wompi' ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800 text-emerald-400'}`}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">
                        Pagar con Tarjeta / Nequi / PSE (Wompi)
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Pasarela oficial de pago externa
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rechargeSource === 'wompi' ? 'border-emerald-400 bg-emerald-400 text-gray-950' : 'border-gray-600'}`}>
                    {rechargeSource === 'wompi' && <CheckCircle2 size={14} className="stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Montos rápidos */}
            <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1.5">Monto a Recargar:</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(walletData.active_credit
                ? [minRequiredCOP, minRequiredCOP + 20000, minRequiredCOP + 50000]
                : (walletData.is_first_recharge ? [38000, 50000, 100000] : [20000, 50000, 100000])
              ).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCustomAmount(amt.toString())}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${customAmount === amt.toString() ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  ${amt.toLocaleString('es-CO')}
                </button>
              ))}
            </div>

            {/* Input manual */}
            <div className="mb-4">
              <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1">Otro Monto (COP):</label>
              <div className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 flex items-center">
                <span className="text-gray-400 font-bold mr-2">$</span>
                <input 
                  type="number"
                  min={minRequiredCOP}
                  step="5000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`Mínimo $${minRequiredCOP.toLocaleString('es-CO')}`}
                  className="bg-transparent text-white font-black text-lg focus:outline-none w-full"
                />
              </div>
              <span className="text-[10px] text-emerald-400/90 mt-1 block">
                {walletData.active_credit
                  ? `⚡ Salda tu crédito: Mínimo $${minRequiredCOP.toLocaleString('es-CO')} COP (Deuda + 1 Dólar TEI)`
                  : walletData.is_first_recharge 
                  ? '⚡ Primera recarga obligatoria: Mínimo $38.000 COP' 
                  : 'Mínimo de recarga: $10.000 COP'}
              </span>
            </div>

            {/* Errores y Mensajes */}
            {rechargeError && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{rechargeError}</span>
              </div>
            )}

            {rechargeSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{rechargeSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>

              {rechargeSource === 'wompi' ? (
                <button 
                  onClick={() => handleStartRecharge(customAmount)}
                  disabled={isRecharging}
                  className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  {isRecharging ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Conectando Wompi...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      <span>Pagar con Wompi</span>
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => handleInternalRecharge(customAmount, rechargeSource)}
                  disabled={isRecharging}
                  className={`flex-[2] py-3 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg active:scale-98 ${
                    rechargeSource === 'banco'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-gray-950 shadow-cyan-500/20'
                      : 'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-amber-500/20'
                  }`}
                >
                  {isRecharging ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={16} />
                      <span>Transferir a Billetera</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSFERIR SALDO DISPONIBLE PARA VIAJES -> SALDO BANCO TEI */}
      {showTransferToBankModal && (
        <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Landmark className="text-emerald-400" size={20} />
                <h3 className="text-lg font-black text-white">Transferir a Saldo Banco TEI</h3>
              </div>
              <button
                onClick={() => setShowTransferToBankModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Pasa el dinero de tu <strong>Saldo Disponible para Viajes</strong> directamente hacia tu <strong>Saldo Banco TEI</strong> de forma inmediata y sin costo ($0 COP).
            </p>

            {/* RESUMEN DE SALDOS */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl p-3">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">Disponible en Viajes</span>
                <span className="text-base font-black text-white">${balanceCOP.toLocaleString('es-CO')} COP</span>
                <span className="text-[10px] text-gray-400 block">${(walletData.available_balance_usd || 0).toFixed(2)} USD</span>
              </div>
              <div className="bg-gray-950 border border-cyan-500/40 rounded-2xl p-3">
                <span className="text-[10px] text-cyan-300 font-bold uppercase block">Saldo Banco TEI</span>
                <span className="text-base font-black text-white">${(walletData.banco_balance_cop || 0).toLocaleString('es-CO')} COP</span>
                <span className="text-[10px] text-gray-400 block">${(walletData.banco_balance_usd || 0).toFixed(2)} USD</span>
              </div>
            </div>

            <form onSubmit={handleTransferToBank} className="space-y-4">
              {/* Botones rápidos */}
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1.5">Seleccionar Monto Rápido:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 20000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferToBankAmount(amt.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        transferToBankAmount === amt.toString()
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800 border-gray-700 text-gray-300'
                      }`}
                    >
                      ${(amt / 1000)}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferToBankAmount(Math.max(0, Math.floor(balanceCOP)).toString())}
                    className="py-2 px-2 rounded-xl text-xs font-black border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    Todo
                  </button>
                </div>
              </div>

              {/* Input manual */}
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1">Monto a Pasar a Banco TEI (COP):</label>
                <div className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 flex items-center">
                  <span className="text-gray-400 font-bold mr-2">$</span>
                  <input
                    type="number"
                    min="1000"
                    max={Math.max(1000, Math.floor(balanceCOP))}
                    step="1000"
                    value={transferToBankAmount}
                    onChange={(e) => setTransferToBankAmount(e.target.value)}
                    placeholder="Mínimo $1.000 COP"
                    className="bg-transparent text-white font-black text-lg focus:outline-none w-full"
                    required
                  />
                </div>
                <span className="text-[10px] text-emerald-400/90 mt-1 block">
                  Equivalente aprox.: ${((parseFloat(transferToBankAmount) || 0) / 4500).toFixed(2)} USD · Transferencia interna inmediata ($0 costo)
                </span>
              </div>

              {transferToBankError && (
                <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{transferToBankError}</span>
                </div>
              )}

              {transferToBankSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{transferToBankSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTransferToBankModal(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTransferringToBank || balanceCOP < 1000}
                  className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
                >
                  {isTransferringToBank ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Transfiriendo...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={16} />
                      <span>Transferir Saldo Banco TEI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SOLICITAR CUPO DE LIQUIDEZ OPERATIVA */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {creditTypeToRequest === 'activation' ? (
                  <Gift className="text-emerald-400" size={20} />
                ) : (
                  <ShieldCheck className="text-cyan-400" size={20} />
                )}
                <h3 className="text-lg font-black text-white">
                  {creditTypeToRequest === 'activation' 
                    ? 'Cupo de Bienvenida ($38.000 COP)' 
                    : 'Cupo de Liquidez Operativa TEI'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCreditModal(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {creditTypeToRequest === 'activation'
                ? 'Activa tu radar hoy mismo sin pagar de tu bolsillo. Exclusivo para conductores con vehículo aprobado.'
                : 'Adelanta saldo operativo para cubrir comisiones de viajes en efectivo, respaldado por tu Escala de Confianza.'}
            </p>

            {/* CONDICIONES CLARAS DE LA TARIFA FIJA (CERO INTERESES) */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 rounded-2xl p-3.5 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 font-black flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Tarifa de Gestión: $450 COP fijos
                </span>
                <span className="text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                  0% Interés Diario
                </span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Tarifa fija administrativa por evento de activación. Tienes <strong>3 días corridos (0 a 72h)</strong> para normalizar tu saldo sin ningún recargo adicional.
              </p>
              <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-800/80 flex justify-between">
                <span>Al 4to día sin cubrir saldo:</span>
                <span className="text-amber-300 font-bold">Cargo único de normalización: $2.000 COP</span>
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                🔒 <em>Uso exclusivo:</em> Saldo operativo de plataforma para pagar comisiones en carretera (no retirable a bancos externos).
              </div>
            </div>

            {/* MONTO */}
            {creditTypeToRequest === 'activation' ? (
              <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl p-3 mb-4 flex justify-between items-center">
                <span className="text-xs text-gray-300 font-bold">Monto del Cupo:</span>
                <span className="text-lg font-black text-emerald-400">$38.000 COP</span>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase mb-1">
                  <span>Monto a Solicitar (COP):</span>
                  <span className="text-cyan-400 font-normal">Máx: ${(walletData.credit_available_cop || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 flex items-center">
                  <span className="text-gray-400 font-bold mr-2">$</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    max={walletData.credit_available_cop || 10000}
                    value={creditAmountInput}
                    onChange={(e) => setCreditAmountInput(e.target.value)}
                    className="bg-transparent text-white font-black text-lg focus:outline-none w-full"
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Mínimo $10.000 COP · Tope máximo seguro: $77.000 COP
                </span>
              </div>
            )}

            {creditModalError && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{creditModalError}</span>
              </div>
            )}

            {creditModalSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{creditModalSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleRequestCredit}
                disabled={isRequestingCredit}
                className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98"
              >
                {isRequestingCredit ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Activando...</span>
                  </>
                ) : (
                  <>
                    <Gift size={16} />
                    <span>Activar Cupo en Billetera</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIQUIDAR CUPO ACTIVO */}
      {showPayCreditModal && walletData.active_credit && (
        <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Coins className="text-amber-400" size={20} />
                <h3 className="text-lg font-black text-white">Liquidar Cupo Operativo</h3>
              </div>
              <button 
                onClick={() => setShowPayCreditModal(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Liquida tu cupo pendiente para restablecer tu saldo disponible y hacer crecer tu Escala de Confianza (+ $4.500 COP).
            </p>

            {/* DETALLE DE LIQUIDACIÓN */}
            <div className="bg-gray-950 border border-amber-500/40 rounded-2xl p-3.5 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Saldo Adelantado:</span>
                <span className="font-bold text-white">${walletData.active_credit.principal_cop.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Días Transcurridos:</span>
                <span>{walletData.active_credit.days_elapsed} día(s)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tarifa Fija de Gestión:</span>
                <span className="font-bold text-cyan-300">+${(walletData.active_credit.admin_fee_cop || 450).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-800">
                <span className="text-gray-400">Cargo de Normalización:</span>
                {walletData.active_credit.is_overdue ? (
                  <span className="text-rose-400 font-bold">
                    +${(walletData.active_credit.overdue_fee_cop || 2000).toLocaleString('es-CO')} COP (Día 4+)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                    ✓ $0 COP (Plazo oportuno cumplido)
                  </span>
                )}
              </div>
              <div className="flex justify-between text-cyan-400 font-black text-sm pt-1.5 border-t border-gray-800">
                <span>Total a Cancelar:</span>
                <span>${walletData.active_credit.total_due_cop.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* SELECTOR MÉTODO DE PAGO */}
            <div className="mb-4">
              <label className="text-[11px] text-gray-400 font-bold uppercase block mb-2">
                Selecciona la Fuente de Pago:
              </label>
              <div className="space-y-2">
                {/* 1. Billetera del Conductor */}
                <button
                  type="button"
                  onClick={() => setPayCreditMethod('wallet_balance')}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                    payCreditMethod === 'wallet_balance'
                      ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${payCreditMethod === 'wallet_balance' ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800 text-emerald-400'}`}>
                      <Wallet size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Billetera de Conductor</div>
                      <div className="text-[11px] text-gray-400">
                        Disponible: ${balanceCOP.toLocaleString('es-CO')} COP
                      </div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payCreditMethod === 'wallet_balance' ? 'border-emerald-400 bg-emerald-400 text-gray-950' : 'border-gray-600'}`}>
                    {payCreditMethod === 'wallet_balance' && <CheckCircle2 size={12} className="stroke-[3]" />}
                  </div>
                </button>

                {/* 2. Banco TEI */}
                <button
                  type="button"
                  onClick={() => setPayCreditMethod('tei_bank')}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                    payCreditMethod === 'tei_bank'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${payCreditMethod === 'tei_bank' ? 'bg-cyan-500 text-gray-950' : 'bg-gray-800 text-cyan-400'}`}>
                      <Landmark size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Saldo Banco TEI</div>
                      <div className="text-[11px] text-cyan-300">
                        Disponible: ${(walletData.banco_balance_cop || 0).toLocaleString('es-CO')} COP
                      </div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payCreditMethod === 'tei_bank' ? 'border-cyan-400 bg-cyan-400 text-gray-950' : 'border-gray-600'}`}>
                    {payCreditMethod === 'tei_bank' && <CheckCircle2 size={12} className="stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>

            {payCreditError && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{payCreditError}</span>
              </div>
            )}

            {payCreditSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{payCreditSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowPayCreditModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handlePayCredit}
                disabled={isPayingCredit}
                className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
              >
                {isPayingCredit ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Procesando Pago...</span>
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    <span>Confirmar Pago</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RETIRO A BANCO / NEQUI (DISPONIBLE EN CUALQUIER MOMENTO) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="text-cyan-400" size={20} />
                <h3 className="text-lg font-black text-white">Retirar a Banco / Nequi</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            {/* CASO 0: BLOQUEO POR INTENTOS FALLIDOS (24 HORAS) */}
            {walletData.is_pin_locked ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock size={28} />
                </div>
                <h4 className="text-base font-black text-rose-300 mb-2">Retiros Bloqueados por Seguridad</h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Has superado el límite de <strong>3 intentos fallidos</strong> con tu Segunda Clave. Por seguridad de tu dinero, la función de retiros ha sido suspendida temporalmente por <strong>24 horas</strong>.
                </p>
                <div className="bg-gray-950 border border-rose-800/60 rounded-xl p-3 mb-6 text-xs text-rose-400 flex items-center justify-center gap-2">
                  <Clock size={16} />
                  <span>Tiempo restante de bloqueo: aprox. {walletData.pin_locked_hours || 24} hora(s)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
                >
                  Entendido
                </button>
              </div>
            ) : !walletData.is_kyc_verified ? (
              /* CASO 1: KYC NO VERIFICADO */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert size={28} />
                </div>
                <h4 className="text-base font-black text-white mb-2">Verificación KYC Requerida</h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Para proteger tu patrimonio contra fraudes y garantizar que solo tú puedas recibir el dinero de tus viajes, es obligatorio tener tu <strong>verificación de documentos y certificación bancaria</strong> aprobada en el sistema antes de poder realizar retiros.
                </p>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
                  >
                    Cerrar
                  </button>
                  <button 
                    type="button"
                    onClick={() => navigate('/dashboard/kyc')}
                    className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-1 shadow-lg shadow-amber-500/20"
                  >
                    <span>Completar Verificación KYC</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ) : !walletData.has_transaction_pin ? (
              /* CASO 2: SEGUNDA CLAVE NO CONFIGURADA */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={28} />
                </div>
                <h4 className="text-base font-black text-white mb-2">Segunda Clave Requerida</h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Aún no has configurado tu <strong>Segunda Clave de Retiros (PIN de Transacciones)</strong>. Esta clave es obligatoria para autorizar cualquier retiro de fondos y proteger tu cuenta contra accesos no autorizados.
                </p>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
                  >
                    Cerrar
                  </button>
                  <button 
                    type="button"
                    onClick={() => navigate('/dashboard/security')}
                    className="flex-[2] py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-1 shadow-lg shadow-cyan-500/20"
                  >
                    <span>Configurar Segunda Clave</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* CASO 3: KYC Y SEGUNDA CLAVE ACTIVOS - FORMULARIO PROTEGIDO */
              <>
                <p className="text-xs text-gray-400 mb-4">
                  Retira las ganancias de tus viajes hacia tu cuenta bancaria certificada cuando lo desees, en cualquier momento.
                </p>

                <div className="bg-gray-950/90 border border-cyan-500/40 rounded-2xl p-3 mb-4 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Saldo Disponible:</span>
                  <span className="text-base font-black text-cyan-400">
                    ${balanceCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <form onSubmit={handleStartWithdrawal} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1">Monto a Retirar (COP — Mín. $49.500 COP / $11 USD):</label>
                    <div className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 flex items-center">
                      <span className="text-gray-400 font-bold mr-2">$</span>
                      <input 
                        type="number"
                        min="49500"
                        step="1000"
                        max={balanceCOP}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Mínimo $49.500 COP ($11 USD)"
                        className="bg-transparent text-white font-black text-lg focus:outline-none w-full"
                        required
                      />
                    </div>
                    {(() => {
                      const valCop = parseFloat(withdrawAmount) || 0;
                      let feeUsd = 0;
                      if (valCop > 2000000) feeUsd = 2.20;
                      else if (valCop > 1200000) feeUsd = 1.10;
                      else if (valCop > 200000) feeUsd = 0.50;
                      const feeCop = Math.round(feeUsd * 4500);
                      return (
                        <div className="mt-2 p-2.5 bg-gray-950/90 border border-gray-800 rounded-xl text-[11px] text-gray-300 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Tarifa de uso del sistema:</span>
                            <span className={`font-bold ${feeCop > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {feeCop > 0
                                ? `+$${feeCop.toLocaleString('es-CO')} COP (+$${feeUsd.toFixed(2)} USD)`
                                : '$0 COP (Gratis hasta $200.000 COP)'}
                            </span>
                          </div>
                          {valCop > 0 && (
                            <div className="flex justify-between items-center pt-1 border-t border-gray-800 font-bold text-cyan-300">
                              <span>Total a descontar:</span>
                              <span>${(valCop + feeCop).toLocaleString('es-CO')} COP</span>
                            </div>
                          )}
                          <p className="text-[10px] text-gray-500 pt-0.5">
                            Tarifas: &gt;$200.000 COP (+$0.50 USD) · &gt;$1.200.000 COP (+$1.10 USD) · &gt;$2.000.000 COP (+$2.20 USD).
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* DESTINO BANCARIO CERTIFICADO POR KYC */}
                  <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-medium">Destino Bancario:</span>
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>Certificado por KYC</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Banco</span>
                        <span className="text-white font-bold">{walletData.verified_bank_name || bankName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Tipo de Cuenta</span>
                        <span className="text-white font-bold">{walletData.verified_account_type || accountType}</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[10px] text-gray-500 uppercase block font-bold">Número de Cuenta / Nequi</span>
                      <span className="text-cyan-300 font-mono font-bold">{walletData.verified_account_number || accountNumber}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-800/80">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Titular</span>
                        <span className="text-gray-300 font-bold truncate block">{walletData.verified_account_holder || accountHolder}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Documento C.C.</span>
                        <span className="text-gray-300 font-bold">{walletData.verified_document_id || documentId}</span>
                      </div>
                    </div>
                  </div>

                  {/* SEGUNDA CLAVE DE RETIROS CON CONTADOR DE INTENTOS */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] text-gray-300 font-bold uppercase flex items-center gap-1">
                        <Lock size={13} className="text-cyan-400" />
                        <span>Segunda Clave de Retiros (PIN):</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Máx. 3 intentos
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPin ? "text" : "password"}
                        value={transactionPin}
                        onChange={(e) => setTransactionPin(e.target.value)}
                        placeholder="Ingresa tu clave de transacciones"
                        className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold focus:outline-none focus:border-cyan-400"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                      <span>⚠️ Si se ingresa errónea 3 veces consecutivas, se bloqueará por 24 horas.</span>
                    </p>
                  </div>

                  {/* AVISO PLAZO DE 24 HORAS PARA HACERSE EFECTIVO */}
                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-[11px] text-cyan-200 flex items-start gap-2">
                    <Clock size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">Plazo de Validación Bancaria (Hasta 24 horas):</span>
                      <span>Tu solicitud entra en proceso de validación operativa y se hace efectiva en tu cuenta en un plazo de <strong>hasta 24 horas</strong>.</span>
                    </div>
                  </div>

                  {withdrawError && (
                    <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  {withdrawSuccess && (
                    <div className="bg-emerald-950/40 border border-emerald-500 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>{withdrawSuccess}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isWithdrawing}
                      className="flex-[2] py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-black rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98"
                    >
                      {isWithdrawing ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Verificando y Procesando...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Autorizar Retiro Protegido</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MOVEMENTS LIST */}
      <h3 className="text-base font-black mb-3 text-gray-200">Últimos Movimientos</h3>
      
      <div className="space-y-2.5">
        {walletData.movements.length === 0 ? (
          <div className="bg-gray-900/50 rounded-2xl p-6 text-center text-xs text-gray-500 border border-gray-800">
            Aún no tienes movimientos registrados en tu billetera.
          </div>
        ) : (
          walletData.movements.map((m, idx) => (
            <div key={idx} className="bg-gray-900/80 rounded-2xl p-3.5 flex justify-between items-center border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex justify-center items-center shrink-0 ${m.is_credit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {m.is_credit ? <ArrowUpRight size={18} /> : <Activity size={18} />}
                </div>
                <div className="truncate">
                  <p className="font-bold text-xs text-gray-200 truncate">{m.title}</p>
                  <p className="text-[10px] text-gray-500">{m.date || 'Reciente'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`font-black text-xs ${m.is_credit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.is_credit ? '+' : ''}${Math.abs(m.amount_cop || 0).toLocaleString('es-CO')}
                </span>
                <span className="text-[9px] text-gray-500 block uppercase font-bold">COP</span>
                {m.can_cancel && (
                  <button
                    onClick={() => handleCancelWithdrawal(m.withdrawal_id)}
                    disabled={cancellingWithdrawalId === m.withdrawal_id}
                    className="mt-1 text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 justify-end ml-auto"
                  >
                    <RefreshCw size={10} className={cancellingWithdrawalId === m.withdrawal_id ? "animate-spin" : ""} />
                    <span>{cancellingWithdrawalId === m.withdrawal_id ? "Cancelando..." : "Cancelar y Reintegrar"}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}
