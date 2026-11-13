import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';
import SimpleErrorBoundary from '../../components/SimpleErrorBoundary';
import EarningsCard from '../../components/dashboard/EarningsCard';
import WithdrawalModal from './components/WithdrawalModal';
import TransferModal from './components/TransferModal';

// Componente para animar números
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <React.Fragment>
            {displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </React.Fragment>
    );
};

const WalletView = () => {
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assets');
    const [showNumbers, setShowNumbers] = useState(false);
    const [withdrawalStatus, setWithdrawalStatus] = useState(null);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalModalTab, setWithdrawalModalTab] = useState('withdraw');
    const [transferHistory, setTransferHistory] = useState([]);

    // Retenciones
    const [certYear, setCertYear] = useState(new Date().getFullYear() - 1);
    const [certData, setCertData] = useState(null);
    const [certLoading, setCertLoading] = useState(false);
    const [certError, setCertError] = useState(null);

    useEffect(() => {
        console.log("APP VERSION: WALLET_COP_FIXED_V3"); // Cache Buster
        fetchData();
        // Animation trigger
        setTimeout(() => setShowNumbers(true), 100);
    }, []);

    const fetchCertificate = async (year) => {
        setCertLoading(true);
        setCertError(null);
        setCertData(null);
        try {
            const res = await api.get(`/api/wallet/withholding/certificate/${year}`);
            setCertData(res.data);
        } catch (err) {
            setCertError(err.response?.data?.detail || 'Error al cargar el certificado.');
        } finally {
            setCertLoading(false);
        }
    };

    const [errorMsg, setErrorMsg] = useState(null);

    const fetchData = async () => {
        try {
            setErrorMsg(null);
            const res = await api.get('/api/wallet/summary');
            setWalletData(res.data);

            // Fetch withdrawal status
            try {
                const statusRes = await api.get('/api/wallet/withdrawal-status');
                setWithdrawalStatus(statusRes.data);
            } catch (wErr) {
                console.warn("Could not fetch withdrawal status", wErr);
            }

            // Fetch transfer history
            try {
                const transferRes = await api.get('/api/wallet/transfers/history');
                setTransferHistory(transferRes.data || []);
            } catch (tErr) {
                console.warn("Could not fetch transfer history", tErr);
                setTransferHistory([]);
            }
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            setErrorMsg(error.response?.data?.detail || error.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
    );

    if (!walletData) return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
            <p className="font-bold text-xl">⚠️ Error de conexión</p>
            <p className="font-mono text-sm mt-2 p-2 bg-red-100 rounded">{errorMsg || "No se pudieron cargar los datos."}</p>
            <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
                Reintentar
            </button>
        </div>
    );

    const earnings = walletData.earnings_by_source || {};

    // Calculate Total Asset Value (Cash + Crypto + Prize Value)
    const prizeValue = (walletData.special_bonuses?.product_purchase?.total_value || 0) +
        (walletData.special_bonuses?.car_purchase?.total_value || 0) +
        (walletData.special_bonuses?.apartment_purchase?.total_value || 0);

    const totalAssetValue = (walletData.available_balance || 0) +
        (walletData.bank_balance || 0) +
        (walletData.verified_balance || 0) +
        (walletData.crypto_balance || 0) +
        (walletData.frozen_crypto_balance || 0) +
        prizeValue;


    const incomeSources = [
        {
            key: 'binary_global',
            name: 'Binario Global',
            icon: '🔴',
            color: 'from-red-500 to-pink-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            data: earnings.binary_global
        },
        {
            key: 'binary_millionaire',
            name: 'Binario Millonario',
            icon: '💎',
            color: 'from-blue-400 to-cyan-500',
            bg: 'bg-cyan-50',
            border: 'border-cyan-200',
            data: earnings.binary_millionaire
        },
        {
            key: 'unilevel',
            name: 'Unilevel',
            icon: '🌳',
            color: 'from-emerald-400 to-green-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            data: earnings.unilevel
        },
        {
            key: 'matching_bonus',
            name: 'Matching Bonus',
            icon: '🤝',
            color: 'from-purple-500 to-indigo-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            data: earnings.matching_bonus
        },
        {
            key: 'forced_matrix',
            name: 'Matriz Forzada',
            icon: '⚡',
            color: 'from-yellow-400 to-orange-500',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            data: earnings.forced_matrix
        },
        {
            key: 'global_pool',
            name: 'Pool Global',
            icon: '🌍',
            color: 'from-blue-600 to-indigo-800',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            data: earnings.global_pool
        }
    ];

    // Aggregated Earnings Calculations
    const unilevelTotal = (earnings.unilevel?.total || 0) +
        (earnings.sponsorship?.total || 0) +
        (earnings.matching_bonus?.total || 0);

    const binaryGlobalTotal = earnings.binary_global?.total || 0;
    const binaryMillionaireTotal = earnings.binary_millionaire?.total || 0;
    const matrixTotal = earnings.forced_matrix?.total || 0;

    // Global Pool is usually separate or added to one, keeping it separate for now or just adding to total.
    const globalPoolTotal = earnings.global_pool?.total || 0;

    // COP Conversion
    const COP_RATE = 4500;
    const totalCOP = totalAssetValue * COP_RATE;

    return (
        <SimpleErrorBoundary>
            <div className="min-h-screen bg-gray-50 pb-12">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 pb-32 mb-[-6rem]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                    Billetera Digital
                                </h1>
                                <p className="opacity-60 text-sm mt-1">Gestión integral de activos y comisiones</p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="p-2 bg-slate-700/50 rounded-full hover:bg-slate-700 transition"
                                title="Actualizar"
                            >
                                🔄
                            </button>
                        </div>

                        <div className="text-center py-8">
                            <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-2">Valor Total de Activos</p>
                            <div
                                style={{
                                    fontSize: '4.5rem',
                                    fontWeight: '800',
                                    background: 'linear-gradient(to right, #6ee7b7, #3b82f6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}
                                className="pb-2 filter drop-shadow-lg"
                            >
                                <AnimatedNumber value={totalAssetValue} />
                                <span style={{ fontSize: '1.5rem', WebkitTextFillColor: '#94a3b8' }} className="font-normal ml-3">USD</span>
                            </div>

                            {/* COP Display */}
                            <div className="mb-4 mt-2">
                                <span className="text-2xl font-extrabold text-yellow-400 bg-slate-900/80 px-6 py-2 rounded-full border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 block md:inline-block">
                                    🇨🇴 ≈ $ <AnimatedNumber value={totalCOP} /> <span className="text-sm font-bold text-yellow-200">COP</span>
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-4">
                                Saldo Disponible: <span className="text-emerald-400 font-bold">${walletData.available_balance?.toLocaleString()}</span>
                                {' • '}
                                Caja Fuerte: <span className="text-yellow-400 font-bold">${walletData.bank_balance?.toLocaleString()}</span>
                                {' • '}
                                Bolsa Fidelización TEI: <span className="text-cyan-400 font-bold">${walletData.purchase_balance?.toLocaleString() || '0'}</span>
                                {' • '}
                                Banco: <span className="text-green-400 font-bold">${walletData.verified_balance?.toLocaleString() || '0'}</span>
                                {' • '}
                                Cripto: <span className="text-yellow-400 font-bold">${walletData.crypto_balance?.toLocaleString()}</span>
                                {' • '}
                                Premios: <span className="text-purple-400 font-bold">${prizeValue?.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Modal */}
                {showWithdrawalModal && (
                    <WithdrawalModal
                        initialTab={withdrawalModalTab}
                        onClose={() => setShowWithdrawalModal(false)}
                        onWithdrawSuccess={() => {
                            fetchData(); // Refresh balance
                        }}
                    />
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ===== CAJA FUERTE ===== */}
                    <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-yellow-200 bg-gradient-to-r from-white to-yellow-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src="/images/caja-fuerte-tei.png"
                                        alt="Caja Fuerte Digital TEI"
                                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2 mb-1">
                                        🔒 Caja Fuerte
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-300 font-normal">
                                            Fondos Liberados (50% Comisiones TEI RIDE &amp; Comercios Aliados)
                                        </span>
                                    </h2>
                                    <p className="text-gray-500 text-sm">
                                        Comisiones disponibles los días 11 · 21 · 01 (00:01). Se transfieren al Banco al cumplir requisitos (desde $11.00 USD / $49.500 COP).
                                    </p>
                                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-700">
                                        📋 Al transferir al Banco se aplica <strong>ReteFuente 6%</strong> + <strong>ReteICA</strong> (si aplica según ciudad)
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Saldo en Caja</p>
                                    <p className={`text-3xl font-bold ${(walletData.bank_balance || 0) > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                        ${(walletData.bank_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">USD</p>
                                    {(walletData.bank_balance || 0) > 0 && (
                                        <p className="text-xs font-semibold text-yellow-700 mt-1">
                                            ≈ ${((walletData.bank_balance || 0) * 4500).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                        </p>
                                    )}
                                </div>

                                {/* Transfer to Bank button */}
                                {(() => {
                                    const balance = walletData.bank_balance || 0;
                                    const kyc = walletData.is_kyc_verified;
                                    const hasMin = balance >= 11.0;
                                    let btnLabel = '🏦 Transferir al Banco';
                                    let btnTitle = '';
                                    let btnDisabled = false;
                                    if (!kyc) { btnLabel = '🔐 KYC Requerido'; btnTitle = 'Debes completar y aprobar tu KYC primero.'; btnDisabled = true; }
                                    else if (!hasMin) { btnLabel = `Mínimo $11.00 USD`; btnTitle = `Necesitas al menos $11.00 USD ($49.500 COP) en Caja Fuerte.`; btnDisabled = true; }

                                    return (
                                        <button
                                            onClick={async () => {
                                                if (btnDisabled) return;
                                                if (!window.confirm(`¿Transferir $${balance.toFixed(2)} al Banco? Se aplicarán las retenciones de ley.`)) return;
                                                try {
                                                    const res = await api.post('/api/wallet/transfer-to-bank');
                                                    alert(`✅ ${res.data.message}\n\nBruto: $${res.data.gross_amount}\nRetenciones: $${res.data.withheld}\nNeto al Banco: $${res.data.net_transferred}`);
                                                    fetchData();
                                                } catch (err) {
                                                    alert('Error: ' + (err.response?.data?.detail || err.message));
                                                }
                                            }}
                                            disabled={btnDisabled}
                                            title={btnTitle}
                                            className={`px-5 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform ${btnDisabled
                                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 hover:scale-105 active:scale-95 shadow-yellow-200'
                                            }`}
                                        >
                                            {btnLabel}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* ===== BOLSA FIDELIZACIÓN TEI ===== */}
                    <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border-2 border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-cyan-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src="/images/bolsa-fidelizacion-tei.png"
                                        alt="Bolsa Fidelización TEI"
                                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_18px_rgba(30,58,138,0.28)] transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2 mb-1">
                                        🎁 BOLSA FIDELIZACIÓN TEI
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-300 font-semibold">
                                            50% Comisiones TEI RIDE &amp; Comercios Aliados
                                        </span>
                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300 font-bold">
                                            ✨ 0% Retención de Impuestos
                                        </span>
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Recibe el <strong>50% del 91.5%</strong> de todas las comisiones de los Planes de Compensación generadas en <strong>TEI RIDE</strong> y <strong>Comercios Aliados</strong>. Saldo disponible de inmediato para canjear por <strong>todos los productos, paquetes y servicios de la Plataforma</strong> sin excepción.
                                    </p>
                                    <div className="mt-3 p-3 bg-indigo-50/90 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex flex-wrap gap-x-4 gap-y-1.5">
                                        <span>🛡️ <strong>Libre de Retenciones (0% ReteFuente / 0% ReteICA):</strong> Al redimirse por productos y servicios que recirculan en el Ecosistema TEI, no tiene ninguna retención de impuestos.</span>
                                        <span>🚖 <strong>Viaja en Taxi / TEI RIDE:</strong> Paga tus viajes directamente con este saldo (se acredita como efectivo inmediato para el taxista/conductor).</span>
                                        <span>🛍️ <strong>Tienda Virtual &amp; Comercios Aliados:</strong> Compra cualquier producto o servicio sin restricciones.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 mt-4 md:mt-0">
                                <div className="text-right">
                                    <p className="text-xs text-indigo-600 uppercase font-bold tracking-wide">Saldo para Canjear</p>
                                    <p className={`text-3xl font-extrabold ${(walletData.purchase_balance || 0) > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        ${(walletData.purchase_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">USD</p>
                                    <p className="text-base font-extrabold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full inline-block mt-2 border border-indigo-300 shadow-sm whitespace-nowrap">
                                        🇨🇴 ≈ ${((walletData.purchase_balance || 0) * 4500).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== NUEVO BANCO ===== */}
                    <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-green-200 bg-gradient-to-r from-white to-green-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src="/images/banco-tei.png"
                                        alt="Banco Digital TEI"
                                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2 mb-1">
                                        🏦 Banco
                                        {walletData.is_kyc_verified
                                            ? <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">KYC ✓</span>
                                            : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">KYC Pendiente</span>
                                        }
                                        {withdrawalStatus?.active_window && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200">
                                                Retiros Habilitados
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-gray-500 text-sm">
                                        {walletData.is_kyc_verified
                                            ? 'Fondos listos para retirar, transferir a otros usuarios o comprar en la tienda.'
                                            : 'Completa tu KYC para activar retiros bancarios o usa la transferencia entre usuarios.'}
                                    </p>
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
                                        📅 Ventanas de retiro: Días 13–16 · 23–26 · 03–06 &nbsp;|&nbsp; {withdrawalStatus?.message || ''}
                                    </div>
                                    <div className="mt-2 p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>🏦 <strong>Retiro a Banco Personal:</strong> desde <strong>$11.00 USD</strong> ($49.500 COP)</span>
                                        <span>🤝 <strong>Transferencia entre Usuarios TEI:</strong> desde <strong>$3.00 USD</strong> hasta <strong>$600.00 USD ($2.700.000 COP)</strong>/día</span>
                                        <span>⚙️ <strong>Tarifa uso del sistema:</strong> Gratis hasta $200.000 COP · &gt;$200.000: +$0.50 USD · &gt;$1.200.000: +$1.10 USD · &gt;$2.000.000: +$2.20 USD</span>
                                        <span>🔑 <strong>Validación:</strong> Segunda Clave de Transacciones</span>
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                                        <span>🎓</span>
                                        <span>Programa Juvenil (15–17 años): Retiros bancarios con tutor legal (tope máx. $2.700.000 COP/mes).</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 mt-4 md:mt-0">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Disponible Hoy</p>
                                    <p className={`text-3xl font-bold ${(walletData.verified_balance || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        ${(walletData.verified_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">USD</p>
                                    {(walletData.verified_balance || 0) > 0 && (
                                        <p className="text-xl font-extrabold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full inline-block mt-2 border border-yellow-300 shadow-sm">
                                            🇨🇴 ${((walletData.verified_balance || 0) * 4500).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <button
                                        onClick={() => {
                                            setWithdrawalModalTab('withdraw');
                                            setShowWithdrawalModal(true);
                                        }}
                                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200 text-sm whitespace-nowrap"
                                    >
                                        Retirar Fondos 💸
                                    </button>
                                    <button
                                        onClick={() => {
                                            setWithdrawalModalTab('transfer');
                                            setShowWithdrawalModal(true);
                                        }}
                                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200 text-sm whitespace-nowrap"
                                    >
                                        Transferir a Usuario 🤝
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 Network Cards Section */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            📊 Desglose por Red
                            <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">4 Fuentes</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* 1. Unilevel Card (Includes Sponsorship + Matching) */}
                            <EarningsCard
                                title="Red Unilevel"
                                totalEarnings={unilevelTotal}
                                monthlyEarnings={0}
                                totalNetwork={earnings.unilevel?.count || 0}
                                icon="🌳"
                                gradient="bg-gradient-to-br from-emerald-400 to-green-600"
                                customStyle={{ background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' }}
                                description={`Incluye Quick Start ($${earnings.sponsorship?.total || 0}) + Matching`}
                                onClick={() => setActiveTab('history')}
                            />

                            {/* 2. Binary Global Card */}
                            <EarningsCard
                                title="Binario Global"
                                totalEarnings={binaryGlobalTotal}
                                monthlyEarnings={0}
                                totalNetwork={earnings.binary_global?.count || 0}
                                icon="🔴"
                                gradient="bg-gradient-to-br from-red-500 to-pink-600"
                                customStyle={{ background: 'linear-gradient(135deg, #ef4444 0%, #db2777 100%)' }}
                                description="Ciclos y bonos directos"
                                onClick={() => setActiveTab('history')}
                            />

                            {/* 3. Binary Millionaire Card */}
                            <EarningsCard
                                title="Binario Millonario"
                                totalEarnings={binaryMillionaireTotal}
                                monthlyEarnings={0}
                                totalNetwork={earnings.binary_millionaire?.count || 0}
                                icon="💎"
                                gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
                                customStyle={{ background: 'linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%)' }}
                                description="Posicionamiento automático"
                                onClick={() => setActiveTab('history')}
                            />

                            {/* 4. Forced Matrix Card */}
                            <EarningsCard
                                title="Matriz Forzada"
                                totalEarnings={matrixTotal}
                                monthlyEarnings={0}
                                totalNetwork={earnings.forced_matrix?.count || 0}
                                icon="⚡"
                                gradient="bg-gradient-to-br from-yellow-400 to-orange-500"
                                customStyle={{ background: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)' }}
                                description="Matriz 3x3 progresiva"
                                onClick={() => setActiveTab('history')}
                            />
                        </div>
                    </div>

                    {/* Other Assets / Tabs (Preserved for history/prizes) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex gap-4 mb-6 border-b border-gray-100 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('assets')}
                                className={`pb-4 px-2 font-medium transition-all whitespace-nowrap ${activeTab === 'assets'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                🎁 Mis Premios (Activos)
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-4 px-2 font-medium transition-all whitespace-nowrap ${activeTab === 'history'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                📜 Historial Completo
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('retenciones');
                                    fetchCertificate(certYear);
                                }}
                                className={`pb-4 px-2 font-medium transition-all whitespace-nowrap ${activeTab === 'retenciones'
                                    ? 'text-orange-600 border-b-2 border-orange-500'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                📄 Retenciones
                            </button>
                        </div>

                        {activeTab === 'assets' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                                {/* Cars */}
                                <div className="h-full">
                                    <EarningsCard
                                        title="Fondo Automotriz"
                                        totalEarnings={walletData.special_bonuses?.car_purchase?.total_value}
                                        monthlyEarnings={0}
                                        totalNetwork={`${walletData.special_bonuses?.car_purchase?.count || 0} Bonos`}
                                        icon="🚗"
                                        gradient="bg-gradient-to-br from-red-500 to-rose-600"
                                        customStyle={{ background: 'linear-gradient(135deg, #ef4444 0%, #e11d48 100%)' }}
                                        description="Acumulado para compra de vehículo"
                                        labelNetwork="Bonos"
                                        labelEarnings="Acumulado"
                                        onClick={() => setActiveTab('special')}
                                    />
                                </div>

                                {/* Apartments */}
                                <div className="h-full">
                                    <EarningsCard
                                        title="Fondo Vivienda"
                                        totalEarnings={walletData.special_bonuses?.apartment_purchase?.total_value}
                                        monthlyEarnings={0}
                                        totalNetwork={`${walletData.special_bonuses?.apartment_purchase?.count || 0} Bonos`}
                                        icon="🏠"
                                        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                                        customStyle={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}
                                        description="Acumulado para compra de propiedad"
                                        labelNetwork="Bonos"
                                        labelEarnings="Acumulado"
                                        onClick={() => setActiveTab('special')}
                                    />
                                </div>

                                {/* Travel */}
                                <div className="h-full">
                                    <EarningsCard
                                        title="Viajes de Incentivo"
                                        totalEarnings={0}
                                        monthlyEarnings={0}
                                        totalNetwork={`${walletData.special_bonuses?.travel?.trips_available || 0} Viajes`}
                                        icon="✈️"
                                        gradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
                                        customStyle={{ background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)' }}
                                        description="Viajes todo pago disponibles"
                                        labelNetwork="Disponibles"
                                        labelEarnings="Usados"
                                        customEarningsValue={`${walletData.special_bonuses?.travel?.trips_used || 0} Viajes`}
                                        onClick={() => setActiveTab('special')}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (() => {
                            const combinedTransactions = [
                                ...(earnings.unilevel?.transactions || []),
                                ...(earnings.binary_global?.transactions || []),
                                ...(earnings.binary_millionaire?.transactions || []),
                                ...(earnings.forced_matrix?.transactions || []),
                                ...(earnings.sponsorship?.transactions || []),
                                ...(transferHistory || [])
                            ].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

                            return (
                                <div className="divide-y divide-gray-50 animate-fade-in">
                                    {combinedTransactions.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            No hay transacciones recientes para mostrar
                                        </div>
                                    ) : (
                                        combinedTransactions.slice(0, 50).map((tx, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        tx.type === 'transfer_sent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {tx.type === 'transfer_sent' ? 'OUT' : 'IN'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {tx.type === 'transfer_sent' ? `Transferencia enviada a @${tx.counterparty}` :
                                                             tx.type === 'transfer_received' ? `Transferencia recibida de @${tx.counterparty}` :
                                                             tx.new_member_name ? `Bono Patrocinio: ${tx.new_member_name}` :
                                                             tx.matrix_level ? `Matriz Nivel ${tx.matrix_level}` :
                                                             tx.type ? `Bono ${tx.type}` :
                                                             `Comisión Venta $${tx.sale_amount || '?'}`}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(tx.date || tx.created_at).toLocaleDateString('es-CO')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold flex items-center ${tx.type === 'transfer_sent' ? 'text-red-500' : 'text-green-600'}`}>
                                                    {tx.type === 'transfer_sent' ? '-' : '+'} <AnimatedNumber value={tx.amount || tx.commission_amount || 0} />
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })()}
                        {activeTab === 'retenciones' && (
                            <div className="animate-fade-in">
                                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <h3 className="text-lg font-bold text-orange-800 mb-1">📄 Certificado de Retenciones</h3>
                                    <p className="text-sm text-orange-600">Válido para declaración de renta ante la DIAN. Disponible a partir de enero del año siguiente.</p>
                                </div>

                                {/* Year selector */}
                                <div className="flex items-center gap-4 mb-6">
                                    <label className="text-sm font-medium text-gray-600">Año fiscal:</label>
                                    <select
                                        value={certYear}
                                        onChange={(e) => setCertYear(parseInt(e.target.value))}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    >
                                        {[new Date().getFullYear() - 1, new Date().getFullYear() - 2, new Date().getFullYear() - 3].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => fetchCertificate(certYear)}
                                        className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition"
                                    >
                                        Consultar
                                    </button>
                                    {certData && (
                                        <button
                                            onClick={() => window.print()}
                                            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
                                        >
                                            🖨️ Imprimir / PDF
                                        </button>
                                    )}
                                </div>

                                {certLoading && <div className="text-center py-8 text-gray-500">Cargando certificado...</div>}
                                {certError && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">{certError}</div>}

                                {certData && (
                                    <div id="certificado-retencion" className="border border-gray-200 rounded-xl p-6 bg-white">
                                        {/* Header */}
                                        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                                            <p className="text-xs text-gray-500 mb-1">CERTIFICADO DE INGRESOS Y RETENCIONES</p>
                                            <h2 className="text-2xl font-bold text-gray-800">{certData.company.name}</h2>
                                            <p className="text-sm text-gray-500">NIT: {certData.company.nit} &nbsp;|&nbsp; Año Fiscal: {certData.fiscal_year}</p>
                                        </div>

                                        {/* User */}
                                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Datos del Beneficiario</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-gray-500">Nombre: </span><span className="font-bold">{certData.user.name}</span></div>
                                                <div><span className="text-gray-500">Cédula: </span><span className="font-bold">{certData.user.document_id || '—'}</span></div>
                                                <div><span className="text-gray-500">Ciudad: </span><span className="font-bold">{certData.user.city || '—'}</span></div>
                                                <div><span className="text-gray-500">País: </span><span className="font-bold">{certData.user.country || '—'}</span></div>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="mb-6">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Resumen del Año {certData.fiscal_year}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {[
                                                    { label: 'Ingresos Brutos', value: certData.summary.total_gross_income, color: 'bg-blue-50 text-blue-800' },
                                                    { label: 'ReteFuente (6%)', value: certData.summary.total_retefuente, color: 'bg-red-50 text-red-800' },
                                                    { label: 'ReteICA', value: certData.summary.total_reteica, color: 'bg-orange-50 text-orange-800' },
                                                    { label: 'Total Retenido', value: certData.summary.total_withheld, color: 'bg-gray-100 text-gray-800 font-bold' },
                                                    { label: 'Neto Recibido', value: certData.summary.total_net_received, color: 'bg-green-50 text-green-800 font-bold' },
                                                ].map((item, i) => (
                                                    <div key={i} className={`p-3 rounded-lg text-center ${item.color}`}>
                                                        <p className="text-xs mb-1">{item.label}</p>
                                                        <p className="text-lg font-bold">${Number(item.value).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Transactions */}
                                        {certData.transactions.length > 0 ? (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Detalle de Transacciones</p>
                                                <table className="w-full text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-100 text-gray-600">
                                                            <th className="text-left p-2">Fecha</th>
                                                            <th className="text-left p-2">Tipo</th>
                                                            <th className="text-right p-2">Bruto USD</th>
                                                            <th className="text-right p-2">ReteFuente</th>
                                                            <th className="text-right p-2">ReteICA</th>
                                                            <th className="text-right p-2">Neto USD</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {certData.transactions.map((tx, i) => (
                                                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="p-2 text-gray-600">{new Date(tx.date).toLocaleDateString('es-CO')}</td>
                                                                <td className="p-2 capitalize">{tx.release_type === 'matrix' ? 'Matrices' : tx.release_type === 'millionaire' ? 'Millonario' : 'General'}</td>
                                                                <td className="p-2 text-right">${tx.gross_amount.toFixed(2)}</td>
                                                                <td className="p-2 text-right text-red-600">${tx.retefuente_amount.toFixed(2)} ({tx.retefuente_pct}%)</td>
                                                                <td className="p-2 text-right text-orange-600">${tx.reteica_amount.toFixed(2)} ({tx.reteica_pct}%)</td>
                                                                <td className="p-2 text-right text-green-700 font-bold">${tx.net_amount.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                No se registraron retenciones para el año {certData.fiscal_year}.
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                                            Generado el {new Date(certData.generated_at).toLocaleString('es-CO')} &nbsp;|&nbsp; Este certificado es válido para efectos tributarios ante la DIAN (Art. 378 y 381 E.T.)
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SimpleErrorBoundary>
    );
};

export default WalletView;
