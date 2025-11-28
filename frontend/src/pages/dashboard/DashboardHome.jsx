import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api';

const DashboardHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>;

    if (!user) return <div className="p-8 text-center text-red-500">Error al cargar perfil. Por favor recarga la página.</div>;

    const isPreAffiliate = user.status === 'pre-affiliate';

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Hola, {user.name}! 👋</h1>
            <p className="text-gray-600 mb-8">Bienvenido a tu oficina virtual.</p>

            {isPreAffiliate ? (
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl mb-8">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">¡Estás a un paso de activar tu negocio! 🚀</h2>
                        <p className="text-blue-100 mb-6 text-lg">
                            Actualmente tu cuenta está en estado <strong>Pre-Afiliado</strong>.
                            Para desbloquear todas las funciones, comisiones y comenzar a construir tu red,
                            necesitas adquirir un Paquete de Inicio.
                        </p>
                        <Link
                            to="/dashboard/store"
                            className="inline-block bg-white text-blue-700 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-50 transition-colors transform hover:-translate-y-1"
                        >
                            Ir a la Tienda y Activarme →
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Estado</h3>
                        <p className="text-2xl font-bold text-green-600 mt-1">Activo ✅</p>
                    </div>
                    {/* Add more stats here later */}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickLink
                    to="/dashboard/store"
                    icon="🛍️"
                    title="Tienda"
                    desc="Adquiere productos y paquetes"
                />
                <QuickLink
                    to="/dashboard/wallet"
                    icon="💰"
                    title="Billetera"
                    desc="Revisa tus comisiones y saldos"
                />
                <QuickLink
                    to="/dashboard/matrix"
                    icon="🌳"
                    title="Mi Red"
                    desc="Visualiza tu estructura de equipo"
                />
            </div>
        </div>
    );
};

const QuickLink = ({ to, icon, title, desc }) => (
    <Link to={to} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4 group">
        <div className="text-4xl group-hover:scale-110 transition-transform">{icon}</div>
        <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    </Link>
);

export default DashboardHome;
