import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import MerchantStoreConfig from './MerchantStoreConfig';
import MerchantOrderManager from './MerchantOrderManager';
import { ShieldCheck, Award, Sparkles, Clock, Wallet, Landmark, CheckCircle2, AlertCircle, RefreshCw, Zap, ArrowRight, X } from 'lucide-react';

const MerchantPortal = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ pending_commission: 0, paid_commission: 0 });
    const [merchantConfig, setMerchantConfig] = useState({ commission_margin: 20.0, tax_pct: 0.0, withholding_pct: 0.0 });
    const [expandedTxId, setExpandedTxId] = useState(null);
    const [saleAmount, setSaleAmount] = useState('');
    const [scannedUserId, setScannedUserId] = useState('TEI-USER-');
    const [merchantName, setMerchantName] = useState('');
    const [merchantBalance, setMerchantBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [clientDetails, setClientDetails] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('registrar'); // 'registrar', 'liquidar', 'credito', 'tienda', 'pedidos'
    const [billingData, setBillingData] = useState(null);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingMessage, setBillingMessage] = useState('');
    const [posRequestId, setPosRequestId] = useState(null);
    const [posStatus, setPosStatus] = useState(null);
    const navigate = useNavigate();

    // Estados de Cupo de Confianza y Liquidez Operativa ($38.000 -> $97.000 COP)
    const [creditStatus, setCreditStatus] = useState(null);
    const [creditLoading, setCreditLoading] = useState(false);
    const [requestCreditLoading, setRequestCreditLoading] = useState(false);
    const [payCreditLoading, setPayCreditLoading] = useState(false);
    const [creditMsg, setCreditMsg] = useState('');
    const [creditError, setCreditError] = useState('');
    const [customCreditAmount, setCustomCreditAmount] = useState('38000');
    const [payCreditMethod, setPayCreditMethod] = useState('wallet_balance');
    
    // Para simplificar y no requerir dependencias externas de QR en este momento,
    // permitimos ingreso manual del código (ID) que arroja el escáner al leer el QR.
    // Un escáner físico de QR actúa como un teclado, así que al enfocar el input y escanear,
    // el código se pega automáticamente.
    const inputRef = useRef(null);
 
    useEffect(() => {
        fetchData();
        fetchCredit();
        // Check if user is merchant
        const checkMerchant = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.admin_role !== 'merchant' && res.data.admin_role !== 'comercio_aliado' && !res.data.is_merchant) {
                    navigate('/dashboard');
                } else {
                    setMerchantName(res.data.name);
                    setMerchantBalance(res.data.available_balance || 0);
                }
            } catch (e) {
                navigate('/login');
            }
        };
        checkMerchant();
    }, [navigate]);
 
    const fetchCredit = async () => {
        setCreditLoading(true);
        try {
            const res = await api.get('/api/merchants/credit-status');
            setCreditStatus(res.data);
            if (res.data?.credit_limit_cop) {
                setCustomCreditAmount(Math.min(res.data.credit_limit_cop, 38000).toString());
            }
        } catch (err) {
            console.error("Error al cargar cupo del comercio:", err);
        } finally {
            setCreditLoading(false);
        }
    };

    const handleRequestCredit = async (creditType = 'activation', amount = 38000) => {
        setRequestCreditLoading(true);
        setCreditMsg('');
        setCreditError('');
        try {
            const res = await api.post('/api/merchants/credit/request', {
                credit_type: creditType,
                amount_cop: parseFloat(amount)
            });
            setCreditMsg(`✅ ${res.data.message}`);
            await fetchCredit();
            fetchData();
        } catch (err) {
            setCreditError(err.response?.data?.detail || 'Error al solicitar el cupo.');
        } finally {
            setRequestCreditLoading(false);
        }
    };

    const handlePayCredit = async () => {
        setPayCreditLoading(true);
        setCreditMsg('');
        setCreditError('');
        try {
            const res = await api.post('/api/merchants/credit/pay', {
                payment_method: payCreditMethod
            });
            setCreditMsg(`✅ ${res.data.message}`);
            await fetchCredit();
            fetchData();
        } catch (err) {
            setCreditError(err.response?.data?.detail || 'Error al pagar el cupo.');
        } finally {
            setPayCreditLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const [txRes, sumRes, billRes] = await Promise.all([
                api.get('/api/merchants/transactions'),
                api.get('/api/merchants/summary'),
                api.get('/api/merchants/pending-billing').catch(() => ({ data: null }))
            ]);
            setTransactions(txRes.data);
            setSummary(sumRes.data);
            if (billRes.data) {
                setBillingData(billRes.data);
            }
            setMerchantConfig({
                commission_margin: sumRes.data.commission_margin ?? 20.0,
                tax_pct: sumRes.data.tax_pct ?? 0.0,
                withholding_pct: sumRes.data.withholding_pct ?? 0.0
            });
        } catch (error) {
            console.error("Error fetching merchant data", error);
        }
    };

    const handleCreateBillingOrder = async () => {
        setBillingLoading(true);
        setBillingMessage('');
        try {
            const res = await api.post('/api/merchants/create-billing-order');
            setBillingMessage('✅ Orden de liquidación generada. Redirigiendo a pasarela...');
            // In a real scenario, we might redirect to a Wompi checkout URL,
            // or to the dashboard's "Mis Pedidos" where they can pay.
            // Since TEI has a payment page, we can redirect there.
            setTimeout(() => {
                navigate(`/dashboard/payment/${res.data.order_id}`);
            }, 1500);
        } catch (error) {
            setBillingMessage(`❌ Error: ${error.response?.data?.detail || 'No se pudo generar la orden.'}`);
            setBillingLoading(false);
        }
    };

    const calculateLiveBreakdown = () => {
        const amount = parseFloat(saleAmount);
        if (isNaN(amount) || amount <= 0) return null;

        const margin = merchantConfig.commission_margin;
        const tax = merchantConfig.tax_pct;
        const withholding = merchantConfig.withholding_pct;

        const base = amount / (1 + tax / 100);
        const gross = base * (margin / 100);
        const net = gross * (1 - withholding / 100);
        const withholdingAmount = gross * (withholding / 100);

        return {
            base,
            gross,
            net,
            margin,
            tax,
            withholding,
            withholdingAmount
        };
    };

    const getTxBreakdown = (tx) => {
        const margin = tx.commission_margin ?? merchantConfig.commission_margin;
        const tax = merchantConfig.tax_pct;
        const withholding = merchantConfig.withholding_pct;

        const base = tx.sale_amount / (1 + tax / 100);
        const gross = base * (margin / 100);
        const withholdingAmount = gross * (withholding / 100);
        const net = gross * (1 - withholding / 100);

        return {
            base,
            gross,
            withholdingAmount,
            net
        };
    };

    const breakdown = calculateLiveBreakdown();

    useEffect(() => {
        const trimmed = scannedUserId.trim();
        if (!trimmed || trimmed === 'TEI-USER-') {
            setClientDetails(null);
            setLookupError('');
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLookupLoading(true);
            setLookupError('');
            setClientDetails(null);
            try {
                const res = await api.get(`/api/merchants/client-lookup?q=${encodeURIComponent(trimmed)}`);
                setClientDetails(res.data);
            } catch (error) {
                setLookupError(error.response?.data?.detail || 'No se encontró el afiliado');
            } finally {
                setLookupLoading(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [scannedUserId]);

    const handleScannedUserIdChange = (e) => {
        let val = e.target.value;
        
        // 1. Clean duplicates from scanning (e.g. TEI-USER-TEI-USER-7)
        if (val.includes('TEI-USER-TEI-USER-')) {
            val = val.replace(/TEI-USER-TEI-USER-/g, 'TEI-USER-');
        }
        
        // 2. Auto-prepend prefix if they typed a digit and it doesn't have it
        if (val && /^\d+$/.test(val) && !val.startsWith('TEI-USER-')) {
            val = 'TEI-USER-' + val;
        }
        
        setScannedUserId(val);
    };

    const pollPOSStatus = async (reqId) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/api/wallet/pos/status/${reqId}`);
                if (res.data.status === 'approved') {
                    clearInterval(interval);
                    setPosStatus('approved');
                    setMessage('✅ ¡PAGO EXITOSO! El dinero ha sido abonado a tu cuenta.');
                    setSaleAmount('');
                    setScannedUserId('TEI-USER-');
                    setClientDetails(null);
                    fetchData(); // refresh balances
                    setTimeout(() => setPosStatus(null), 5000);
                } else if (res.data.status === 'rejected') {
                    clearInterval(interval);
                    setPosStatus('rejected');
                    setMessage('❌ El cliente ha rechazado el pago.');
                    setTimeout(() => setPosStatus(null), 5000);
                }
            } catch (e) {
                // Ignore transient errors
            }
        }, 3000);
        
        // Timeout after 3 minutes
        setTimeout(() => {
            clearInterval(interval);
            if (posStatus === 'pending') {
                setPosStatus(null);
                setMessage('⚠️ Tiempo de espera agotado.');
            }
        }, 180000);
    };

    const handlePOSRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setPosStatus('pending');
        
        try {
            const rawId = scannedUserId.trim().replace('TEI-USER-', '');
            const payload = {
                customer_identifier: rawId,
                amount: parseFloat(saleAmount)
            };
            const res = await api.post('/api/wallet/pos/request', payload);
            setPosRequestId(res.data.request_id);
            pollPOSStatus(res.data.request_id);
        } catch (error) {
            setMessage(`❌ Error al crear cobro: ${error.response?.data?.detail || error.message}`);
            setPosStatus(null);
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        try {
            const payload = {
                user_id: scannedUserId.trim(),
                sale_amount: parseFloat(saleAmount)
            };
            
            await api.post('/api/merchants/transaction', payload);
            setMessage('✅ Venta registrada exitosamente. ¡Comisiones generadas y correo enviado!');
            setSaleAmount('');
            setScannedUserId('TEI-USER-');
            setClientDetails(null);
            fetchData();
            
            // Reenfocar para la siguiente venta
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.detail || 'No se pudo registrar la venta.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl space-y-6">
                
                <div className="flex justify-between items-center bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
                    <div>
                        <h1 className="text-3xl font-bold">🏪 Portal {merchantName || 'Comercio Aliado'}</h1>
                        <p className="text-blue-200 mt-1">Registra compras y liquida comisiones</p>
                    </div>
                </div>

                {/* Alerta de Normalización Operativa (Mora en Cupo) */}
                {creditStatus?.active_credit?.is_overdue && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🚨</span>
                            <div>
                                <h3 className="text-rose-800 font-bold">Cupo en Normalización Operativa (Día {creditStatus.active_credit.days_elapsed})</h3>
                                <p className="text-rose-700 text-xs mt-0.5">
                                    Has superado los 3 días de plazo oportuno. Se aplicó el cargo de normalización de <strong>+$2.000 COP</strong>. Liquida tu cupo para reactivar el registro de transacciones.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('credito')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 shadow transition"
                        >
                            Pagar Cupo Ahora
                        </button>
                    </div>
                )}

                {/* Alerta de Saldo Bajo en Cupo (<= $5.000 COP) */}
                {creditStatus?.active_credit?.is_low_balance && !creditStatus?.active_credit?.is_overdue && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">⚠️</span>
                            <div>
                                <h3 className="text-amber-900 font-bold">¡Cupo de Respaldo Bajo (${(creditStatus.active_credit.remaining_balance_cop || 0).toLocaleString('es-CO')} COP restantes)!</h3>
                                <p className="text-amber-800 text-xs mt-0.5">
                                    Has entrado en los <strong>3 días de plazo oportuno</strong> para recargar y restaurar tu cupo. Paga lo consumido para mantener tus ventas habilitadas.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('credito')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 shadow transition"
                        >
                            Restaurar Cupo (${(creditStatus.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP)
                        </button>
                    </div>
                )}

                {/* Alerta de Saldo Bajo / Invitación a Activar Cupo */}
                {merchantBalance < (17000 / 4500.0) && !creditStatus?.active_credit && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">⚡</span>
                            <div>
                                <h3 className="text-emerald-900 font-bold">¡Tienes un Cupo de Respaldo de $38.000 COP!</h3>
                                <p className="text-emerald-700 text-xs mt-0.5">
                                    Activa tu Cupo Operativo sin intereses (Tarifa $450 COP). El plazo de 3 días solo inicia si tu saldo queda en ≤ $5.000 COP.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('credito')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 shadow transition"
                        >
                            Activar Cupo
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 overflow-x-auto gap-1">
                    <button
                        onClick={() => setActiveTab('registrar')}
                        className={`whitespace-nowrap px-5 py-3 font-bold text-base border-b-4 transition-colors ${activeTab === 'registrar' ? 'border-blue-600 text-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        📝 Registrar Venta (Física)
                    </button>
                    <button
                        onClick={() => setActiveTab('credito')}
                        className={`whitespace-nowrap px-5 py-3 font-bold text-base border-b-4 transition-colors flex items-center gap-2 ${activeTab === 'credito' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        🛡️ Cupo de Confianza ($38k - $97k)
                        {creditStatus?.active_credit?.is_overdue ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                        ) : creditStatus?.can_request_credit && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('liquidar')}
                        className={`whitespace-nowrap px-5 py-3 font-bold text-base border-b-4 transition-colors ${activeTab === 'liquidar' ? 'border-blue-600 text-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        💰 Liquidar Comisiones
                    </button>
                    <button
                        onClick={() => setActiveTab('tienda')}
                        className={`whitespace-nowrap px-5 py-3 font-bold text-base border-b-4 transition-colors ${activeTab === 'tienda' ? 'border-purple-600 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        🏬 Mi Tienda Virtual
                    </button>
                    <button
                        onClick={() => setActiveTab('pedidos')}
                        className={`whitespace-nowrap px-5 py-3 font-bold text-base border-b-4 transition-colors ${activeTab === 'pedidos' ? 'border-purple-600 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        📦 Pedidos Web
                    </button>
                </div>

                {activeTab === 'tienda' && <MerchantStoreConfig />}
                
                {activeTab === 'pedidos' && <MerchantOrderManager />}

                {/* SECCIÓN CUPO DE LIQUIDEZ Y CONFIANZA */}
                {activeTab === 'credito' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Mensajes de feedback */}
                        {creditMsg && (
                            <div className="p-4 rounded-xl font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-between">
                                <span>{creditMsg}</span>
                                <button onClick={() => setCreditMsg('')} className="text-emerald-700 hover:text-emerald-900"><X size={18} /></button>
                            </div>
                        )}
                        {creditError && (
                            <div className="p-4 rounded-xl font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-between">
                                <span>❌ {creditError}</span>
                                <button onClick={() => setCreditError('')} className="text-rose-700 hover:text-rose-900"><X size={18} /></button>
                            </div>
                        )}

                        {/* TARJETA PRINCIPAL DEL CUPO */}
                        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-500/30 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                                        <ShieldCheck size={16} />
                                        <span>Cupo de Confianza & Avance Operativo TEI</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white">
                                        ${(creditStatus?.credit_limit_cop || 38000).toLocaleString('es-CO')} <span className="text-sm font-normal text-emerald-300">COP Cupo Total</span>
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Equivalente a <strong className="text-white">${((creditStatus?.credit_limit_cop || 38000) / 4500).toFixed(2)} USD</strong> (1 USD = $4.500 COP)
                                    </p>
                                </div>

                                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-4 text-right shrink-0">
                                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Ciclos Cumplidos</p>
                                    <div className="flex items-center justify-end gap-1.5 text-2xl font-black text-emerald-400">
                                        <Award size={22} className="text-amber-400" />
                                        <span>{creditStatus?.paid_credits_count || 0} Ciclo(s)</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-300 font-medium">+2 USD (+$9.000 COP) por ciclo</p>
                                </div>
                            </div>

                            {/* BARRA DE PROGRESO DE CONFIANZA */}
                            <div className="bg-gray-950/70 border border-gray-800 rounded-2xl p-4 mb-6">
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <span className="text-gray-300 font-bold flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-400" />
                                        Escala de Confianza Comercial
                                    </span>
                                    <span className="text-cyan-300 font-bold font-mono">
                                        Base $38.000 COP ➔ Tope $97.000 COP
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, Math.max(12, (((creditStatus?.credit_limit_cop || 38000) - 38000) / (97000 - 38000)) * 100))}%`
                                        }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-medium">
                                    <span>Avance Inicial: $38.000 COP</span>
                                    <span className="text-emerald-300 font-bold">Tope Máximo: $97.000 COP (+${(creditStatus?.bonus_cupo_cop || 0).toLocaleString('es-CO')} ganado)</span>
                                </div>
                            </div>

                            {/* REGLAS OPERATIVAS FIJAS (CERO INTERESES - BLINDAJE LEGAL) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-sm">
                                        $
                                    </span>
                                    <div>
                                        <p className="font-bold text-gray-200">Tarifa Fija de Gestión</p>
                                        <p className="text-[11px] text-emerald-400 font-bold">$450 COP al activar · Cero Intereses</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 font-bold shrink-0 text-sm">
                                        📅
                                    </span>
                                    <div>
                                        <p className="font-bold text-gray-200">Plazo Oportuno (3 Días)</p>
                                        <p className="text-[11px] text-cyan-300">Se activa solo al quedar ≤ $5.000 COP</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400 font-bold shrink-0 text-sm">
                                        🚨
                                    </span>
                                    <div>
                                        <p className="font-bold text-gray-200">Día 4 en adelante</p>
                                        <p className="text-[11px] text-amber-300">Normalización única de +$2.000 COP</p>
                                    </div>
                                </div>
                            </div>

                            {/* ESTADO ACTUAL DEL CUPO */}
                            {creditStatus?.active_credit ? (
                                /* CUPO ACTIVO PENDIENTE DE PAGO O CONSUMIÉNDOSE */
                                <div className={`rounded-2xl p-5 border shadow-xl ${
                                    creditStatus.active_credit.is_overdue
                                        ? 'bg-rose-950/70 border-rose-500/80'
                                        : creditStatus.active_credit.is_low_balance
                                        ? 'bg-amber-950/70 border-amber-500/80'
                                        : 'bg-gray-800/90 border-emerald-500/50'
                                }`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className={creditStatus.active_credit.is_overdue ? 'text-rose-400 animate-pulse' : (creditStatus.active_credit.is_clock_running ? 'text-amber-400 animate-pulse' : 'text-emerald-400')} />
                                            <h3 className={`font-black text-sm uppercase tracking-wide ${
                                                creditStatus.active_credit.is_overdue 
                                                    ? 'text-rose-300' 
                                                    : (creditStatus.active_credit.is_clock_running ? 'text-amber-300' : 'text-emerald-300')
                                            }`}>
                                                {creditStatus.active_credit.is_overdue 
                                                    ? 'Cupo en Normalización Operativa' 
                                                    : (creditStatus.active_credit.is_clock_running ? 'Plazo Oportuno Activo (Saldo ≤ $5.000 COP)' : 'Cupo Operativo Disponible')}
                                            </h3>
                                        </div>
                                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                                            creditStatus.active_credit.is_overdue
                                                ? 'bg-rose-900/80 border-rose-500 text-rose-200'
                                                : creditStatus.active_credit.is_clock_running
                                                ? 'bg-amber-900/80 border-amber-500 text-amber-200'
                                                : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                        }`}>
                                            {creditStatus.active_credit.is_clock_running 
                                                ? `Día ${creditStatus.active_credit.days_elapsed} ${creditStatus.active_credit.is_overdue ? '(Vencido)' : 'de 3'}`
                                                : 'Sin plazo (Protegido)'}
                                        </span>
                                    </div>

                                    {/* ALERTA DE MORA */}
                                    {creditStatus.active_credit.is_overdue && (
                                        <div className="bg-rose-900/50 border border-rose-500/60 rounded-xl p-3 mb-4 text-xs text-rose-200 leading-relaxed">
                                            ⚠️ Has superado los 3 días de plazo oportuno. Se aplicó el cargo único de normalización de <strong>+$2.000 COP</strong>. Por favor liquida tu cupo para mantener habilitadas tus ventas y sumar <strong>+2 USD TEI</strong> a tu cupo de confianza para tu próximo ciclo.
                                        </div>
                                    )}

                                    {/* ALERTA DE SALDO BAJO (<= $5.000 COP) */}
                                    {creditStatus.active_credit.is_low_balance && !creditStatus.active_credit.is_overdue && (
                                        <div className="bg-amber-900/60 border border-amber-500/80 rounded-xl p-3.5 mb-4 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                                            <span className="text-lg shrink-0">⚠️</span>
                                            <div>
                                                <strong>¡Atención: Saldo disponible bajo!</strong> Te quedan ${(creditStatus.active_credit.remaining_balance_cop || 0).toLocaleString('es-CO')} COP en tu cupo de respaldo. Recarga y liquida lo consumido para restablecer tu cupo a ${(creditStatus.active_credit.principal_cop || 38000).toLocaleString('es-CO')} COP y poder seguir facturando ventas sin pausas.
                                            </div>
                                        </div>
                                    )}

                                    {/* DETALLES FINANCIEROS DEL CUPO */}
                                    <div className="bg-gray-950/80 rounded-xl p-4 text-xs space-y-2.5 border border-gray-700 mb-5">
                                        <div className="flex justify-between text-gray-300">
                                            <span>Cupo Total Aprobado:</span>
                                            <span className="font-bold text-white">${(creditStatus.active_credit.principal_cop || 38000).toLocaleString('es-CO')} COP</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>(-) Comisiones Deducidas (Consumido):</span>
                                            <span className="font-bold text-amber-400">-${(creditStatus.active_credit.used_commission_cop || 0).toLocaleString('es-CO')} COP</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300 font-bold border-b border-gray-800 pb-2">
                                            <span className="text-emerald-300">Saldo Disponible de Respaldo:</span>
                                            <span className={`text-sm ${creditStatus.active_credit.is_low_balance ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                ${(creditStatus.active_credit.remaining_balance_cop || 0).toLocaleString('es-CO')} COP
                                            </span>
                                        </div>

                                        {creditStatus.active_credit.overdue_fee_cop > 0 && (
                                            <div className="flex justify-between text-rose-300 font-bold">
                                                <span>(+) Cargo Normalización Operativa (Día 4+):</span>
                                                <span>+${creditStatus.active_credit.overdue_fee_cop.toLocaleString('es-CO')} COP</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 text-base font-black text-cyan-300">
                                            <span>Total a Pagar para Restaurar Cupo:</span>
                                            <span>${(creditStatus.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP</span>
                                        </div>
                                    </div>

                                    {/* MÉTODOS DE PAGO */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-300 uppercase">Selecciona de dónde pagar para restaurar el cupo:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                                                payCreditMethod === 'wallet_balance'
                                                    ? 'bg-emerald-950/60 border-emerald-400 text-white'
                                                    : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="payMethod"
                                                    value="wallet_balance"
                                                    checked={payCreditMethod === 'wallet_balance'}
                                                    onChange={(e) => setPayCreditMethod(e.target.value)}
                                                    className="hidden"
                                                />
                                                <Wallet size={20} className="text-emerald-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-white">Billetera TEI</p>
                                                    <p className="text-[11px] text-gray-400">Saldo: ${(creditStatus.wallet_balance_cop || 0).toLocaleString('es-CO')} COP</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                                                payCreditMethod === 'tei_bank'
                                                    ? 'bg-cyan-950/60 border-cyan-400 text-white'
                                                    : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="payMethod"
                                                    value="tei_bank"
                                                    checked={payCreditMethod === 'tei_bank'}
                                                    onChange={(e) => setPayCreditMethod(e.target.value)}
                                                    className="hidden"
                                                />
                                                <Landmark size={20} className="text-cyan-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-white">Banco TEI</p>
                                                    <p className="text-[11px] text-gray-400">Saldo: ${(creditStatus.banco_balance_cop || 0).toLocaleString('es-CO')} COP</p>
                                                </div>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handlePayCredit}
                                            disabled={payCreditLoading || (creditStatus.active_credit.total_due_cop === 0 && !creditStatus.active_credit.is_overdue)}
                                            className="w-full mt-3 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {payCreditLoading 
                                                ? 'Procesando Pago...' 
                                                : creditStatus.active_credit.total_due_cop > 0
                                                ? `💳 Pagar y Restaurar Cupo (${(creditStatus.active_credit.total_due_cop || 0).toLocaleString('es-CO')} COP)`
                                                : '✅ Cupo al 100% (Sin saldo pendiente)'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* CUPO DISPONIBLE PARA ACTIVAR */
                                <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                                        <Zap size={20} className="text-amber-400" />
                                        Activar Cupo de Respaldo Operativo
                                    </h3>
                                    <p className="text-xs text-gray-300 mb-5 leading-relaxed">
                                        Respaldo automático para comisiones TEI. La tarifa fija de $450 COP se descuenta de inmediato al activar. 
                                        El plazo de 3 días <strong>solo comenzará a correr si tu saldo disponible de cupo llega a $5.000 COP o menos</strong>.
                                    </p>

                                    {!creditStatus?.activation_loan_used ? (
                                        /* AVANCE DE BIENVENIDA INICIAL ($38.000 COP) */
                                        <div className="bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <span className="bg-emerald-900/80 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-600 uppercase">
                                                    Beneficio de Bienvenida
                                                </span>
                                                <h4 className="text-2xl font-black text-emerald-300 mt-1">$38.000 COP</h4>
                                                <p className="text-xs text-gray-300">Activa tu cupo comercial hoy mismo sin costo por adelantado.</p>
                                            </div>
                                            <button
                                                onClick={() => handleRequestCredit('activation', 38000)}
                                                disabled={requestCreditLoading}
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                                            >
                                                {requestCreditLoading ? 'Activando...' : '⚡ Activar $38.000 COP Ahora'}
                                            </button>
                                        </div>
                                    ) : (
                                        /* AVANCE RESPALDADO POR ESCALA DE CONFIANZA */
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-950/70 p-4 rounded-xl border border-gray-700">
                                                <div>
                                                    <p className="text-xs text-gray-400 font-semibold">Cupo Máximo Disponible:</p>
                                                    <p className="text-2xl font-black text-cyan-400">
                                                        ${(creditStatus?.credit_limit_cop || 38000).toLocaleString('es-CO')} COP
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-semibold">Próximo Salto de Confianza:</p>
                                                    <p className="text-sm font-bold text-emerald-400">
                                                        +${(creditStatus?.confidence_step_cop || 9000).toLocaleString('es-CO')} COP (+2 USD TEI)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                                <div className="relative w-full sm:w-2/3">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        min="10000"
                                                        max={creditStatus?.credit_limit_cop || 97000}
                                                        step="1000"
                                                        value={customCreditAmount}
                                                        onChange={(e) => setCustomCreditAmount(e.target.value)}
                                                        className="w-full bg-gray-950 text-white font-bold text-lg p-3.5 pl-8 rounded-xl border border-gray-700 focus:border-cyan-400 outline-none"
                                                        placeholder="Monto a solicitar (COP)"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleRequestCredit('vault_backed', customCreditAmount)}
                                                    disabled={requestCreditLoading || !customCreditAmount || parseFloat(customCreditAmount) < 10000}
                                                    className="w-full sm:w-1/3 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg transition disabled:opacity-50"
                                                >
                                                    {requestCreditLoading ? 'Solicitando...' : '⚡ Desembolsar Cupo'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'registrar' && (
                    <>
                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-yellow-500">
                        <p className="text-gray-500 text-sm font-bold uppercase">Deuda Pendiente con TEI</p>
                        <h3 className="text-3xl font-black text-gray-800">
                            ${summary.pending_commission.toLocaleString()} COP
                        </h3>
                        <p className="text-xs text-gray-400 mt-2">Paga esta factura a fin de mes para liberar las comisiones.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-green-500">
                        <p className="text-gray-500 text-sm font-bold uppercase">Total Pagado Histórico</p>
                        <h3 className="text-3xl font-black text-gray-800">
                            ${summary.paid_commission.toLocaleString()} COP
                        </h3>
                        <p className="text-xs text-gray-400 mt-2">Comisiones transferidas exitosamente.</p>
                    </div>
                </div>

                {/* Main Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        📷 Escanear Venta
                    </h2>
                    
                    {message && (
                        <div className={`p-4 rounded-lg mb-6 font-bold ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">1. Código, ID o Usuario del Afiliado (Escanea o escribe)</label>
                            <input 
                                ref={inputRef}
                                type="text" 
                                required
                                placeholder="Escribe el código (Ej: TEI-USER-7 o username)..."
                                value={scannedUserId}
                                onChange={handleScannedUserIdChange}
                                className="w-full text-xl p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all font-mono"
                            />
                            
                            {/* Affiliate Verification Area */}
                            <div className="mt-2 min-h-[40px]">
                                {lookupLoading && (
                                    <p className="text-sm text-gray-500 animate-pulse">⏳ Buscando información del afiliado...</p>
                                )}
                                {lookupError && (
                                    <p className="text-sm text-red-500 font-semibold">❌ {lookupError}</p>
                                )}
                                {clientDetails && (
                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-green-800 font-bold uppercase tracking-wider">Afiliado Confirmado</p>
                                            <p className="text-base text-gray-800 font-bold">{clientDetails.name}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-xs text-gray-500">Usuario: <strong>@{clientDetails.username}</strong></p>
                                            <p className="text-xs text-gray-500">Email: <strong>{clientDetails.email}</strong></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">2. Monto Total de la Compra (COP)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">$</span>
                                <input 
                                    type="number" 
                                    required
                                    min="1000"
                                    placeholder="Ej: 50000"
                                    value={saleAmount}
                                    onChange={(e) => setSaleAmount(e.target.value)}
                                    className="w-full text-2xl p-4 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring focus:ring-green-200 transition-all font-bold text-gray-800"
                                />
                            </div>
                            
                            {breakdown && (
                                <div className="mt-4 p-4 bg-blue-50/30 border border-blue-100 rounded-xl space-y-2 text-sm text-gray-700 animate-fadeIn">
                                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2 flex justify-between">
                                        <span>📊 Desglose Estimado de Cuentas</span>
                                        <span className="text-xs text-gray-500 font-normal">Base Gravable: ${breakdown.base.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </h4>
                                    <div className="flex justify-between items-center py-0.5">
                                        <span>📈 Comisión Pactada ({breakdown.margin}%):</span>
                                        <span className="font-semibold text-gray-900">${breakdown.gross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </div>
                                    {breakdown.withholding > 0 && (
                                        <div className="flex justify-between items-center py-0.5 text-red-600">
                                            <span>✂️ Retención de Impuestos ({breakdown.withholding}%):</span>
                                            <span className="font-semibold">-${breakdown.withholdingAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center border-t border-dashed border-gray-300 pt-2 font-black text-base text-blue-900">
                                        <span>🏦 Comisión Final a pagar a TEI:</span>
                                        <span>${breakdown.net.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </div>
                                </div>
                            )}
                        </div>

                            {posStatus === 'pending' ? (
                                <div className="p-8 text-center bg-blue-50 border-2 border-blue-400 rounded-2xl animate-pulse">
                                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <h3 className="text-xl font-bold text-blue-800 mb-2">Esperando al Cliente...</h3>
                                    <p className="text-blue-600">Pídele al cliente que abra su aplicación y apruebe el cobro de ${saleAmount} USD.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleTransactionSubmit}
                                        disabled={loading || !saleAmount || !clientDetails}
                                        className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all shadow disabled:opacity-50"
                                    >
                                        💵 Pago en Efectivo
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={handlePOSRequest}
                                        disabled={loading || !saleAmount || !clientDetails}
                                        className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
                                    >
                                        💳 Datáfono (Saldo)
                                    </button>
                                </div>
                            )}
                    </form>
                </div>
                </>
                )}

                {activeTab === 'liquidar' && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Liquidar Comisiones (Intermediación)</h2>
                        <p className="text-gray-600 mb-6">Autogestiona el pago de las comisiones generadas por las ventas a afiliados TEI.</p>
                        
                        {billingMessage && (
                            <div className={`p-4 rounded-lg mb-6 font-bold ${billingMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {billingMessage}
                            </div>
                        )}

                        {!billingData ? (
                            <div className="text-center py-10 text-gray-500 animate-pulse">Cargando estado de cuenta...</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-semibold">Comisiones Adeudadas (Base):</span>
                                        <span className="text-xl font-bold text-gray-800">${billingData.base_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-semibold">IVA (19%):</span>
                                        <span className="text-lg font-semibold text-gray-600">+ ${billingData.iva_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-xl font-black text-blue-900">Total a Liquidar:</span>
                                        <span className="text-3xl font-black text-blue-900">${billingData.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                    </div>
                                </div>

                                {!billingData.can_bill ? (
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-bold">Monto mínimo no alcanzado</p>
                                            <p className="text-sm mt-1">El cobro actual de comisiones no supera el umbral mínimo de <strong>${billingData.minimum_required.toLocaleString()} COP</strong>. Este saldo se acumulará (rollover) para el siguiente mes de forma automática.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3">
                                        <span className="text-2xl">✅</span>
                                        <div>
                                            <p className="font-bold">Disponible para Liquidación</p>
                                            <p className="text-sm mt-1">Puedes generar la orden de pago y proceder a la pasarela de Wompi.</p>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleCreateBillingOrder}
                                    disabled={billingLoading || !billingData.can_bill}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-700 text-white font-black text-xl rounded-xl shadow-lg hover:from-green-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {billingLoading ? 'Generando Orden...' : 'PAGAR INTERMEDIACIÓN COMERCIAL'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Historial Reciente</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 text-gray-600 text-sm">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">Fecha</th>
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Monto Venta</th>
                                    <th className="p-3">Comisión Generada</th>
                                    <th className="p-3 rounded-tr-lg">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-gray-500">No hay transacciones registradas aún.</td>
                                    </tr>
                                ) : (
                                    transactions.map(tx => {
                                        const isExpanded = expandedTxId === tx.id;
                                        const txBreakdown = isExpanded ? getTxBreakdown(tx) : null;
                                        return (
                                            <React.Fragment key={tx.id}>
                                                <tr 
                                                    className="hover:bg-gray-50 cursor-pointer transition-colors" 
                                                    onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                                                    title="Click para ver desglose de cuentas"
                                                >
                                                    <td className="p-3 text-sm text-gray-600">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-800">{tx.client_name}</td>
                                                    <td className="p-3 text-gray-800">${tx.sale_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                    <td className="p-3 text-blue-750">
                                                        <div className="flex items-center gap-1.5 font-bold text-blue-600">
                                                            <span>${tx.commission_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                            <span className="text-[10px] text-gray-400 font-normal underline hover:text-blue-500">(desglose)</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        {tx.status === 'pending_merchant_payment' ? (
                                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Por Pagar a TEI</span>
                                                        ) : (
                                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Pagado ✓</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {isExpanded && txBreakdown && (
                                                    <tr className="bg-blue-50/20">
                                                        <td colSpan="5" className="p-4 border-l-4 border-blue-500 bg-gray-50/50">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
                                                                <div>
                                                                    <p className="text-gray-400 uppercase font-bold tracking-wider">Base Gravable ({merchantConfig.tax_pct}% IVA):</p>
                                                                    <p className="text-sm font-bold text-gray-800 mt-1">${txBreakdown.base.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-400 uppercase font-bold tracking-wider">📈 Comisión Pactada ({tx.commission_margin || merchantConfig.commission_margin}%):</p>
                                                                    <p className="text-sm font-bold text-gray-800 mt-1">${txBreakdown.gross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</p>
                                                                </div>
                                                                {merchantConfig.withholding_pct > 0 && (
                                                                    <div>
                                                                        <p className="text-gray-400 uppercase font-bold tracking-wider">✂️ Retención ({merchantConfig.withholding_pct}%):</p>
                                                                        <p className="text-sm font-bold text-red-600 mt-1">-${txBreakdown.withholdingAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 text-xs text-blue-900 font-bold border-t border-dashed border-gray-300 pt-2 flex justify-between max-w-md">
                                                                <span>🏦 Comisión Final a pagar a TEI:</span>
                                                                <span>${tx.commission_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} COP</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MerchantPortal;
