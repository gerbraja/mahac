import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';

const MerchantPortal = () => {
        const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ pending_commission: 0, paid_commission: 0 });
    const [merchantConfig, setMerchantConfig] = useState({ commission_margin: 20.0, tax_pct: 0.0, withholding_pct: 0.0 });
    const [expandedTxId, setExpandedTxId] = useState(null);
    const [saleAmount, setSaleAmount] = useState('');
    const [scannedUserId, setScannedUserId] = useState('TEI-USER-');
    const [merchantName, setMerchantName] = useState('');
    const [loading, setLoading] = useState(false);
    const [clientDetails, setClientDetails] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    
    // Para simplificar y no requerir dependencias externas de QR en este momento,
    // permitimos ingreso manual del código (ID) que arroja el escáner al leer el QR.
    // Un escáner físico de QR actúa como un teclado, así que al enfocar el input y escanear,
    // el código se pega automáticamente.
    const inputRef = useRef(null);
 
    useEffect(() => {
        fetchData();
        // Check if user is merchant
        const checkMerchant = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.admin_role !== 'merchant' && res.data.admin_role !== 'comercio_aliado') {
                    navigate('/dashboard');
                } else {
                    setMerchantName(res.data.name);
                }
            } catch (e) {
                navigate('/login');
            }
        };
        checkMerchant();
    }, [navigate]);
 
    const fetchData = async () => {
        try {
            const [txRes, sumRes] = await Promise.all([
                api.get('/api/merchants/transactions'),
                api.get('/api/merchants/summary')
            ]);
            setTransactions(txRes.data);
            setSummary(sumRes.data);
            setMerchantConfig({
                commission_margin: sumRes.data.commission_margin ?? 20.0,
                tax_pct: sumRes.data.tax_pct ?? 0.0,
                withholding_pct: sumRes.data.withholding_pct ?? 0.0
            });
        } catch (error) {
            console.error("Error fetching merchant data", error);
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
                        <p className="text-blue-200 mt-1">Registra las compras de los afiliados TEI</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="text-blue-100 hover:text-white underline">
                        Volver al Sistema
                    </button>
                </div>

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

                    <form onSubmit={handleTransactionSubmit} className="space-y-6">
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

                        <button 
                            type="submit" 
                            disabled={loading || !saleAmount || !scannedUserId}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xl rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : 'REGISTRAR VENTA Y CALCULAR COMISIÓN'}
                        </button>
                    </form>
                </div>

                {/* History Table */}
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
