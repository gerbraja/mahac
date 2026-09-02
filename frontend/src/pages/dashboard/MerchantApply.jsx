import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const MerchantApply = () => {
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        document_id: '',
        phone: '',
        address: '',
        city: '',
        country: 'Colombia',
        category: 'products',
        iva_responsible: false,
        proposed_margin: 15,
        terms_accepted: false
    });
    const [copied, setCopied] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/api/merchants/my-merchant');
            if (res.data && res.data.status !== 'none') {
                setMerchant(res.data);
            } else {
                // Pre-fill from local user session if available
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    try {
                        const u = JSON.parse(savedUser);
                        setFormData(prev => ({
                            ...prev,
                            phone: u.phone || '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.terms_accepted) {
            alert("Debes aceptar los Términos y Condiciones para postular tu comercio.");
            return;
        }
        try {
            setLoading(true);
            await api.post('/api/merchants/apply', formData);
            alert("¡Solicitud enviada con éxito!");
            fetchStatus();
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!merchant?.magic_token) return;
        const url = `${window.location.origin}/magic-merchant/${merchant.magic_token}`;
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
            <div className="max-w-2xl mx-auto p-6 mt-10">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
                    <span className="text-5xl">⏳</span>
                    <h2 className="text-2xl font-bold text-amber-800 mt-4">Postulación en Revisión</h2>
                    <p className="text-gray-600 mt-2">
                        Tu solicitud para afiliar a <strong>"{merchant.name}"</strong> está siendo analizada por el equipo corporativo de TEI.
                    </p>
                    <div className="mt-6 p-4 bg-white rounded-xl text-left border border-amber-100 text-sm space-y-2 text-gray-700 max-w-md mx-auto">
                        <div><strong>Establecimiento:</strong> {merchant.name}</div>
                        <div><strong>Categoría:</strong> {merchant.category === 'services' ? 'Servicios' : merchant.category === 'highticket' ? 'Alto Ticket' : 'Productos / Almacén'}</div>
                        <div><strong>Comisión Propuesta:</strong> {merchant.commission_margin}%</div>
                        <div><strong>IVA:</strong> {merchant.tax_pct > 0 ? `${merchant.tax_pct}%` : 'No responsable (0%)'}</div>
                    </div>
                    <p className="text-xs text-amber-600 mt-6">
                        Te enviaremos una notificación cuando tu portal de ventas esté activo.
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
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
                    <span className="text-5xl">🏪</span>
                    <h2 className="text-2xl font-bold text-green-800 mt-4">¡Tu Comercio Aliado está Activo!</h2>
                    <p className="text-green-700 mt-1">
                        Felicidades, <strong>"{merchant.name}"</strong> ya es parte del ecosistema comercial de TEI.
                    </p>
                    
                    <div className="mt-8 bg-white rounded-2xl p-6 border border-green-100 text-left max-w-xl mx-auto shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Acceso a Caja (Portal de Ventas)</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Usa este enlace mágico en cualquier celular, tablet o computador de caja. Tus cajeros no necesitarán usuario ni contraseña para registrar ventas.
                        </p>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                readOnly 
                                value={magicUrl}
                                className="flex-1 bg-gray-50 p-3 rounded-lg border text-sm text-gray-600 font-mono focus:outline-none"
                            />
                            <button 
                                type="button"
                                onClick={handleCopyLink}
                                className={`px-4 rounded-lg text-white font-medium text-sm transition-all shadow ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {copied ? '¡Copiado!' : 'Copiar'}
                            </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                            <a 
                                href={magicUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-lg font-semibold shadow transition-all text-sm animate-pulse"
                            >
                                💻 Abrir Portal de Caja
                            </a>
                            <div className="flex-1 p-2 bg-gray-50 rounded-lg text-center text-xs text-gray-500 flex items-center justify-center">
                                Margen Pactado: <strong className="text-gray-800 ml-1">{merchant.commission_margin}%</strong>
                            </div>
                        </div>
                    </div>
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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <span className="text-4xl">🏪</span>
                    <h1 className="text-2xl font-bold mt-2">Registra tu Comercio Aliado</h1>
                    <p className="text-blue-100 text-sm mt-1">
                        Atrae a toda la comunidad de afiliados de TEI a tu negocio físico y multiplica tus ventas.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Nombre del Establecimiento *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ej. Panadería La 10, Dianis Odontología"
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
                            <label className="block text-sm font-semibold text-gray-700">Celular de Contacto *</label>
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
                    </div>

                    <hr className="border-gray-100" />

                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 text-base">⚙️ Configuración del Negocio</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Categoría del Establecimiento</label>
                                <select 
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="products">🛍️ Productos (Almacén, Panadería, Carnicería, Calzado, Ropa)</option>
                                    <option value="services">💇‍♂️ Servicios (Odontología, Peluquería, Spa, Gimnasio)</option>
                                    <option value="highticket">🏍️ Alto Ticket (Motos, Bicicletas, Electrodomésticos)</option>
                                </select>
                            </div>
                            
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
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
                            <label className="block text-sm font-semibold text-blue-900">
                                ¿Qué porcentaje (%) estás dispuesto a otorgar en comisiones por cliente TEI?
                            </label>
                            
                            <p className="text-xs text-blue-750 font-semibold mt-1">
                                {getRangeText()}
                            </p>

                            <div className="flex items-center gap-3 mt-3">
                                <input 
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={formData.proposed_margin}
                                    onChange={e => setFormData({...formData, proposed_margin: parseFloat(e.target.value) || 0})}
                                    className="w-24 rounded-lg border border-blue-200 p-2 text-center font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-lg font-bold text-blue-900">%</span>
                                <span className="text-xs text-gray-500">
                                    (Esta comisión se distribuirá automáticamente en Cashback para el comprador y beneficios para la red).
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
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
                            disabled={!formData.terms_accepted || loading}
                            className={`w-full font-semibold py-3.5 rounded-xl shadow-lg transition-all text-sm ${formData.terms_accepted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                            {loading ? 'ENVIANDO...' : 'ENVIAR POSTULACIÓN A REVISIÓN'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Términos Comerciales para Comercios Aliados</h3>
                            <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✖
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 space-y-4">
                            <p><strong>TU EMPRESA INTERNACIONAL SAS (TEI)</strong></p>
                            <p>El presente documento constituye un Anexo vinculante a los Términos y Condiciones Generales de Uso. Al marcar la casilla de aceptación, El Aliado acepta someterse íntegramente a las siguientes cláusulas.</p>
                            
                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA SEGUNDA: BLINDAJE Y EXCLUSIVIDAD TERRITORIAL</h4>
                            <p>TEI se compromete a no afiliar ni promover a ningún otro establecimiento comercial del mismo rubro en un radio de <strong>300 metros</strong> a la redonda de la ubicación física registrada por El Aliado, durante un año (renovable).</p>
                            
                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA TERCERA: NO COMPETENCIA Y EXCLUSIVIDAD RECÍPROCA</h4>
                            <p>En contraprestación al Blindaje Territorial otorgado, El Aliado asume un compromiso de exclusividad respecto al modelo de negocio por un período de <strong>365 días calendario</strong> contados a partir de la aceptación de este acuerdo.</p>
                            <p><strong>Sanción por Incumplimiento:</strong> Dado que TEI ha subsidiado el 100% del costo de afiliación (valor comercial estimado en $970.000 COP), en caso de que El Aliado incumpla esta cláusula uniéndose a una plataforma competidora dentro de los 365 días, <strong>deberá pagar inmediatamente a TEI la tarifa de inscripción estándar de $970.000 COP</strong> por concepto de cláusula penal.</p>

                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA QUINTA: POLÍTICA ANTI-ELUSIÓN Y PREVENCIÓN DE FRAUDE</h4>
                            <p>Queda estrictamente prohibido que El Aliado ofrezca a los clientes de TEI acuerdos por fuera de la plataforma.</p>
                            <p><strong>Sanción por Elusión (Mala Fe Comercial):</strong> Si TEI comprueba fraude o elusión intencional, El Aliado perderá automáticamente el subsidio de ingreso y deberá pagar la tarifa de inscripción de $970.000 COP, sumado a una sanción pecuniaria equivalente a diez (10) veces el valor de la comisión eludida, montos exigibles de manera ejecutiva.</p>

                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA SEXTA: LIQUIDACIÓN, PAGOS Y AUDITORÍA</h4>
                            <p>Los periodos de corte se establecen del día cuatro (04) de un mes al día tres (03) del mes siguiente. El Aliado deberá transferir o consignar a las cuentas oficiales de TEI el porcentaje total de comisiones acumuladas, a más tardar entre los días cuatro (4) y seis (6) de cada mes.</p>

                            <h4 className="font-bold text-gray-800 mt-4">CLÁUSULA OCTAVA: ACEPTACIÓN DIGITAL Y VALIDEZ JURÍDICA</h4>
                            <p>El registro electrónico efectuado por El Aliado equivale a su firma manuscrita. Los registros de acceso (IP, fecha y hora) almacenados en los servidores de TEI servirán como prueba plena de la aceptación voluntaria de este Anexo.</p>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button onClick={() => setShowTermsModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
                                Entendido, cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantApply;
