import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

const MerchantApply = () => {
    const navigate = useNavigate();
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editUploadingImage, setEditUploadingImage] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showVirtualTermsModal, setShowVirtualTermsModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        document_id: '',
        phone: '',
        customer_service_phone: '',
        address: '',
        city: '',
        country: 'Colombia',
        category: 'products',
        logo_url: '',
        store_description: '',
        iva_responsible: false,
        proposed_margin: 15,
        terms_accepted: false,
        virtual_terms_accepted: false,
        is_virtual_store: false
    });

    const [editForm, setEditForm] = useState({
        name: '',
        store_description: '',
        logo_url: '',
        customer_service_phone: '',
        phone: '',
        address: '',
        city: '',
        category: 'products'
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/api/merchants/my-merchant');
            if (res.data && res.data.status !== 'none') {
                setMerchant(res.data);
                setEditForm({
                    name: res.data.name || '',
                    store_description: res.data.store_description || '',
                    logo_url: res.data.logo_url || '',
                    customer_service_phone: res.data.customer_service_phone || res.data.phone || '',
                    phone: res.data.phone || '',
                    address: res.data.address || '',
                    city: res.data.city || '',
                    category: res.data.category || 'products'
                });
            } else {
                // Pre-fill from local user session if available
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    try {
                        const u = JSON.parse(savedUser);
                        setFormData(prev => ({
                            ...prev,
                            phone: u.phone || '',
                            customer_service_phone: u.phone || '',
                            document_id: u.document_id || '',
                            city: u.city || '',
                            country: u.country || 'Colombia'
                        }));
                    } catch (e) {}
                }
            }
            setLoading(false);
        } catch (e) {
            console.error("Error fetching merchant application status", e);
            setLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        const cat = e.target.value;
        let defaultMargin = 15;
        if (cat === 'services') defaultMargin = 25;
        if (cat === 'highticket') defaultMargin = 10;
        setFormData({
            ...formData,
            category: cat,
            proposed_margin: defaultMargin
        });
    };

    const handleFileUpload = async (e, isEditMode = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (isEditMode) setEditUploadingImage(true);
            else setUploadingImage(true);

            const uploadData = new FormData();
            uploadData.append('file', file);
            const res = await api.post('/api/media/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.url) {
                if (isEditMode) {
                    setEditForm(prev => ({ ...prev, logo_url: res.data.url }));
                } else {
                    setFormData(prev => ({ ...prev, logo_url: res.data.url }));
                }
            }
        } catch (error) {
            alert("Error al subir imagen: " + (error.response?.data?.detail || error.message));
        } finally {
            if (isEditMode) setEditUploadingImage(false);
            else setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.terms_accepted) {
            alert("Debes aceptar los Términos y Condiciones para postular tu comercio.");
            return;
        }
        if (!formData.store_description?.trim()) {
            alert("Por favor describe qué productos o servicios ofrece tu negocio para que los clientes sepan qué van a encontrar.");
            return;
        }

        try {
            setLoading(true);
            await api.post('/api/merchants/apply', formData);
            alert("¡Solicitud enviada con éxito! Tu tienda entrará en revisión.");
            fetchStatus();
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdatingProfile(true);
            await api.put('/api/merchants/my-merchant', editForm);
            alert("✅ ¡Información del negocio actualizada con éxito!");
            setIsEditingProfile(false);
            fetchStatus();
        } catch (error) {
            alert(`Error al actualizar: ${error.response?.data?.detail || error.message}`);
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleCopyLink = () => {
        const token = merchant?.magic_token;
        if (!token || token === 'null' || token.trim() === '') {
            alert('El enlace de caja se está sincronizando. Por favor actualiza la página.');
            return;
        }
        const url = `${window.location.origin}/magic-merchant/${token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // PENDING STATUS VIEW
    if (merchant && merchant.status === 'pending') {
        return (
            <div className="max-w-3xl mx-auto p-6 mt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
                    <span className="text-5xl">⏳</span>
                    <h2 className="text-2xl font-black text-amber-800 mt-3">Postulación en Revisión</h2>
                    <p className="text-gray-600 mt-2 text-sm max-w-xl mx-auto">
                        Tu solicitud para afiliar a <strong>"{merchant.name}"</strong> está siendo analizada por el equipo corporativo de Tu Empresa Internacional (TEI).
                    </p>

                    {/* VISTA PREVIA DE CÓMO SE VE EL COMERCIO */}
                    <div className="mt-6 p-6 bg-white rounded-2xl text-left border border-amber-100 shadow-sm max-w-xl mx-auto">
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-orange-100 border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {merchant.logo_url ? (
                                    <img src={merchant.logo_url} alt={merchant.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                    <span className="text-3xl">🏪</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{merchant.name}</h3>
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                        Pendiente
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {merchant.category === 'services' ? '💇‍♂️ Servicios' : merchant.category === 'highticket' ? '🏍️ Alto Ticket' : '🛍️ Productos'} • Margen propuesto: {merchant.commission_margin}%
                                </p>
                                
                                {merchant.store_description ? (
                                    <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <span className="font-semibold text-gray-900 block text-[11px] mb-0.5">Qué ofrece este negocio:</span>
                                        {merchant.store_description}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-amber-700 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                                        <span>⚠️</span>
                                        <span>Aún no has agregado la descripción de productos ni la foto de tu negocio.</span>
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                                    {merchant.customer_service_phone && (
                                        <span className="text-green-700 font-semibold flex items-center gap-1">
                                            💬 WhatsApp: {merchant.customer_service_phone}
                                        </span>
                                    )}
                                    {merchant.address && <span>📍 {merchant.address}{merchant.city ? `, ${merchant.city}` : ''}</span>}
                                </div>
                            </div>
                        </div>

                        {/* BOTÓN PARA COMPLETAR O EDITAR LA INFORMACIÓN */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500">¿Quieres mejorar la foto o descripción?</span>
                            <button
                                type="button"
                                onClick={() => setIsEditingProfile(!isEditingProfile)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                            >
                                {isEditingProfile ? '✖ Cancelar Edición' : '✏️ Completar / Editar Perfil'}
                            </button>
                        </div>
                    </div>

                    {/* FORMULARIO DESPLEGABLE DE EDICIÓN DEL PERFIL */}
                    {isEditingProfile && (
                        <div className="mt-6 bg-white p-6 rounded-2xl border border-blue-200 shadow-md max-w-xl mx-auto text-left">
                            <h4 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                                ✏️ Actualizar Información de "{merchant.name}"
                            </h4>
                            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Foto o Fachada del Local / Logo</label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={editForm.logo_url} 
                                            onChange={e => setEditForm({...editForm, logo_url: e.target.value})} 
                                            placeholder="URL o sube una foto desde tu equipo" 
                                            className="flex-1 rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                        <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-xl cursor-pointer border border-gray-300 shrink-0">
                                            {editUploadingImage ? 'Subiendo...' : '📷 Subir Foto'}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                                        </label>
                                    </div>
                                    {editForm.logo_url && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <img src={editForm.logo_url} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />
                                            <span className="text-green-600 font-medium">Foto cargada correctamente</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        ¿Qué productos o servicios vende tu negocio? (Descripción para Clientes) *
                                    </label>
                                    <textarea 
                                        rows={3} 
                                        required 
                                        value={editForm.store_description} 
                                        onChange={e => setEditForm({...editForm, store_description: e.target.value})} 
                                        placeholder="Ej: Vendemos regalos, detalles sorpresa, arreglos de flores eternas, chocolates, peluches y miscelánea para toda ocasión."
                                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-0.5">Permite que los afiliados sepan qué van a encontrar y aparezcas al buscar por producto.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">WhatsApp / Celular de Clientes</label>
                                        <input 
                                            type="text" 
                                            value={editForm.customer_service_phone} 
                                            onChange={e => setEditForm({...editForm, customer_service_phone: e.target.value})} 
                                            placeholder="Ej: 3001234567" 
                                            className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Ciudad</label>
                                        <input 
                                            type="text" 
                                            value={editForm.city} 
                                            onChange={e => setEditForm({...editForm, city: e.target.value})} 
                                            placeholder="Ej: Medellín" 
                                            className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={updatingProfile}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow transition"
                                >
                                    {updatingProfile ? 'Guardando...' : '💾 Guardar y Actualizar Información'}
                                </button>
                            </form>
                        </div>
                    )}

                    <p className="text-xs text-amber-600 mt-6">
                        Te enviaremos una notificación cuando tu portal de ventas esté activo y verificado.
                    </p>
                </div>
            </div>
        );
    }

    // ACTIVE STATUS VIEW
    if (merchant && merchant.status === 'active') {
        const magicUrl = `${window.location.origin}/magic-merchant/${merchant.magic_token}`;
        return (
            <div className="max-w-3xl mx-auto p-6 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center shadow-sm">
                    <span className="text-5xl">🏪</span>
                    <h2 className="text-2xl font-black text-green-800 mt-4">¡Tu Comercio Aliado está Activo!</h2>
                    <p className="text-green-700 mt-1 text-sm">
                        Felicidades, <strong>"{merchant.name}"</strong> ya es parte activa del ecosistema comercial de TEI.
                    </p>

                    {/* TARJETA DEL COMERCIO CON SU INFORMACIÓN */}
                    <div className="mt-6 p-6 bg-white rounded-2xl text-left border border-green-100 shadow-sm max-w-xl mx-auto">
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-green-100 border border-green-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {merchant.logo_url ? (
                                    <img src={merchant.logo_url} alt={merchant.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                    <span className="text-3xl">🏪</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{merchant.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {merchant.category === 'services' ? '💇‍♂️ Servicios' : merchant.category === 'highticket' ? '🏍️ Alto Ticket' : '🛍️ Productos'} • Cashback / Margen: <strong>{merchant.commission_margin}%</strong>
                                </p>
                                
                                {merchant.store_description && (
                                    <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <span className="font-semibold text-gray-900 block text-[11px] mb-0.5">Qué vendes:</span>
                                        {merchant.store_description}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                                    {merchant.customer_service_phone && (
                                        <span className="text-green-700 font-semibold flex items-center gap-1">
                                            💬 WhatsApp: {merchant.customer_service_phone}
                                        </span>
                                    )}
                                    {merchant.address && <span>📍 {merchant.address}{merchant.city ? `, ${merchant.city}` : ''}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditingProfile(!isEditingProfile)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                            >
                                {isEditingProfile ? '✖ Cancelar' : '✏️ Editar Vitrina y Datos'}
                            </button>
                        </div>
                    </div>

                    {/* FORMULARIO DE EDICIÓN EN ESTADO ACTIVO */}
                    {isEditingProfile && (
                        <div className="mt-4 bg-white p-6 rounded-2xl border border-blue-200 shadow-md max-w-xl mx-auto text-left">
                            <h4 className="font-bold text-gray-800 text-sm mb-3">✏️ Actualizar Vitrina y Datos del Negocio</h4>
                            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Foto o Fachada del Local / Logo</label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={editForm.logo_url} 
                                            onChange={e => setEditForm({...editForm, logo_url: e.target.value})} 
                                            placeholder="URL de la imagen" 
                                            className="flex-1 rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                        <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-xl cursor-pointer border border-gray-300 shrink-0">
                                            {editUploadingImage ? 'Subiendo...' : '📷 Subir Foto'}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                                        </label>
                                    </div>
                                    {editForm.logo_url && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <img src={editForm.logo_url} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />
                                            <span className="text-green-600 font-medium">Foto cargada</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Descripción de Productos y Servicios *</label>
                                    <textarea 
                                        rows={3} 
                                        required 
                                        value={editForm.store_description} 
                                        onChange={e => setEditForm({...editForm, store_description: e.target.value})} 
                                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">WhatsApp de Atención</label>
                                        <input 
                                            type="text" 
                                            value={editForm.customer_service_phone} 
                                            onChange={e => setEditForm({...editForm, customer_service_phone: e.target.value})} 
                                            className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Ciudad</label>
                                        <input 
                                            type="text" 
                                            value={editForm.city} 
                                            onChange={e => setEditForm({...editForm, city: e.target.value})} 
                                            className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={updatingProfile}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow transition"
                                >
                                    {updatingProfile ? 'Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    )}
                    
                    <div className="mt-8 bg-white rounded-2xl p-6 border border-green-100 text-left max-w-xl mx-auto shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Acceso a Caja (Portal de Ventas)</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Usa este enlace mágico en cualquier celular, tablet o computador de caja. Tus cajeros no necesitarán usuario ni contraseña para registrar ventas.
                        </p>
                        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <input 
                                type="text" 
                                readOnly 
                                value={magicUrl} 
                                className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:outline-none overflow-ellipsis"
                            />
                            <button 
                                type="button"
                                onClick={handleCopyLink}
                                className={`px-4 rounded-lg text-white font-medium text-sm transition-all shadow ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {copied ? '¡Copiado!' : 'Copiar'}
                            </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-4">
                            <button 
                                type="button"
                                onClick={() => navigate('/merchant')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-lg font-semibold shadow transition-all text-sm flex items-center justify-center gap-1.5"
                            >
                                💻 Abrir Portal de Caja
                            </button>
                            <div className="flex-1 p-2 bg-gray-50 rounded-lg text-center text-xs text-gray-500 flex items-center justify-center">
                                Margen Pactado: <strong className="text-gray-800 ml-1">{merchant.commission_margin}%</strong>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setMerchant(null)}
                        className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-bold"
                    >
                        ➕ Crear Otra Tienda (Física o Virtual)
                    </button>
                </div>
            </div>
        );
    }

    // FORM TO APPLY
    const getRangeText = () => {
        if (formData.category === 'services') return '💇‍♂️ Recomendado: 20% al 30% para servicios de belleza, salud, etc.';
        if (formData.category === 'highticket') return '🏍️ Recomendado: 5% al 20% para electrodomésticos, vehículos, etc.';
        return '🛍️ Recomendado: 10% al 25% para almacenes de calzado, ropa, panaderías, carnicerías, etc.';
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                    <span className="text-5xl">🏪</span>
                    <h1 className="text-3xl font-black mt-2">Registra tu Tienda Aliada</h1>
                    <p className="text-blue-150 text-sm mt-1 max-w-lg mx-auto">
                        Vincula tu negocio al ecosistema TEI para recibir a miles de afiliados que buscan tus productos y servicios todos los días.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* TIPO DE TIENDA */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 text-base">¿Qué tipo de tienda deseas crear?</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${!formData.is_virtual_store ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                                <input 
                                    type="radio" 
                                    name="storeType" 
                                    className="hidden"
                                    checked={!formData.is_virtual_store} 
                                    onChange={() => setFormData({...formData, is_virtual_store: false})} 
                                />
                                <div className="text-center">
                                    <span className="text-3xl block mb-2">🏪</span>
                                    <span className="font-bold text-gray-900 block">Tienda Física</span>
                                    <span className="text-xs text-gray-500">Local comercial para clientes con QR en el mapa</span>
                                </div>
                            </label>
                            
                            <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.is_virtual_store ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
                                <input 
                                    type="radio" 
                                    name="storeType" 
                                    className="hidden"
                                    checked={formData.is_virtual_store} 
                                    onChange={() => setFormData({...formData, is_virtual_store: true})} 
                                />
                                <div className="text-center">
                                    <span className="text-3xl block mb-2">🛒</span>
                                    <span className="font-bold text-gray-900 block">Tienda Virtual</span>
                                    <span className="text-xs text-gray-500">Ventas online en el Centro Comercial TEI</span>
                                </div>
                            </label>
                        </div>
                        
                        {formData.is_virtual_store && (
                            <div className="mt-4 p-4 bg-orange-100 border border-orange-200 rounded-xl text-orange-900 text-xs">
                                <strong>⚠️ Atención:</strong> Para aprobar una Tienda Virtual, se debitará un cobro único de <strong>$37,000 COP</strong> de tu Billetera TEI. Además, debes contar con un saldo base para cubrir las futuras comisiones de ventas (Requisito mínimo total en billetera: $117,000 COP).
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 1: FOTO Y DESCRIPCIÓN COMERCIAL */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📸</span>
                            <h3 className="font-black text-gray-900 text-base">Vitrina y Presentación del Negocio</h3>
                        </div>
                        <p className="text-xs text-gray-500">
                            Esto es lo que verán todos los afiliados en la plataforma cuando busquen qué comprar.
                        </p>

                        {/* FOTO O LOGO */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">
                                Foto o Imagen del Negocio (Fachada / Vitrina de Productos / Logo)
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Una foto real de tu local o productos aumenta un 80% las visitas de clientes.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <label className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 font-bold px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 cursor-pointer flex items-center justify-center gap-2 transition text-sm">
                                    <span>📷</span>
                                    <span>{uploadingImage ? 'Subiendo foto...' : 'Subir Foto desde tu Equipo'}</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => handleFileUpload(e, false)} 
                                    />
                                </label>
                                
                                <span className="text-xs text-gray-400 font-bold uppercase">o escribe la URL:</span>
                                
                                <input 
                                    type="text" 
                                    placeholder="https://ejemplo.com/foto-negocio.jpg"
                                    value={formData.logo_url}
                                    onChange={e => setFormData({...formData, logo_url: e.target.value})}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white p-3 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* VISTA PREVIA DE LA FOTO */}
                            {formData.logo_url && (
                                <div className="mt-3 flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 w-fit">
                                    <img 
                                        src={formData.logo_url} 
                                        alt="Vista previa" 
                                        className="w-16 h-16 object-cover rounded-lg border"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="text-left pr-2">
                                        <span className="text-xs font-bold text-green-700 block">✅ Imagen cargada</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({...formData, logo_url: ''})}
                                            className="text-[10px] text-red-500 hover:underline"
                                        >
                                            Quitar imagen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DESCRIPCIÓN DETALLADA DE PRODUCTOS */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800">
                                ¿Qué vende tu negocio y qué encontrará el cliente? *
                            </label>
                            <p className="text-xs text-gray-500 mb-1.5">
                                Describe tus productos principales. Por ejemplo: <em>"Regalos sorpresa, detalles personalizados, flores eternas, anchetas, chocolates finos y miscelánea para fechas especiales"</em>.
                            </p>
                            <textarea 
                                required
                                rows={3}
                                placeholder="Ej: Somos una tienda especializada en detalles y regalos: flores eternas, chocolates, anchetas, peluches y artículos de miscelánea para sorprender a quien más quieres..."
                                value={formData.store_description}
                                onChange={e => setFormData({...formData, store_description: e.target.value})}
                                className="block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: DATOS GENERALES DEL NEGOCIO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Nombre Comercial de la Tienda *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ej. SDAYA Detalles, Flores y Regalos"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Documento de Identidad o NIT *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ej. Cédula del dueño o NIT de la empresa"
                                value={formData.document_id}
                                onChange={e => setFormData({...formData, document_id: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Celular del Propietario / Administrador *</label>
                            <input 
                                type="tel" 
                                required
                                placeholder="Ej. 3001234567"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">WhatsApp / Celular de Atención a Clientes *</label>
                            <input 
                                type="tel" 
                                required
                                placeholder="Ej. 3009876543 (con WhatsApp)"
                                value={formData.customer_service_phone}
                                onChange={e => setFormData({...formData, customer_service_phone: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Este número será visible para que los afiliados te escriban a preguntar por productos.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Dirección Física del Local *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ej. Calle 10 # 45 - 20, Barrio Centro"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Ciudad *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ej. Medellín, Bogotá, Cali"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">País</label>
                            <input 
                                type="text" 
                                readOnly
                                value={formData.country}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Categoría del Establecimiento</label>
                            <select 
                                value={formData.category}
                                onChange={handleCategoryChange}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="products">🛍️ Productos (Regalos, Detalles, Almacén, Panadería, Ropa)</option>
                                <option value="services">💇‍♂️ Servicios (Odontología, Peluquería, Spa, Gimnasio)</option>
                                <option value="highticket">🏍️ Alto Ticket (Motos, Bicicletas, Electrodomésticos)</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* SECCIÓN 3: CONFIGURACIÓN FISCAL Y COMISIONES */}
                    <div className="space-y-4 text-left">
                        <h3 className="font-bold text-gray-800 text-base">⚙️ Porcentaje de Comisión y Tributación</h3>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">¿Cobras IVA o declaras Renta en tu negocio?</label>
                            <select 
                                value={formData.iva_responsible ? "true" : "false"}
                                onChange={e => setFormData({...formData, iva_responsible: e.target.value === "true"})}
                                className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="false">❌ No (Negocio Unipersonal / Régimen Simplificado / RUT Común)</option>
                                <option value="true">✅ Sí (Régimen Común / Responsable de IVA)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Si marcas <strong>No</strong>, los cálculos de comisiones se simplifican al 0% de impuestos automáticamente.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-4">
                            <label className="block text-sm font-semibold text-blue-900">
                                ¿Qué porcentaje (%) estás dispuesto a otorgar en comisiones por cliente TEI?
                            </label>
                            
                            <p className="text-xs text-blue-700 font-semibold mt-1">
                                {getRangeText()}
                            </p>

                            <div className="flex items-center gap-3 mt-3">
                                <input 
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={formData.proposed_margin}
                                    onChange={e => setFormData({...formData, proposed_margin: parseFloat(e.target.value) || 0})}
                                    className="w-24 rounded-xl border border-blue-200 p-2.5 text-center font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                                <span className="text-lg font-bold text-blue-900">%</span>
                                <span className="text-xs text-gray-500">
                                    (Esta comisión se distribuirá en Cashback para el comprador y beneficios para la red).
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TÉRMINOS Y CONDICIONES */}
                    <div className="pt-4 space-y-4 text-left">
                        {formData.is_virtual_store && (
                            <label className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl cursor-pointer hover:bg-purple-100 transition">
                                <div className="flex-shrink-0 pt-0.5">
                                    <input 
                                        type="checkbox" 
                                        required={formData.is_virtual_store}
                                        checked={formData.virtual_terms_accepted}
                                        onChange={e => setFormData({...formData, virtual_terms_accepted: e.target.checked})}
                                        className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                    />
                                </div>
                                <span className="text-sm text-purple-900">
                                    He leído y acepto los <button type="button" onClick={() => setShowVirtualTermsModal(true)} className="text-purple-700 font-bold hover:underline">Términos de Funcionamiento de la Tienda Virtual</button>. Comprendo el pago único de $37.000 COP, el saldo mínimo de $117.000 COP, y las reglas de calificación, comisión y liberación de pagos (Escrow).
                                </span>
                            </label>
                        )}
                        
                        <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition">
                            <div className="flex-shrink-0 pt-0.5">
                                <input 
                                    type="checkbox" 
                                    required
                                    checked={formData.terms_accepted}
                                    onChange={e => setFormData({...formData, terms_accepted: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                            </div>
                            <span className="text-sm text-gray-700">
                                He leído y acepto el <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 font-bold hover:underline">Anexo de Términos Comerciales y Condiciones para Comercios Aliados</button>. Comprendo que la Exclusividad Territorial está sujeta al cumplimiento de las políticas Anti-Elusión y pago de comisiones.
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={!formData.terms_accepted || (formData.is_virtual_store && !formData.virtual_terms_accepted) || loading}
                            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all text-base ${(formData.terms_accepted && (!formData.is_virtual_store || formData.virtual_terms_accepted)) ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            {loading ? 'ENVIANDO SOLICITUD...' : '🚀 ENVIAR POSTULACIÓN A REVISIÓN'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-left">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Términos Comerciales para Comercios Aliados</h3>
                            <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">
                                ✖
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 space-y-4">
                            <p><strong>TU EMPRESA INTERNACIONAL SAS (TEI)</strong></p>
                            <p>El presente documento constituye un Anexo vinculante a los Términos y Condiciones Generales de Uso. Al marcar la casilla de aceptación, El Aliado acepta someterse íntegramente a las siguientes cláusulas.</p>
                            
                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA SEGUNDA: BLINDAJE Y EXCLUSIVIDAD TERRITORIAL</h4>
                            <p>TEI se compromete a no afiliar ni promover a ningún otro establecimiento comercial del mismo rubro en un radio de <strong>300 metros</strong> a la redonda de la ubicación física registrada por El Aliado, durante un año (renovable).</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantApply;
