import React, { useEffect, useState } from 'react';
import { api } from '../../api/api';
import SimpleErrorBoundary from '../../components/SimpleErrorBoundary';
import EarningsCard from '../../components/dashboard/EarningsCard';
import WithdrawalModal from './components/WithdrawalModal';

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

    useEffect(() => {
        console.log("APP VERSION: WALLET_COP_FIXED_V2"); // Cache Buster
        fetchData();
        // Animation trigger
        setTimeout(() => setShowNumbers(true), 100);
    }, []);

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
                                Saldo Banco: <span className="text-green-400 font-bold">${walletData.bank_balance?.toLocaleString()}</span>
                                {' • '}
                                Cripto: <span className="text-yellow-400 font-bold">${walletData.crypto_balance?.toLocaleString()}</span>
                                {' • '}
                                Saldo Compras: <span className="text-blue-400 font-bold">${walletData.purchase_balance?.toLocaleString() || '0'}</span>
                                {' • '}
                                Premios: <span className="text-purple-400 font-bold">${prizeValue?.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Modal */}
                {showWithdrawalModal && (
                    <WithdrawalModal
                        onClose={() => setShowWithdrawalModal(false)}
                        onWithdrawSuccess={() => {
                            fetchData(); // Refresh balance
                        }}
                    />
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Bank Available Balance Card (New Request) */}
                    <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-white to-indigo-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                🏦 Banco: Saldo Disponible
                                {withdrawalStatus?.active_window && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                                        Retiros Habilitados
                                    </span>
                                )}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {withdrawalStatus?.message || "Cargando estado..."}
                            </p>

                            {/* Payment Calendar Info */}
                            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm">
                                <p className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                                    📅 Calendario de Pagos:
                                </p>
                                <ul className="space-y-1 text-xs text-blue-700">
                                    <li className="flex items-center gap-2">
                                        <span className="w-12 font-bold bg-white px-1 rounded border border-blue-200 text-center">Día 7</span>
                                        <span>Ganancias de Matrices</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-12 font-bold bg-white px-1 rounded border border-blue-200 text-center">Día 17</span>
                                        <span>Binario Millonario</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-12 font-bold bg-white px-1 rounded border border-blue-200 text-center">Día 27</span>
                                        <span>Comisiones Generales</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Disponible Hoy</p>
                                <p className={`text-3xl font-bold ${withdrawalStatus?.max_withdrawable > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    ${withdrawalStatus?.max_withdrawable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </p>
                                {withdrawalStatus?.max_withdrawable > 0 && (
                                    <p className="text-sm font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                        ≈ ${(withdrawalStatus.max_withdrawable * 4500).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => setShowWithdrawalModal(true)}
                                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${withdrawalStatus?.max_withdrawable > 0
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200'
                                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                                    }`}
                                disabled={!withdrawalStatus || withdrawalStatus.max_withdrawable <= 0}
                            >
                                Retirar Fondos 💸
                            </button>
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
                        <div className="flex gap-4 mb-6 border-b border-gray-100">
                            <button
                                onClick={() => setActiveTab('assets')}
                                className={`pb-4 px-2 font-medium transition-all ${activeTab === 'assets'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                🎁 Mis Premios (Activos)
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-4 px-2 font-medium transition-all ${activeTab === 'history'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                📜 Historial Completo
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

                        {activeTab === 'history' && (
                            <div className="divide-y divide-gray-50 animate-fade-in">
                                {/* Combined History View */}
                                {[
                                    ...(earnings.unilevel?.transactions || []),
                                    ...(earnings.binary_global?.transactions || []),
                                    ...(earnings.binary_millionaire?.transactions || []),
                                    ...(earnings.forced_matrix?.transactions || []),
                                    ...(earnings.sponsorship?.transactions || [])
                                ]
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .slice(0, 20)
                                    .map((tx, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    IN
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {tx.new_member_name ? `Bono Patrocinio: ${tx.new_member_name}` :
                                                            tx.matrix_level ? `Matriz Nivel ${tx.matrix_level}` :
                                                                tx.type ? `Bono ${tx.type}` :
                                                                    `Comisión Venta $${tx.sale_amount || '?'}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-600 flex items-center">
                                                + <AnimatedNumber value={tx.amount || tx.commission_amount} />
                                            </span>
                                        </div>
                                    ))}
                                {(!earnings.unilevel?.transactions?.length && !earnings.binary_global?.transactions?.length) && (
                                    <div className="p-8 text-center text-gray-400">
                                        No hay transacciones recientes para mostrar
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
