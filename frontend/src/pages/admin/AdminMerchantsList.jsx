import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const AdminMerchantsList = () => {
    const [merchants, setMerchants] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('directory');
    const [loading, setLoading] = useState(true);
    const [editingMerchant, setEditingMerchant] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isApproving, setIsApproving] = useState(null);
    const [approveMargin, setApproveMargin] = useState(20);
    const [formData, setFormData] = useState({
        name: '', document_id: '', email: '', phone: '', customer_service_phone: '', address: '', city: '', country: '',
        category: 'products', logo_url: '', banner_url: '', store_description: '',
        commission_margin: 20, tax_pct: 0, withholding_pct: 0, status: 'active'
    });

    useEffect(() => { 
        fetchMerchants(); 
        fetchApplications();
    }, []);

    const fetchMerchants = async () => {
        try {
            const res = await api.get('/api/admin/merchants-directory/');
            setMerchants(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching merchants", error);
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await api.get('/api/admin/merchants-directory/applications');
            setApplications(res.data);
        } catch (error) {
            console.error("Error fetching applications", error);
        }
    };

    const handleEdit = (merchant) => {
        setEditingMerchant(merchant);
        setFormData({
            ...merchant,
            category: merchant.category || 'products',
            logo_url: merchant.logo_url || '',
            banner_url: merchant.banner_url || '',
            store_description: merchant.store_description || '',
            customer_service_phone: merchant.customer_service_phone || ''
        });
        setIsCreating(false);
    };

    const handleCreate = () => {
        setEditingMerchant(null);
        setFormData({
            name: '', document_id: '', email: '', phone: '', customer_service_phone: '', address: '', city: '', country: '',
            category: 'products', logo_url: '', banner_url: '', store_description: '',
            commission_margin: 20, tax_pct: 0, withholding_pct: 0, status: 'active'
        });
        setIsCreating(true);
    };

    const handleOpenApprove = (app) => {
        setIsApproving(app);
        setApproveMargin(app.commission_margin || 20);
    };

    const [syncingMap, setSyncingMap] = useState(false);

    const handleSyncMap = async () => {
        setSyncingMap(true);
        try {
            const res = await api.post('/api/allied-commerce/sync-merchants');
            alert(`✅ Sincronización exitosa con Google Maps:\n\n${res.data.synced || 0} comercios vinculados con coordenadas en el mapa.`);
        } catch (error) {
            console.error("Error syncing map:", error);
            alert(`Error sincronizando con el mapa: ${error.response?.data?.detail || error.message}`);
        } finally {
            setSyncingMap(false);
        }
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/admin/merchants-directory/${isApproving.id}/approve`, {
                commission_margin: approveMargin
            });
            // Auto-sync coordinates to map
            api.post('/api/allied-commerce/sync-merchants').catch(() => {});
            alert('¡Comercio aprobado y activado exitosamente!');
            setIsApproving(null);
            fetchMerchants();
            fetchApplications();
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isCreating) {
                await api.post('/api/admin/merchants-directory/', formData);
                alert('Comercio creado exitosamente');
            } else {
                await api.put(`/api/admin/merchants-directory/${editingMerchant.id}`, formData);
                alert('Comercio actualizado exitosamente');
            }
            // Auto-sync coordinates to map
            api.post('/api/allied-commerce/sync-merchants').catch(() => {});
            setIsCreating(false);
            setEditingMerchant(null);
            fetchMerchants();
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('¿Estás seguro de eliminar este comercio?')) {
            try {
                await api.delete(`/api/admin/merchants-directory/${id}`);
                alert('Comercio eliminado');
                fetchMerchants();
            } catch (error) {
                alert(`Error: ${error.response?.data?.detail || error.message}`);
            }
        }
    };

    const handleGenerateToken = async (id) => {
        try {
            const res = await api.post(`/api/admin/merchants-directory/${id}/generate-token`);
            const magicUrl = `${window.location.origin}/magic-merchant/${res.data.token}`;
            navigator.clipboard.writeText(magicUrl).then(() => {
                alert(`✅ Enlace mágico copiado:\n\n${magicUrl}`);
            }).catch(() => {
                alert(`✅ Enlace mágico generado:\n\n${magicUrl}`);
            });
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">🏪 Directorio de Comercios Aliados</h1>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={handleSyncMap}
                        disabled={syncingMap}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow font-semibold flex items-center gap-1.5 transition text-sm disabled:opacity-50"
                        title="Geocodifica y actualiza comercios en el mapa de Google Maps"
                    >
                        {syncingMap ? '🔄 Sincronizando...' : '🗺️ Sincronizar Mapa'}
                    </button>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold text-sm">
                        + Nuevo Comercio
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b">
                <button 
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'directory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-755'}`}
                >
                    🏪 Directorio ({merchants.length})
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('applications')}
                    className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-755'}`}
                >
                    📥 Solicitudes de Afiliados ({applications.length})
                </button>
            </div>

            {loading ? (
                <p>Cargando comercios...</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {activeTab === 'directory' ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comercio / Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Márgenes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {merchants.map(m => (
                                    <tr key={m.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-orange-50 shrink-0 overflow-hidden flex items-center justify-center border border-orange-200">
                                                    {m.logo_url ? (
                                                        <img src={m.logo_url} alt={m.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        <span className="text-xl">🏪</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{m.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {m.category === 'services' ? '💇‍♂️ Servicios' : m.category === 'highticket' ? '🏍️ Alto Ticket' : '🛍️ Productos'} • NIT: {m.document_id || 'N/A'}
                                                    </div>
                                                    {m.store_description && (
                                                        <div className="text-[11px] text-gray-600 line-clamp-1 max-w-sm mt-0.5" title={m.store_description}>
                                                            {m.store_description}
                                                        </div>
                                                    )}
                                                    {m.customer_service_phone && (
                                                        <div className="text-[11px] text-green-700 font-semibold mt-0.5">
                                                            WhatsApp: {m.customer_service_phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-blue-700">Comisión: {m.commission_margin}%</div>
                                            <div className="text-xs text-gray-500">Impuesto: {m.tax_pct}% | Ret: {m.withholding_pct}%</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {m.status}
                                            </span>
                                            {m.is_virtual_store && (
                                                <div className="mt-2">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.is_approved_virtual_store ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                                                        {m.is_approved_virtual_store ? 'Tienda Virtual Aprobada' : 'Tienda Virtual Bloqueada'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            {m.is_virtual_store && (
                                                <button 
                                                    onClick={async () => {
                                                        const action = m.is_approved_virtual_store ? 'reject-virtual-store' : 'approve-virtual-store';
                                                        await api.post(`/api/admin/merchants-directory/${m.id}/${action}`);
                                                        fetchMerchants();
                                                    }} 
                                                    className={`mr-4 ${m.is_approved_virtual_store ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {m.is_approved_virtual_store ? '🚫 Bloquear Tienda' : '✅ Aprobar Tienda'}
                                                </button>
                                            )}
                                            <button onClick={() => handleGenerateToken(m.id)} className="text-purple-600 hover:text-purple-900 mr-4">🔗 Link Mágico</button>
                                            <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-900 mr-4 font-bold">✏️ Editar</button>
                                            <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Establecimiento / Qué Ofrece</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario / Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propuesta / IVA</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                                            No hay solicitudes de comercios pendientes.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map(app => (
                                        <tr key={app.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-50 shrink-0 overflow-hidden flex items-center justify-center border border-orange-200">
                                                        {app.logo_url ? (
                                                            <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                        ) : (
                                                            <span className="text-xl">🏪</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{app.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">
                                                            {app.category === 'services' ? '💇‍♂️ Servicios' : app.category === 'highticket' ? '🏍️ Alto Ticket' : '🛍️ Productos'}
                                                        </div>
                                                        {app.store_description && (
                                                            <p className="text-xs text-gray-700 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200 mt-1 max-w-sm">
                                                                📝 <em>{app.store_description}</em>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{app.owner_name}</div>
                                                <div className="text-xs text-gray-500">{app.email}</div>
                                                <div className="text-xs text-gray-500">Tel: {app.phone}</div>
                                                {app.customer_service_phone && (
                                                    <div className="text-xs text-green-700 font-bold mt-0.5">
                                                        WhatsApp: {app.customer_service_phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{app.address}</div>
                                                <div className="text-xs text-gray-500">{app.city}, {app.country}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-blue-600">{app.commission_margin}%</div>
                                                <div className="text-xs text-gray-500 font-semibold">
                                                    {app.tax_pct > 0 ? `Responsable IVA (${app.tax_pct}%)` : 'No cobra IVA (0%)'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenApprove(app)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm font-semibold transition-all text-xs"
                                                >
                                                    ✅ Aprobar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal de Formulario de Creación/Edición */}
            {(isCreating || editingMerchant) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold mb-4">{isCreating ? '🏪 Crear Comercio Aliado' : '✏️ Editar Comercio Aliado'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Nombre Comercial del Establecimiento *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: SDAYA Detalles, Flores y Regalos" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        ¿Qué productos o servicios vende? (Descripción para Clientes) *
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={formData.store_description || ''} 
                                        onChange={e => setFormData({...formData, store_description: e.target.value})} 
                                        className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                                        placeholder="Ej: Negocio especializado en regalos, detalles sorpresas, arreglos de flores eternas, chocolates y miscelánea."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Esta información aparecerá en el mapa y directorio para que los afiliados encuentren sus productos.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Foto o URL del Logo / Fachada</label>
                                    <div className="flex gap-2 items-center mt-1.5">
                                        <input 
                                            type="text" 
                                            value={formData.logo_url || ''} 
                                            onChange={e => setFormData({...formData, logo_url: e.target.value})} 
                                            className="flex-1 rounded-xl border-gray-300 shadow-sm p-2.5 border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                            placeholder="URL o sube una imagen 👉" 
                                        />
                                        <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 px-3 rounded-xl cursor-pointer border border-gray-300 shrink-0">
                                            📷 Subir
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('file', file);
                                                        const res = await api.post('/api/media/upload', fd);
                                                        if (res.data?.url) {
                                                            setFormData(prev => ({ ...prev, logo_url: res.data.url }));
                                                        }
                                                    } catch (err) {
                                                        alert("Error subiendo imagen: " + (err.response?.data?.detail || err.message));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {formData.logo_url && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <img src={formData.logo_url} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />
                                            <span className="text-xs text-green-600 font-semibold">Vista previa cargada</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                    <select value={formData.category || 'products'} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none">
                                        <option value="products">🛍️ Productos (Miscelánea, Almacén, Panadería, Ropa)</option>
                                        <option value="services">💇‍♂️ Servicios (Belleza, Salud, Gimnasio)</option>
                                        <option value="highticket">🏍️ Alto Ticket (Vehículos, Electrodomésticos)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp / Celular de Atención</label>
                                    <input type="text" value={formData.customer_service_phone || ''} onChange={e => setFormData({...formData, customer_service_phone: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: 3001234567" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">NIT / Documento</label>
                                    <input type="text" value={formData.document_id || ''} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Dirección Física</label>
                                    <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: Calle 10 # 45-20" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                                    <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: Medellín" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Margen de Comisión (%) *</label>
                                    <input type="number" step="0.1" required value={formData.commission_margin} onChange={e => setFormData({...formData, commission_margin: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none">
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="pending">Pendiente</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-6 pt-4 border-t">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-bold shadow">Guardar Comercio</button>
                                <button type="button" onClick={() => { setIsCreating(false); setEditingMerchant(null); }} className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-xl hover:bg-gray-300 font-semibold">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Aprobación Pactada */}
            {isApproving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-left">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 font-black">Aprobar Comercio Aliado</h2>
                        <p className="text-sm text-gray-600 mb-4 font-normal">
                            Estás aprobando a <strong>"{isApproving.name}"</strong> ({isApproving.owner_name}). Define la comisión final pactada con el comercio.
                        </p>
                        
                        <form onSubmit={handleApproveSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Comisión Final Pactada (%) *</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="number"
                                        step="0.1"
                                        required
                                        value={approveMargin}
                                        onChange={e => setApproveMargin(parseFloat(e.target.value) || 0)}
                                        className="w-24 rounded-xl border p-2.5 text-center font-bold text-gray-900 border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="font-bold text-gray-600">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">El comercio propuso un {isApproving.commission_margin}%.</p>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition-all"
                                >
                                    Confirmar y Activar
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsApproving(null)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-xl text-sm transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AdminMerchantsList;
