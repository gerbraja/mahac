import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';
import { 
    ShoppingBag, 
    Store, 
    Car, 
    MapPin, 
    GraduationCap, 
    Building, 
    Crown, 
    Search, 
    RefreshCw, 
    Download, 
    Phone, 
    Mail, 
    MessageCircle, 
    ExternalLink, 
    CheckCircle, 
    Clock, 
    XCircle,
    UserCheck,
    Truck,
    Package,
    TrendingUp,
    ShieldCheck,
    Layers,
    Calendar,
    DollarSign
} from 'lucide-react';

export default function AdminCRM() {
    const { globalCountry } = useAdmin();
    const [activeBusiness, setActiveBusiness] = useState('ecommerce'); // 1 to 7
    const [loading, setLoading] = useState(false);
    const [crmData, setCrmData] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // 7 Business Modules Configuration
    const businessModules = [
        { id: 'ecommerce', number: '1', title: 'Ventas Productos', icon: ShoppingBag, color: 'from-blue-600 to-indigo-600', badge: 'E-Commerce' },
        { id: 'merchants', number: '2', title: 'Negocios Aliados', icon: Store, color: 'from-amber-500 to-orange-600', badge: 'Comercios' },
        { id: 'transport', number: '3', title: 'Movilidad & Carga', icon: Car, color: 'from-emerald-600 to-teal-600', badge: 'Transporte' },
        { id: 'logistics', number: '4', title: 'Red Logística', icon: MapPin, color: 'from-sky-500 to-cyan-600', badge: 'Próximo Proyecto' },
        { id: 'academy', number: '5', title: 'Academia Digital', icon: GraduationCap, color: 'from-purple-600 to-fuchsia-600', badge: 'Próximo Proyecto' },
        { id: 'real_estate', number: '6', title: 'Inmuebles & Autos', icon: Building, color: 'from-rose-500 to-pink-600', badge: 'Próximo Proyecto' },
        { id: 'mlm', number: '7', title: 'Red MLM & Liderazgo', icon: Crown, color: 'from-amber-600 to-yellow-500', badge: 'Core TEI ⭐' },
    ];

    useEffect(() => {
        fetchCrmData();
    }, [activeBusiness, globalCountry, statusFilter]);

    const fetchCrmData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ business: activeBusiness });
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);
            if (statusFilter && statusFilter !== 'all') queryParams.append('status_filter', statusFilter);
            if (search.trim()) queryParams.append('search', search.trim());

            const res = await api.get(`/api/admin/crm/data?${queryParams.toString()}`);
            setCrmData(res.data);
        } catch (err) {
            console.error("Error fetching CRM data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCrmData();
    };

    // Helper to build WhatsApp direct link
    const openWhatsApp = (phone, message) => {
        if (!phone || phone === 'N/A') {
            alert('Este registro no tiene número de teléfono registrado.');
            return;
        }
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    };

    // Export current module data to CSV
    const exportToCSV = () => {
        const records = crmData?.[activeBusiness]?.records || [];
        if (records.length === 0) {
            alert('No hay registros disponibles para exportar.');
            return;
        }

        const headers = Object.keys(records[0]);
        const rows = records.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'));
        const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CRM_TEI_${activeBusiness}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-blue-600" />
                        CRM Multinegocios TEI
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Centro unificado de prospección, seguimiento y relación para las 7 unidades de negocio de Tu Empresa Internacional.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCrmData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 7 BOTONES SUPERIORES DE SELECCIÓN DE NEGOCIO */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    Selecciona una Unidad de Negocio (7 Módulos de Gestión):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {businessModules.map((b) => {
                        const Icon = b.icon;
                        const isSelected = activeBusiness === b.id;
                        return (
                            <button
                                key={b.id}
                                onClick={() => {
                                    setActiveBusiness(b.id);
                                    setStatusFilter('all');
                                    setSearch('');
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative overflow-hidden group ${
                                    isSelected
                                        ? 'bg-gradient-to-b from-blue-900 to-indigo-900 text-white border-blue-900 shadow-md ring-2 ring-blue-500 ring-offset-1'
                                        : 'bg-gray-50 hover:bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-1.5">
                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        #{b.number}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1 rounded ${
                                        isSelected ? 'bg-amber-400 text-blue-950' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {b.badge}
                                    </span>
                                </div>

                                <Icon className={`w-5 h-5 mb-1.5 transition-transform group-hover:scale-110 ${
                                    isSelected ? 'text-amber-300' : 'text-blue-600'
                                }`} />

                                <span className="text-xs font-bold leading-tight line-clamp-1">
                                    {b.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono, email, ciudad..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Estado:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los Estados</option>
                        {activeBusiness === 'ecommerce' && (
                            <>
                                <option value="reservado">Reservado / Pago Pendiente</option>
                                <option value="en_preparacion">En Preparación</option>
                                <option value="pendiente_envio">Pendiente de Envío</option>
                                <option value="completado">Completado</option>
                            </>
                        )}
                        {activeBusiness === 'merchants' && (
                            <>
                                <option value="pending">Solicitudes Pendientes</option>
                                <option value="active">Comercios Activos con QR</option>
                                <option value="inactive">Inactivos</option>
                            </>
                        )}
                        {activeBusiness === 'transport' && (
                            <>
                                <option value="approved">Vehículos Aprobados</option>
                                <option value="pending">Pendientes de Validación</option>
                                <option value="rejected">Rechazados</option>
                            </>
                        )}
                        {activeBusiness === 'mlm' && (
                            <>
                                <option value="pre-affiliate">Pre-afiliados (Leads por activar)</option>
                                <option value="active">Distribuidores Activos</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* ============================================================ */}
            {/* VISTA 1: E-COMMERCE (VENTAS DE PRODUCTOS DE LA PLATAFORMA) */}
            {/* ============================================================ */}
            {activeBusiness === 'ecommerce' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Pedidos</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{crmData?.ecommerce?.stats?.total_orders || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/40">
                            <p className="text-xs font-semibold text-amber-700 uppercase">Pendientes Despacho</p>
                            <p className="text-2xl font-black text-amber-800 mt-1">{crmData?.ecommerce?.stats?.pending_shipping || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/40">
                            <p className="text-xs font-semibold text-emerald-700 uppercase">Entregados / Completados</p>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{crmData?.ecommerce?.stats?.completed_orders || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/40">
                            <p className="text-xs font-semibold text-blue-700 uppercase">Ventas COP Total</p>
                            <p className="text-xl font-black text-blue-900 mt-1">
                                ${(crmData?.ecommerce?.stats?.total_sales_cop || 0).toLocaleString('es-CO')}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                Clientes & Pedidos E-Commerce
                            </h3>
                            <span className="text-xs text-gray-500">{crmData?.ecommerce?.records?.length || 0} registros mostrados</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-5 py-3.5">Pedido #</th>
                                        <th className="px-5 py-3.5">Cliente</th>
                                        <th className="px-5 py-3.5">Contacto</th>
                                        <th className="px-5 py-3.5">Total Compra</th>
                                        <th className="px-5 py-3.5">Estado</th>
                                        <th className="px-5 py-3.5">Guía / Envío</th>
                                        <th className="px-5 py-3.5 text-center">Acciones Rápidas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {(crmData?.ecommerce?.records || []).map((o) => (
                                        <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-5 py-4 font-mono font-bold text-blue-900">
                                                #{o.id}
                                                <div className="text-[11px] text-gray-400 font-normal">
                                                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">{o.customer_name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{o.shipping_address}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs space-y-0.5">
                                                <div className="text-gray-800 font-medium">{o.customer_phone}</div>
                                                <div className="text-gray-400">{o.customer_email}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">
                                                ${(o.total_cop || 0).toLocaleString('es-CO')} COP
                                                <div className="text-xs text-gray-400 font-normal">${(o.total_usd || 0).toFixed(2)} USD</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                    o.status === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                                                    o.status === 'en_preparacion' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-mono text-gray-600">
                                                {o.tracking_number}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openWhatsApp(
                                                            o.customer_phone,
                                                            `Hola ${o.customer_name}, te saludamos de Tu Empresa Internacional respecto a tu compra #${o.id}. ¿Cómo podemos ayudarte hoy?`
                                                        )}
                                                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                        title="Contactar por WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={`mailto:${o.customer_email}`}
                                                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white rounded-lg transition"
                                                        title="Enviar Correo"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 2: NEGOCIOS ALIADOS (COMERCIOS, TIENDAS, RESTAURANTES) */}
            {/* ============================================================ */}
            {activeBusiness === 'merchants' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Comercios Vinculados</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{crmData?.merchants?.stats?.total_merchants || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/40">
                            <p className="text-xs font-semibold text-amber-700 uppercase">Pendientes de Aprobación</p>
                            <p className="text-2xl font-black text-amber-800 mt-1">{crmData?.merchants?.stats?.pending_merchants || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/40">
                            <p className="text-xs font-semibold text-emerald-700 uppercase">Activos Habilitados</p>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{crmData?.merchants?.stats?.active_merchants || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/40">
                            <p className="text-xs font-semibold text-rose-700 uppercase">Inactivos / Por Gestionar</p>
                            <p className="text-2xl font-black text-rose-800 mt-1">{crmData?.merchants?.stats?.inactive_merchants || 0}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Store className="w-5 h-5 text-amber-600" />
                                Pipeline de Comercios Aliados
                            </h3>
                            <span className="text-xs text-gray-500">{crmData?.merchants?.records?.length || 0} aliados</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-5 py-3.5">Comercio</th>
                                        <th className="px-5 py-3.5">Categoría</th>
                                        <th className="px-5 py-3.5">Ubicación</th>
                                        <th className="px-5 py-3.5">Contacto</th>
                                        <th className="px-5 py-3.5">Comisión Pactada</th>
                                        <th className="px-5 py-3.5">Estado</th>
                                        <th className="px-5 py-3.5 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {(crmData?.merchants?.records || []).map((m) => (
                                        <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900">{m.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">NIT: {m.document_id}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-gray-700">
                                                <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                                                    {m.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-600">
                                                <div>{m.city}</div>
                                                <div className="text-gray-400">{m.country}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs space-y-0.5">
                                                <div className="font-medium text-gray-900">{m.contact_phone}</div>
                                                <div className="text-gray-400">{m.contact_email}</div>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-blue-900 text-xs">
                                                {m.commission_margin}%
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                    m.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                                    m.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {m.status === 'active' ? 'Activo (Con QR)' : m.status === 'pending' ? 'Solicitud Pendiente' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openWhatsApp(
                                                            m.contact_phone,
                                                            `Hola ${m.name}, te contactamos del área de convenios de Tu Empresa Internacional. ¿Cómo van tus ventas y operación con la app TEI?`
                                                        )}
                                                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                        title="Escribir a WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={`mailto:${m.contact_email}`}
                                                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-amber-600 hover:text-white rounded-lg transition"
                                                        title="Enviar Email"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 3: MOVILIDAD & TRANSPORTE DE CARGA (TEI TRANSPORTE) */}
            {/* ============================================================ */}
            {activeBusiness === 'transport' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Conductores Totales</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{crmData?.transport?.stats?.total_drivers || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/40">
                            <p className="text-xs font-semibold text-emerald-700 uppercase">Vehículos Habilitados</p>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{crmData?.transport?.stats?.approved_drivers || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/40">
                            <p className="text-xs font-semibold text-amber-700 uppercase">Pendientes Documentos</p>
                            <p className="text-2xl font-black text-amber-800 mt-1">{crmData?.transport?.stats?.pending_drivers || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/40">
                            <p className="text-xs font-semibold text-blue-700 uppercase">Activos en Radar</p>
                            <p className="text-2xl font-black text-blue-800 mt-1">{crmData?.transport?.stats?.active_on_radar || 0}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Car className="w-5 h-5 text-emerald-600" />
                                Red de Conductores & Transporte de Carga
                            </h3>
                            <span className="text-xs text-gray-500">{crmData?.transport?.records?.length || 0} conductores</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-5 py-3.5">Conductor</th>
                                        <th className="px-5 py-3.5">Vehículo & Tipo</th>
                                        <th className="px-5 py-3.5">Placa</th>
                                        <th className="px-5 py-3.5">Contacto</th>
                                        <th className="px-5 py-3.5">Ciudad</th>
                                        <th className="px-5 py-3.5">Estado</th>
                                        <th className="px-5 py-3.5 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {(crmData?.transport?.records || []).map((v) => (
                                        <tr key={v.id} className="hover:bg-emerald-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900">{v.driver_name}</div>
                                                <div className="text-xs text-gray-400">{v.driver_email}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs">
                                                <span className="font-bold capitalize text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {v.vehicle_type}
                                                </span>
                                                <div className="text-gray-500 mt-1">{v.brand} {v.model} ({v.year || ''})</div>
                                            </td>
                                            <td className="px-5 py-4 font-mono font-bold text-gray-900 text-xs">
                                                {v.license_plate}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-gray-800">
                                                {v.driver_phone}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-600">
                                                {v.driver_city}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                    v.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                    v.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {v.status === 'approved' ? 'Aprobado' : v.status === 'pending' ? 'Documentos Pendientes' : 'Rechazado'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openWhatsApp(
                                                            v.driver_phone,
                                                            `Hola ${v.driver_name}, te contactamos del equipo operativo de TEI Transporte respecto a tu registro con vehículo ${v.license_plate}.`
                                                        )}
                                                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                        title="Escribir a WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={`mailto:${v.driver_email}`}
                                                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                        title="Enviar Email"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 4: RED LOGÍSTICA & PUNTOS DE ENTREGA (PRÓXIMO PROYECTO) */}
            {/* ============================================================ */}
            {activeBusiness === 'logistics' && (
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-sky-900 to-cyan-900 text-white rounded-2xl shadow-lg">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-400 text-cyan-950 uppercase tracking-wide">
                            Módulo de Expansión Logística
                        </span>
                        <h2 className="text-2xl font-black mt-2">📍 CRM de Puntos de Entrega & Almacenamiento Zonal</h2>
                        <p className="text-sm text-cyan-100 max-w-2xl mt-1">
                            Este módulo gestionará las alianzas de bodegas aliadas, franquicias de recogida y distribución de última milla para pedidos de la tienda TEI.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Puntos de Entrega Registrados</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">{crmData?.logistics?.stats?.total_points || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Bodegas y puntos físicos de entrega activos en Colombia.</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-cyan-200 shadow-sm bg-cyan-50/30">
                            <p className="text-xs font-bold text-cyan-800 uppercase">Estado de la Red</p>
                            <p className="text-lg font-bold text-cyan-900 mt-1">{crmData?.logistics?.stats?.project_status || 'En Operación y Reclutamiento'}</p>
                            <p className="text-xs text-cyan-700 mt-1">Proyección para aperturas en las principales capitales y municipios.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 5: ACADEMIA DIGITAL & CURSOS TEI (PRÓXIMO PROYECTO) */}
            {/* ============================================================ */}
            {activeBusiness === 'academy' && (
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-purple-900 to-fuchsia-900 text-white rounded-2xl shadow-lg">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-300 text-purple-950 uppercase tracking-wide">
                            Educación & Liderazgo
                        </span>
                        <h2 className="text-2xl font-black mt-2">🎓 CRM de Academia & Formación Digital TEI</h2>
                        <p className="text-sm text-purple-100 max-w-2xl mt-1">
                            Monitoreo de estudiantes, avance en cursos de Marketing Digital, creación de redes, graduaciones y certificaciones de liderazgo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Cursos Disponibles</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">3 Módulos</p>
                            <p className="text-xs text-gray-500 mt-1">Marketing, Multinivel y Finanzas.</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm bg-purple-50/30">
                            <p className="text-xs font-bold text-purple-800 uppercase">Estudiantes en Formación</p>
                            <p className="text-3xl font-black text-purple-900 mt-1">{crmData?.academy?.stats?.total_students || 0}</p>
                            <p className="text-xs text-purple-600 mt-1">Miembros con acceso a la biblioteca educativa.</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/30">
                            <p className="text-xs font-bold text-emerald-800 uppercase">Certificaciones Otorgadas</p>
                            <p className="text-3xl font-black text-emerald-800 mt-1">48 Certificados</p>
                            <p className="text-xs text-emerald-600 mt-1">Graduados del curso de marketing digital.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 6: FONDO INMOBILIARIO & AUTOMOTRIZ (PRÓXIMO PROYECTO) */}
            {/* ============================================================ */}
            {activeBusiness === 'real_estate' && (
                <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-rose-900 to-pink-900 text-white rounded-2xl shadow-lg">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-300 text-rose-950 uppercase tracking-wide">
                            Inversión & Bienes Raíces
                        </span>
                        <h2 className="text-2xl font-black mt-2">🏢 CRM Inmobiliario, Fondo de Vivienda & Autos</h2>
                        <p className="text-sm text-rose-100 max-w-2xl mt-1">
                            Gestión de prospectos calificados para los Bonos de Vivienda y Vehículo, convenios con concesionarios aliados y proyectos inmobiliarios.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Calificados Fondo Auto</p>
                            <p className="text-3xl font-black text-rose-800 mt-1">25 Líderes</p>
                            <p className="text-xs text-gray-500 mt-1">Con puntos acumulados para vehículo.</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Calificados Fondo Vivienda</p>
                            <p className="text-3xl font-black text-indigo-900 mt-1">12 Líderes</p>
                            <p className="text-xs text-gray-500 mt-1">Con metas de bono inmobiliario.</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Convenios Comerciales</p>
                            <p className="text-3xl font-black text-emerald-800 mt-1">4 Aliados</p>
                            <p className="text-xs text-gray-500 mt-1">Constructoras y concesionarios en negociación.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VISTA 7: RED MLM, AFILIADOS & LIDERAZGO (¡CORE INDISPENSABLE!) */}
            {/* ============================================================ */}
            {activeBusiness === 'mlm' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Afiliados</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{crmData?.mlm?.stats?.total_affiliates || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/40">
                            <p className="text-xs font-semibold text-amber-800 uppercase">Pre-Afiliados (Leads por Activar)</p>
                            <p className="text-2xl font-black text-amber-900 mt-1">{crmData?.mlm?.stats?.pre_affiliates || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/40">
                            <p className="text-xs font-semibold text-emerald-700 uppercase">Distribuidores Activos</p>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{crmData?.mlm?.stats?.active_affiliates || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/40">
                            <p className="text-xs font-semibold text-blue-700 uppercase">KYC Verificados</p>
                            <p className="text-2xl font-black text-blue-800 mt-1">{crmData?.mlm?.stats?.kyc_verified || 0}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                Radar de Afiliados, Nuevos Leads & Líderes de Red
                            </h3>
                            <span className="text-xs text-gray-500">{crmData?.mlm?.records?.length || 0} afiliados</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-5 py-3.5">Afiliado</th>
                                        <th className="px-5 py-3.5">Usuario & Patrocinador</th>
                                        <th className="px-5 py-3.5">Contacto</th>
                                        <th className="px-5 py-3.5">País / Ciudad</th>
                                        <th className="px-5 py-3.5">Estado Red</th>
                                        <th className="px-5 py-3.5">KYC</th>
                                        <th className="px-5 py-3.5 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {(crmData?.mlm?.records || []).map((u) => (
                                        <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900">{u.name}</div>
                                                <div className="text-[11px] text-gray-400">
                                                    Registrado: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs">
                                                <div className="font-mono font-semibold text-blue-900">@{u.username}</div>
                                                <div className="text-gray-400 mt-0.5">Patrocinador: {u.referred_by}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs space-y-0.5">
                                                <div className="font-medium text-gray-900">{u.phone}</div>
                                                <div className="text-gray-400">{u.email}</div>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-600">
                                                <div>{u.country}</div>
                                                <div className="text-gray-400">{u.city}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    u.status === 'active' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                                }`}>
                                                    {u.status === 'active' ? '✓ Activo' : '⚡ Pre-Afiliado (Lead)'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                                                {u.is_kyc_verified ? (
                                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                        Verificado
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-medium">Pendiente</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openWhatsApp(
                                                            u.phone,
                                                            u.status === 'pre-affiliate'
                                                                ? `Hola ${u.name}, ¡bienvenido a Tu Empresa Internacional! Veo que te registraste recientemente. ¿Cómo podemos apoyarte para activar tu membresía y comenzar a ganar hoy?`
                                                                : `Hola ${u.name}, te saludamos de la directiva de Tu Empresa Internacional. ¿Cómo va el crecimiento de tu equipo este mes?`
                                                        )}
                                                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                        title="Escribir a WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={`mailto:${u.email}`}
                                                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white rounded-lg transition"
                                                        title="Enviar Email"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
