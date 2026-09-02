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
        name: '', document_id: '', email: '', phone: '', address: '', city: '', country: '',
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
        setFormData(merchant);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setEditingMerchant(null);
        setFormData({
            name: '', document_id: '', email: '', phone: '', address: '', city: '', country: '',
            commission_margin: 20, tax_pct: 0, withholding_pct: 0, status: 'active'
        });
        setIsCreating(true);
    };

    const handleOpenApprove = (app) => {
        setIsApproving(app);
        setApproveMargin(app.commission_margin || 20);
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/admin/merchants-directory/${isApproving.id}/approve`, {
                commission_margin: approveMargin
            });
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
                <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                    + Nuevo Comercio
                </button>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / NIT</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Márgenes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {merchants.map(m => (
                                    <tr key={m.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{m.name}</div>
                                            <div className="text-sm text-gray-500">NIT: {m.document_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">Comisión: {m.commission_margin}%</div>
                                            <div className="text-xs text-gray-500">Impuesto: {m.tax_pct}% | Ret: {m.withholding_pct}%</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button onClick={() => handleGenerateToken(m.id)} className="text-purple-600 hover:text-purple-900 mr-4">🔗 Link Mágico</button>
                                            <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Establecimiento / Categoría</th>
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
                                                <div className="text-sm font-bold text-gray-900">{app.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">
                                                    {app.category === 'services' ? '💇‍♂️ Servicios' : app.category === 'highticket' ? '🏍️ Alto Ticket' : '🛍️ Productos'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{app.owner_name}</div>
                                                <div className="text-xs text-gray-500">{app.email}</div>
                                                <div className="text-xs text-gray-500">Tel: {app.phone}</div>
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
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold mb-4">{isCreating ? 'Crear Comercio' : 'Editar Comercio'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Comercial *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">NIT / Documento</label>
                                    <input type="text" value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Margen de Comisión (%) *</label>
                                    <input type="number" step="0.1" required value={formData.commission_margin} onChange={e => setFormData({...formData, commission_margin: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Impuesto Facturación (%)</label>
                                    <input type="number" step="0.1" value={formData.tax_pct} onChange={e => setFormData({...formData, tax_pct: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Retención en la Fuente (%)</label>
                                    <input type="number" step="0.1" value={formData.withholding_pct} onChange={e => setFormData({...formData, withholding_pct: e.target.value})} className="mt-1.5 block w-full rounded-xl border-gray-300 shadow-sm p-2.5 border focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold shadow">Guardar</button>
                                <button type="button" onClick={() => { setIsCreating(false); setEditingMerchant(null); }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl hover:bg-gray-300 font-semibold">Cancelar</button>
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
