import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';
import { State } from 'country-state-city';
import { COLOMBIA_DIVIPOLA_COMPLETO } from '../../data/colombiaDivipolaCompleto';

const AdminKYC = () => {
    const { globalCountry } = useAdmin();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    
    // Rejection state
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form for manual edits & tax setup
    const [editForm, setEditForm] = useState({
        full_name_cedula: '',
        document_id_rut: '',
        address: '',
        department: '',
        city: '',
        bank_name: '',
        bank_account_type: '',
        bank_account_number: '',
        apply_retefuente: true,
        retefuente_rate: 6.0,
        apply_reteica: true,
        reteica_rate: 0.0,
        tax_regime: '',
        municipio_id: ''
    });

    useEffect(() => {
        fetchRecords();
    }, [globalCountry]);

    // Populate form and calculate defaults when selecting a record
    useEffect(() => {
        if (selectedRecord) {
            const cityLower = (selectedRecord.input_city || '').toLowerCase().trim();
            let defaultIca = 0.0;
            if (cityLower.includes('bogota') || cityLower.includes('bogotá')) defaultIca = 0.966;
            else if (cityLower.includes('medellin') || cityLower.includes('medellín')) defaultIca = 0.69;
            else if (cityLower.includes('cali')) defaultIca = 0.77;
            else if (cityLower.includes('barranquilla')) defaultIca = 0.8;
            else if (cityLower.includes('bucaramanga')) defaultIca = 0.8;

            const regimeText = (selectedRecord.tax_regime || '').toLowerCase();
            const isRst = regimeText.includes('simple') || regimeText.includes('rst') || regimeText.includes('47') ||
                          (selectedRecord.extracted_metadata && selectedRecord.extracted_metadata.includes('47'));
            const isDeclarante = selectedRecord.details?.is_declarante || false;
            
            let defaultRete = 6.0;
            let applyRete = true;
            if (isRst) {
                defaultRete = 0.0;
                applyRete = false;
            } else if (!isDeclarante) {
                defaultRete = 10.0;
                applyRete = true;
            } else {
                defaultRete = 6.0;
                applyRete = true;
            }

            // Auto-detect DIVIPOLA code based on user's inputted department and city
            const deptName = selectedRecord.input_department || '';
            const cityName = selectedRecord.input_city || '';
            let resolvedDivipola = '';
            
            if (deptName && cityName) {
                const normalizeStr = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                const cleanDept = normalizeStr(deptName);
                const cleanCity = normalizeStr(cityName);
                
                const stateObj = State.getStatesOfCountry("CO").find(s => 
                    normalizeStr(s.name) === cleanDept
                );
                
                if (stateObj) {
                    const citiesMap = COLOMBIA_DIVIPOLA_COMPLETO[stateObj.isoCode] || {};
                    const matchedCityKey = Object.keys(citiesMap).find(k => 
                        normalizeStr(k) === cleanCity
                    );
                    if (matchedCityKey) {
                        resolvedDivipola = citiesMap[matchedCityKey];
                    }
                }
            }

            const isPending = selectedRecord.status === 'pending';

            setEditForm({
                full_name_cedula: selectedRecord.input_full_name_cedula || selectedRecord.user_name || '',
                document_id_rut: selectedRecord.input_document_id_rut || selectedRecord.user_document || '',
                address: selectedRecord.input_address || '',
                department: selectedRecord.input_department || '',
                city: selectedRecord.input_city || '',
                bank_name: selectedRecord.input_bank_name || selectedRecord.bank_name || '',
                bank_account_type: selectedRecord.input_bank_account_type || selectedRecord.bank_account_type || 'Ahorros',
                bank_account_number: selectedRecord.input_bank_account_number || selectedRecord.bank_account_number || '',
                apply_retefuente: isPending ? applyRete : (selectedRecord.apply_retefuente ?? applyRete),
                retefuente_rate: isPending ? defaultRete : (selectedRecord.retefuente_rate ?? defaultRete),
                apply_reteica: isPending ? (defaultIca > 0) : (selectedRecord.apply_reteica ?? (defaultIca > 0)),
                reteica_rate: isPending ? defaultIca : (selectedRecord.reteica_rate ?? defaultIca),
                tax_regime: selectedRecord.tax_regime || (isRst ? 'Régimen Simple (RST)' : 'Régimen Ordinario'),
                municipio_id: selectedRecord.municipio_id || resolvedDivipola || ''
            });
            setRejecting(false);
            setRejectionReason('');
        }
    }, [selectedRecord]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const res = await api.get(`/api/kyc/admin/records?${queryParams.toString()}`);
            setRecords(res.data);
        } catch (error) {
            console.error("Error fetching KYC records", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to check for discrepancies (strips accents and symbols)
    const checkMismatch = (field, userInput, aiOutput) => {
        if (!userInput || !aiOutput) return false;
        
        let u = String(userInput).toLowerCase().trim();
        let a = String(aiOutput).toLowerCase().trim();
        
        if (field === 'document' || field === 'account') {
            u = u.replace(/\D/g, '');
            a = a.replace(/\D/g, '');
            if (u.length === a.length + 1 && u.startsWith(a)) return false;
            if (a.length === u.length + 1 && a.startsWith(u)) return false;
        }

        if (field === 'city') {
            const stripAccents = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            u = stripAccents(u);
            a = stripAccents(a);
            if (u.includes(a) || a.includes(u)) return false;
        }

        if (field === 'name') {
            const wordsU = u.split(/\s+/);
            const wordsA = a.split(/\s+/);
            // If they share at least 2 words (e.g. first name and first last name), count as match
            let common = 0;
            wordsU.forEach(w => {
                if (w.length > 2 && wordsA.includes(w)) common++;
            });
            if (common >= 2) return false;
        }
        
        return u !== a;
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await api.post(`/api/kyc/admin/approve/${selectedRecord.id}`, {
                full_name_cedula: editForm.full_name_cedula,
                document_id_rut: editForm.document_id_rut,
                address: editForm.address,
                department: editForm.department,
                city: editForm.city,
                bank_name: editForm.bank_name,
                bank_account_type: editForm.bank_account_type,
                bank_account_number: editForm.bank_account_number,
                apply_retefuente: editForm.apply_retefuente,
                retefuente_rate: Number(editForm.retefuente_rate),
                apply_reteica: editForm.apply_reteica,
                reteica_rate: Number(editForm.reteica_rate),
                tax_regime: editForm.tax_regime,
                municipio_id: editForm.municipio_id || null
            });
            alert("KYC Aprobado con éxito y perfil tributario configurado.");
            setSelectedRecord(null);
            fetchRecords();
        } catch (error) {
            console.error("Error approving KYC", error);
            alert(error.response?.data?.detail || "Error al aprobar KYC.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert("Debes escribir un motivo de rechazo.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/api/kyc/admin/reject/${selectedRecord.id}`, {
                reason: rejectionReason
            });
            alert("KYC Rechazado con éxito.");
            setSelectedRecord(null);
            fetchRecords();
        } catch (error) {
            console.error("Error rejecting KYC", error);
            alert("Error al rechazar KYC.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Validaciones KYC & Cumplimiento</h1>
                <button onClick={fetchRecords} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-lg transition">
                    🔄 Recargar Tabla
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">País</th>
                                <th className="p-4">Documento</th>
                                <th className="p-4">Validación IA</th>
                                <th className="p-4">Estado Admin</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center text-slate-400">Cargando registros de cumplimiento...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan="6" className="p-6 text-center text-slate-400">No hay registros de KYC para verificar aún.</td></tr>
                            ) : (
                                records.map((record) => {
                                    const hasMismatch = record.ai_validation_status === 'mismatched';
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-950">
                                                {record.user_name}
                                                <div className="text-xs text-slate-400 font-normal">{record.user_email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="flex items-center gap-1.5">
                                                    {record.country === 'Colombia' ? '🇨🇴' :
                                                     record.country === 'Panama' ? '🇵🇦' : '🇩🇴'}
                                                    {record.country}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs">{record.user_document || 'No registrado'}</td>
                                            <td className="p-4">
                                                {hasMismatch ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                                        ⚠️ Discrepancia
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                                        ✅ Exitoso
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {record.status === 'approved' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        Aprobado
                                                    </span>
                                                ) : record.status === 'rejected' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        Rechazado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition"
                                                >
                                                    Revisar / Editar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Verification Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 backdrop-blur-md">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Revisión de Cumplimiento KYC</h2>
                                <p className="text-xs text-slate-500">Compara los datos ingresados por el usuario, corrígelos si hay errores tipográficos y aprueba el perfil fiscal.</p>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600 text-2xl transition">×</button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 flex-1">
                            
                            {/* User details summary */}
                            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider block">Usuario</span><span className="font-medium text-slate-900">{selectedRecord.user_name}</span></div>
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider block">Email</span><span className="font-medium text-slate-900">{selectedRecord.user_email}</span></div>
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider block">País</span><span className="font-medium text-slate-900">{selectedRecord.country}</span></div>
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider block">PEP Declarado</span>
                                    {selectedRecord.is_pep ? (
                                        <span className="text-red-600 font-bold">⚠️ SÍ - PEP ({selectedRecord.details.pep_details})</span>
                                    ) : (
                                        <span className="text-green-600">NO</span>
                                    )}
                                </div>
                            </div>

                            {/* Section: Discrepancy check & manual correction */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3 border-l-4 border-blue-500 pl-2">Datos Declarados e Información Extraída por la IA</h3>
                                
                                <div className="space-y-4">
                                    {/* Document Mismatches */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre en la Cédula</label>
                                            <input
                                                type="text"
                                                name="full_name_cedula"
                                                value={editForm.full_name_cedula}
                                                onChange={handleFormChange}
                                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">Leído del Documento por IA:</span>
                                            <span className="font-medium text-slate-800 italic">"{selectedRecord.input_full_name_cedula || 'No disponible'}"</span>
                                        </div>
                                        <div>
                                            {checkMismatch('name', editForm.full_name_cedula, selectedRecord.user_name) && (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    ⚠️ Discrepa del perfil ({selectedRecord.user_name})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* NIT / Document */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIT / Documento (RUT)</label>
                                            <input
                                                type="text"
                                                name="document_id_rut"
                                                value={editForm.document_id_rut}
                                                onChange={handleFormChange}
                                                className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                                    checkMismatch('document', editForm.document_id_rut, selectedRecord.rut_nit) ? 'border-red-300 bg-red-50/20' : ''
                                                }`}
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">NIT Leído en el RUT por IA:</span>
                                            <span className="font-mono font-medium text-slate-800 italic">"{selectedRecord.rut_nit || 'No extraído'}"</span>
                                        </div>
                                        <div>
                                            {checkMismatch('document', editForm.document_id_rut, selectedRecord.rut_nit) && (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                                    ❌ Mismatch: Verifica el PDF del RUT
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dirección */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Física</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={editForm.address}
                                                onChange={handleFormChange}
                                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">Dirección registrada:</span>
                                            <span className="font-medium text-slate-800 italic">"{selectedRecord.input_address || 'No declarada'}"</span>
                                        </div>
                                        <div></div>
                                    </div>

                                    {/* Departamento y Ciudad */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Depto</label>
                                                <input
                                                    type="text"
                                                    name="department"
                                                    value={editForm.department}
                                                    onChange={handleFormChange}
                                                    className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={editForm.city}
                                                    onChange={handleFormChange}
                                                    className={`w-full mt-1 px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                                        checkMismatch('city', editForm.city, selectedRecord.rut_city) ? 'border-red-300 bg-red-50/20' : ''
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">Ciudad Leída en RUT por IA:</span>
                                            <span className="font-medium text-slate-800 italic">"{selectedRecord.rut_city || 'No extraída'}"</span>
                                        </div>
                                        <div>
                                            {checkMismatch('city', editForm.city, selectedRecord.rut_city) && (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                                    ❌ Mismatch en Ciudad
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bank and account type */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Banco</label>
                                                <input
                                                    type="text"
                                                    name="bank_name"
                                                    value={editForm.bank_name}
                                                    onChange={handleFormChange}
                                                    className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo Cuenta</label>
                                                <select
                                                    name="bank_account_type"
                                                    value={editForm.bank_account_type}
                                                    onChange={handleFormChange}
                                                    className="w-full mt-1 px-2 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                >
                                                    <option value="Ahorros">Ahorros</option>
                                                    <option value="Corriente">Corriente</option>
                                                    <option value="Digital">Digital / Depósito</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">Banco Leído por IA:</span>
                                            <span className="font-medium text-slate-800 italic">"{selectedRecord.bank_name || 'No extraído'}"</span>
                                        </div>
                                        <div></div>
                                    </div>

                                    {/* Account Number */}
                                    <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número de Cuenta Bancaria</label>
                                            <input
                                                type="text"
                                                name="bank_account_number"
                                                value={editForm.bank_account_number}
                                                onChange={handleFormChange}
                                                className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                                    checkMismatch('account', editForm.bank_account_number, selectedRecord.bank_account_number) ? 'border-red-300 bg-red-50/20' : ''
                                                }`}
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400 block font-semibold">Cuenta Leída por IA:</span>
                                            <span className="font-mono font-medium text-slate-800 italic">"{selectedRecord.bank_account_number || 'No extraída'}"</span>
                                        </div>
                                        <div>
                                            {checkMismatch('account', editForm.bank_account_number, selectedRecord.bank_account_number) && (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                                    ❌ Mismatch: Verifica el Certificado Bancario
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Section: RUT Tax configuration profile */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                                    💼 Perfil Tributario de Retenciones (Colombia)
                                </h3>

                                <div className="grid grid-cols-3 gap-6">
                                    {/* Regime display & update */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Régimen Fiscal (RUT)</label>
                                        <input
                                            type="text"
                                            name="tax_regime"
                                            value={editForm.tax_regime}
                                            onChange={handleFormChange}
                                            placeholder="Ej: Régimen Simple (RST)"
                                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Leído por IA: "{selectedRecord.tax_regime || 'No detectado'}"</span>
                                    </div>

                                    {/* Retefuente config */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                            <input
                                                type="checkbox"
                                                name="apply_retefuente"
                                                checked={editForm.apply_retefuente}
                                                onChange={handleFormChange}
                                                className="rounded text-blue-600"
                                            />
                                            Aplica Retefuente
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="retefuente_rate"
                                                disabled={!editForm.apply_retefuente}
                                                value={editForm.retefuente_rate}
                                                onChange={handleFormChange}
                                                className="w-24 px-3 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                            <span className="text-sm font-semibold text-slate-500">%</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 block">Simple/RST = 0%. No Declarante = 10%. Declarante = 6%.</span>
                                    </div>

                                    {/* ReteICA config */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                            <input
                                                type="checkbox"
                                                name="apply_reteica"
                                                checked={editForm.apply_reteica}
                                                onChange={handleFormChange}
                                                className="rounded text-blue-600"
                                            />
                                            Aplica ReteICA
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.001"
                                                name="reteica_rate"
                                                disabled={!editForm.apply_reteica}
                                                value={editForm.reteica_rate}
                                                onChange={handleFormChange}
                                                className="w-24 px-3 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                            <span className="text-sm font-semibold text-slate-500">%</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 block">Tarifa en {editForm.city || 'Ciudad'}. Bogota: 0.966%. Medellin: 0.69%</span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Código DIVIPOLA Municipio (Opcional - DIAN)</label>
                                        <input
                                            type="text"
                                            name="municipio_id"
                                            value={editForm.municipio_id}
                                            onChange={handleFormChange}
                                            placeholder="Ej: 11001"
                                            className="w-32 px-3 py-1.5 border rounded-lg text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Documents links */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3 border-l-4 border-green-500 pl-2">Documentos Adjuntos</h3>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <a
                                        href={selectedRecord.rut_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 border rounded-xl hover:bg-slate-50 text-blue-600 border-slate-200 bg-white font-semibold transition"
                                    >
                                        📄 Abrir PDF de RUT
                                    </a>
                                    <a
                                        href={selectedRecord.cedula_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 border rounded-xl hover:bg-slate-50 text-blue-600 border-slate-200 bg-white font-semibold transition"
                                    >
                                        📄 Abrir PDF de Cédula
                                    </a>
                                    <a
                                        href={selectedRecord.bank_certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 border rounded-xl hover:bg-slate-50 text-blue-600 border-slate-200 bg-white font-semibold transition"
                                    >
                                        📄 Abrir Cert. Bancaria
                                    </a>
                                </div>
                            </div>

                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                            <div>
                                {rejecting ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Escribe el motivo del rechazo..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="px-3 py-2 border rounded-lg text-sm bg-white w-80"
                                        />
                                        <button
                                            onClick={handleReject}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition"
                                        >
                                            Confirmar Rechazo
                                        </button>
                                        <button
                                            onClick={() => setRejecting(false)}
                                            className="px-3 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-300"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setRejecting(true)}
                                        className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-sm border border-red-200 transition"
                                    >
                                        ❌ Rechazar Solicitud
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition"
                                >
                                    Cerrar
                                </button>
                                {!rejecting && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-sm transition"
                                    >
                                        {submitting ? "Procesando..." : "✅ Aprobar KYC y Guardar Tasas"}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKYC;
