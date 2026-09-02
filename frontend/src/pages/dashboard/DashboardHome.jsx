import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';

const DashboardHome = () => {
    const [user, setUser] = useState(null);
    const [walletData, setWalletData] = useState(null);
    const [promoData, setPromoData] = useState(null);
    const [foundersData, setFoundersData] = useState(null);
    const [myMerchant, setMyMerchant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userResponse, walletResponse, promoResponse, foundersResponse, merchantResponse] = await Promise.all([
                    api.get('/auth/me'),
                    api.get('/api/wallet/summary').catch(() => ({ data: null })),
                    api.get('/api/promotions/travel-status').catch(() => ({ data: null })),
                    api.get('/api/promotions/founders-club').catch(() => ({ data: null })),
                    api.get('/api/merchants/my-merchant').catch(() => ({ data: null }))
                ]);
                setUser(userResponse.data);
                setWalletData(walletResponse.data);
                if (promoResponse && promoResponse.data) {
                    setPromoData(promoResponse.data);
                }
                if (foundersResponse && foundersResponse.data) {
                    setFoundersData(foundersResponse.data);
                }
                if (merchantResponse && merchantResponse.data && merchantResponse.data.status !== 'none') {
                    setMyMerchant(merchantResponse.data);
                }
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
    const totalEarnings = walletData?.total_earnings || 0;
    const cryptoAssets = walletData?.crypto_balance || 0;
    const availableBalance = walletData?.available_balance || 0;
    const currentRank = user.rank || 'Nuevo';

    const statsCards = [
        {
            title: 'Ganancia Total',
            value: `$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: '💵',
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-50 to-emerald-50',
            iconBg: 'bg-green-100'
        },
        {
            title: 'Saldo Disponible',
            value: `$${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: '🏦',
            gradient: 'from-purple-500 to-violet-600',
            bgGradient: 'from-purple-50 to-violet-50',
            iconBg: 'bg-purple-100'
        },
        {
            title: 'Criptoactivos Actuales',
            value: `$${cryptoAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: '₿',
            gradient: 'from-orange-500 to-amber-600',
            bgGradient: 'from-orange-50 to-amber-50',
            iconBg: 'bg-orange-100'
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

            {/* Club de Fundadores Widget */}
            {foundersData && (
                <div className="bg-gradient-to-br from-gray-900 to-black text-yellow-500 rounded-2xl p-6 shadow-2xl border border-yellow-600/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="text-6xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">👑</div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2 uppercase tracking-widest">Club de Fundadores</h2>
                            
                            {foundersData.is_user_founder ? (
                                <p className="text-yellow-100 font-medium">
                                    ¡Felicidades! Eres un miembro exclusivo {foundersData.founder_tier ? `del nivel ${foundersData.founder_tier}` : 'del Club de Fundadores'}. Disfrutarás del {foundersData.founder_percentage || '1.2'}% de las ganancias globales hasta el 2034.
                                </p>
                            ) : (
                                foundersData.count < 386 ? (
                                    <p className="text-yellow-100 font-medium">
                                        Activa un Paquete 2 o 3 para ganar el 1.2%, o un Paquete 4 en adelante para asegurar el 2.7% de ganancias globales. ¡Cupos súper limitados!
                                    </p>
                                ) : foundersData.count < 770 ? (
                                    <>
                                        <p className="text-yellow-100 font-medium mb-3">
                                            ¡Última oportunidad! Ingresa al Club Exclusivo de Fundadores: 1.2% (P. 2 y 3) o 2.7% (P. 4+).
                                        </p>
                                        <div className="bg-black/50 rounded-lg p-3 inline-block border border-yellow-500/30">
                                            <span className="text-white font-bold">🔥 Quedan solo <span className="text-yellow-400 text-xl mx-1">{770 - foundersData.count}</span> de 770 cupos disponibles.</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-400 font-bold">
                                        El Club de Fundadores ha alcanzado su límite de 770 miembros. Los cupos están agotados.
                                    </p>
                                )
                            )}
                        </div>
                        
                        {!foundersData.is_user_founder && foundersData.count < 770 && (
                            <Link to="/dashboard/store" className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase text-sm rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all hover:scale-105 active:scale-95">
                                Asegurar mi cupo
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Travel Promotion Section */}
            {promoData && (
                <div className="bg-gradient-to-br from-indigo-900 to-blue-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-indigo-800 mt-6">
                    {/* Decorative Background */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500 opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute left-1/4 bottom-0 w-48 h-48 bg-purple-500 opacity-10 rounded-full blur-2xl"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div>
                            <span className="bg-teal-400 text-teal-950 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-3 inline-block">
                                ✈️ Gran Campaña de Viajes
                            </span>
                            <h2 className="text-3xl font-extrabold tracking-tight">¡Próximo Destino: Punta Cana o San Andrés! 🏖️</h2>
                            <p className="text-blue-200 mt-1">Periodo de calificación: 4 de Septiembre al 3 de Noviembre de 2026</p>
                        </div>
                        {/* Countdown */}
                        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20 text-center min-w-[150px] z-10">
                            <span className="text-xs text-blue-200 block uppercase font-semibold">Tiempo Restante</span>
                            <span className="text-2xl font-bold block mt-1">
                                {(() => {
                                    const diff = new Date('2026-11-03T23:59:59') - new Date();
                                    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                                    return days > 0 ? `${days} Días` : '¡Finalizado!';
                                })()}
                            </span>
                        </div>
                    </div>

                    {!promoData.eligible && (
                        <div className="mb-6 bg-red-500 bg-opacity-20 border border-red-400 text-red-100 rounded-xl p-4 text-sm font-semibold flex items-start gap-3 z-10 relative shadow-inner">
                            <span className="text-xl mt-0.5">⚠️</span>
                            <div>
                                <h4 className="text-lg font-bold text-red-200 mb-1">Tu cuenta no está calificando aún</h4>
                                <p>Para participar oficialmente y ganar los viajes, debes tener activo un <strong>Paquete de nivel 4, 5, 6 o 7 en adelante</strong> durante el periodo de la campaña.</p>
                                <p className="mt-2 text-xs opacity-90">¡Adquiere o mejora tu paquete ahora para que tu progreso y el de tu red cuenten!</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 z-10 relative">
                        {/* Nacional Trip */}
                        <div className="bg-white bg-opacity-5 rounded-2xl p-6 border border-white border-opacity-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-teal-300 flex items-center gap-2">
                                    🇨🇴 Viaje Nacional (San Andrés / Sta. Marta)
                                </h3>
                                <span className="bg-teal-400 text-teal-950 font-extrabold px-3 py-1 rounded-lg text-sm">
                                    Ganados: {promoData.national_won} / 2 🎟️
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1 text-gray-200">
                                        <span>Líneas Calificadas (mín. 3 Directos)</span>
                                        <span className="font-bold text-teal-300">{promoData.national_legs} / 3 (para 1 viaje) o 6 (para 2)</span>
                                    </div>
                                    <div className="w-full bg-blue-950 bg-opacity-80 rounded-full h-3 overflow-hidden border border-white border-opacity-5">
                                        <div 
                                            className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, (promoData.national_legs / 6) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internacional Trip */}
                        <div className="bg-white bg-opacity-5 rounded-2xl p-6 border border-white border-opacity-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-pink-300 flex items-center gap-2">
                                    🌴 Viaje Internacional (Punta Cana)
                                </h3>
                                <span className="bg-pink-400 text-pink-950 font-extrabold px-3 py-1 rounded-lg text-sm">
                                    Ganados: {promoData.international_won} / 2 🎟️
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1 text-gray-200">
                                        <span>Líneas Calificadas (mín. 5 Directos)</span>
                                        <span className="font-bold text-pink-300">{promoData.international_legs} / 5 (para 1 viaje) o 10 (para 2)</span>
                                    </div>
                                    <div className="w-full bg-blue-950 bg-opacity-80 rounded-full h-3 overflow-hidden border border-white border-opacity-5">
                                        <div 
                                            className="bg-gradient-to-r from-pink-400 to-rose-400 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, (promoData.international_legs / 10) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Directs List details */}
                    {promoData.directs_details && promoData.directs_details.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-white border-opacity-10 z-10 relative">
                            <h4 className="font-bold text-lg text-blue-200 mb-4 flex items-center gap-2">
                                👥 Desglose de tus Ramas Unilevel (Periodo Campaña):
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {promoData.directs_details.map((direct, i) => (
                                    <div key={i} className="bg-blue-950 bg-opacity-40 p-4 rounded-xl border border-white border-opacity-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold block truncate max-w-[120px]" title={direct.name}>{direct.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${direct.active_in_period ? 'bg-green-500 text-green-950' : 'bg-gray-600 text-gray-200'}`}>
                                                {direct.active_in_period ? 'Frontal Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 flex justify-between">
                                            <span>Directos válidos:</span>
                                            <span className="font-bold text-teal-400">{direct.downline_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

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

            {/* Merchant Application Banner */}
            {!myMerchant ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm text-left">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">🏪</span>
                        <div>
                            <h3 className="text-lg font-bold text-blue-900">¿Tienes un negocio abierto al público?</h3>
                            <p className="text-sm text-gray-600 font-normal">Hazte Comercio Aliado y atrae a toda la comunidad TEI a tu establecimiento para multiplicar tus ventas.</p>
                        </div>
                    </div>
                    <Link to="/dashboard/merchant-apply" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm whitespace-nowrap">
                        🏪 Postular mi Negocio
                    </Link>
                </div>
            ) : myMerchant.status === 'pending' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm text-left">
                    <span className="text-3xl">⏳</span>
                    <div>
                        <h3 className="text-lg font-bold text-amber-800">Postulación de Comercio en Revisión</h3>
                        <p className="text-sm text-gray-600 font-normal">
                            Estamos revisando la solicitud de tu negocio <strong>"{myMerchant.name}"</strong>. Te notificaremos por correo cuando el portal de ventas esté activo.
                        </p>
                    </div>
                </div>
            ) : myMerchant.status === 'active' ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm text-left">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">🏪</span>
                        <div>
                            <h3 className="text-lg font-bold text-green-900">Comercio Aliado Activo: {myMerchant.name}</h3>
                            <p className="text-sm text-gray-600 font-normal">El portal de tu negocio está listo para que tus cajeros registren ventas y acumulen cashback.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <button 
                            type="button"
                            onClick={() => {
                                const url = `${window.location.origin}/magic-merchant/${myMerchant.magic_token}`;
                                navigator.clipboard.writeText(url);
                                alert('¡Enlace Mágico de Caja copiado al portapapeles!');
                            }}
                            className="bg-white border border-green-200 hover:bg-green-100 text-green-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                        >
                            🔗 Copiar Link de Caja
                        </button>
                        <a 
                            href={`${window.location.origin}/magic-merchant/${myMerchant.magic_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm text-center shadow-md transition-all whitespace-nowrap"
                        >
                            💻 Abrir Caja
                        </a>
                    </div>
                </div>
            ) : null}

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

                    {/* Referral Link for Pre-Affiliates */}
                    <div className="mt-8 pt-6 border-t border-blue-400 border-opacity-30">
                        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                            <span>🔗</span> Tu Enlace de Referido (¡Ya puedes invitar!)
                        </h4>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/usuario/${user.username}`}
                                className="bg-blue-900 bg-opacity-40 border border-blue-300 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-mono placeholder-blue-200"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/usuario/${user.username}`);
                                    alert('¡Enlace copiado al portapapeles!');
                                }}
                                className="text-blue-900 bg-white hover:bg-blue-50 focus:ring-4 focus:ring-blue-300 font-bold rounded-lg text-sm px-6 py-3 focus:outline-none transition-all duration-300 whitespace-nowrap shadow-lg"
                            >
                                📋 Copiar
                            </button>
                        </div>
                        <p className="text-blue-100 text-xs mt-2 opacity-80">
                            Comparte este enlace para registrar nuevos socios y ganar comisiones Unilevel y Binario Millonario.
                        </p>
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
                    <QuickLink
                        to="/dashboard/qualified-ranks"
                        icon="🏆"
                        title="Rangos de Calificación"
                        desc="Consulta los rangos por Matrix ID"
                        gradient="from-purple-500 to-purple-600"
                    />
                    <QuickLink
                        to="/dashboard/honor-ranks"
                        icon="💎"
                        title="Rangos de Honor"
                        desc="Consulta los rangos por comisiones"
                        gradient="from-emerald-500 to-emerald-600"
                    />
                    <QuickLink
                        to="/dashboard/orders"
                        icon="📦"
                        title="Mis Pedidos"
                        desc="Rastrea el estado de tus pedidos"
                        gradient="from-pink-500 to-pink-600"
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
