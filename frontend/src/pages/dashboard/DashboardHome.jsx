import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';

const DashboardHome = () => {
    const [user, setUser] = useState(null);
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userResponse, walletResponse] = await Promise.all([
                    api.get('/auth/me'),
                    api.get('/api/wallet').catch(() => ({ data: null }))
                ]);
                setUser(userResponse.data);
                setWalletData(walletResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="p-8 text-center text-red-500">Error al cargar perfil. Por favor recarga la página.</div>;

    const isPreAffiliate = user.status === 'pre-affiliate';

    // Calculate statistics
    const totalEarnings = walletData?.cash_balance || 0;
    const cryptoAssets = walletData?.crypto_balance || 0;
    const leadershipBonuses = walletData?.leadership_bonuses || 0;
    const currentRank = user.rank || 'Nuevo';

    const statsCards = [
        {
            title: 'Ganancia Total',
            value: `$${totalEarnings.toFixed(2)}`,
            icon: '💵',
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-50 to-emerald-50',
            iconBg: 'bg-green-100'
        },
        {
            title: 'Criptoactivos Actuales',
            value: `$${cryptoAssets.toFixed(2)}`,
            icon: '₿',
            gradient: 'from-orange-500 to-amber-600',
            bgGradient: 'from-orange-50 to-amber-50',
            iconBg: 'bg-orange-100'
        },
        {
            title: 'Bonos de Liderazgo',
            value: `$${leadershipBonuses.toFixed(2)}`,
            icon: '🏆',
            gradient: 'from-purple-500 to-violet-600',
            bgGradient: 'from-purple-50 to-violet-50',
            iconBg: 'bg-purple-100'
        },
        {
            title: 'Rango Actual',
            value: currentRank,
            icon: '⭐',
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-50 to-indigo-50',
            iconBg: 'bg-blue-100'
        }
    ];

    return (
        <div className="p-6 space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                    ¡Hola, {user.name}! 👋
                </h1>
                <p className="text-gray-600 text-lg">Bienvenido a tu oficina virtual</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${stat.iconBg} p-3 rounded-xl`}>
                                <span className="text-3xl">{stat.icon}</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                            {stat.title}
                        </h3>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                            {stat.value}
                        </p>
                        {/* Decorative element */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full`}></div>
                    </div>
                ))}
            </div>

            {/* Pre-Affiliate Alert or Active Status */}
            {isPreAffiliate ? (
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold mb-4">¡Estás a un paso de activar tu negocio! 🚀</h2>
                        <p className="text-blue-100 mb-6 text-lg leading-relaxed">
                            Actualmente tu cuenta está en estado <strong>Pre-Afiliado</strong>.
                            Para desbloquear todas las funciones, comisiones y comenzar a construir tu red,
                            necesitas adquirir un Paquete de Inicio.
                        </p>
                        <Link
                            to="/dashboard/store"
                            className="inline-block bg-white text-blue-700 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                        >
                            Ir a la Tienda y Activarme →
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-3 rounded-xl">
                            <span className="text-2xl">✅</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Estado de Cuenta</h3>
                            <p className="text-green-600 font-semibold">Activo y Operando</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tu Enlace de Referido</h4>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/usuario/${user.username}`}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-mono"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/usuario/${user.username}`);
                                    alert('¡Enlace copiado al portapapeles!');
                                }}
                                className="text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-3 focus:outline-none transition-all duration-300 whitespace-nowrap"
                            >
                                📋 Copiar
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Comparte este enlace para registrar nuevos socios en tu red.</p>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <QuickLink
                        to="/dashboard/store"
                        icon="🛍️"
                        title="Tienda"
                        desc="Adquiere productos y paquetes"
                        gradient="from-blue-500 to-blue-600"
                    />
                    <QuickLink
                        to="/dashboard/wallet"
                        icon="💰"
                        title="Billetera"
                        desc="Revisa tus comisiones y saldos"
                        gradient="from-green-500 to-green-600"
                    />
                    <QuickLink
                        to="/dashboard/matrix"
                        icon="🌳"
                        title="Mi Red"
                        desc="Visualiza tu estructura de equipo"
                        gradient="from-teal-500 to-teal-600"
                    />
                </div>
            </div>
        </div>
    );
};

const QuickLink = ({ to, icon, title, desc, gradient }) => (
    <Link
        to={to}
        className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex items-center gap-4 transform hover:-translate-y-1"
    >
        <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl text-white text-3xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    </Link>
);

export default DashboardHome;
