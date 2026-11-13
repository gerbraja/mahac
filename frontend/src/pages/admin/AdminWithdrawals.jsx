import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';
import { 
    Download, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Building2, 
    CreditCard, 
    Copy, 
    Check, 
    RefreshCw, 
    ArrowRightLeft, 
    DollarSign,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';

export default function AdminWithdrawals() {
    const { globalCountry } = useAdmin();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // pending, paid, rejected
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isApprovingBatch, setIsApprovingBatch] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(null);

    // Refs for synchronized horizontal scroll (Top and Table)
    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(0);

    useEffect(() => {
        fetchRequests();
        setSelectedIds([]);
    }, [activeTab, globalCountry]);

    // Measure table width for the top scrollbar
    const updateScrollWidth = () => {
        if (tableScrollRef.current) {
            setTableScrollWidth(tableScrollRef.current.scrollWidth);
        }
    };

    useEffect(() => {
        updateScrollWidth();
        const handleResize = () => updateScrollWidth();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [requests, activeTab]);

    const handleTopScroll = () => {
        if (topScrollRef.current && tableScrollRef.current) {
            tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        }
    };

    const handleTableScroll = () => {
        if (topScrollRef.current && tableScrollRef.current) {
            topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ status: activeTab });
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const response = await api.get(`/api/admin/withdrawals?${queryParams.toString()}`);
            setRequests(response.data);
            setTimeout(updateScrollWidth, 100);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            setMessage('Error al cargar solicitudes de retiro');
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text, id) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedAccount(id);
        setTimeout(() => setCopiedAccount(null), 2000);
    };

    // Single Approve
    const handleApprove = async (id) => {
        if (!window.confirm('¿Confirmas que has realizado este pago? Esta acción marcará el retiro como PAGADO.')) {
            return;
        }

        try {
            await api.post(`/api/admin/withdrawals/${id}/approve`);
            setMessage('Retiro aprobado y marcado como pagado exitosamente.');
            setSelectedIds(prev => prev.filter(item => item !== id));
            fetchRequests();
            setTimeout(() => setMessage(''), 4000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al aprobar retiro');
        }
    };

    // Single Reject
    const handleReject = async (id) => {
        if (!rejectReason) {
            alert('Por favor indica una razón para el rechazo.');
            return;
        }

        if (!window.confirm('¿Estás seguro de RECHAZAR este retiro? El dinero será devuelto al saldo del usuario.')) {
            return;
        }

        try {
            await api.post(`/api/admin/withdrawals/${id}/reject`, { reason: rejectReason });
            setMessage('Retiro rechazado y fondos devueltos a la billetera del usuario.');
            setRejectingId(null);
            setRejectReason('');
            setSelectedIds(prev => prev.filter(item => item !== id));
            fetchRequests();
            setTimeout(() => setMessage(''), 4000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al rechazar retiro');
        }
    };

    // Batch Approve
    const handleBatchApprove = async () => {
        if (selectedIds.length === 0) {
            alert('Selecciona al menos una solicitud para aprobar en lote.');
            return;
        }

        const confirmMsg = `¿Confirmas que deseas aprobar y marcar como PAGADOS los ${selectedIds.length} retiros seleccionados? Esta acción es definitiva.`;
        if (!window.confirm(confirmMsg)) return;

        setIsApprovingBatch(true);
        try {
            const response = await api.post('/api/admin/withdrawals/batch-approve', {
                request_ids: selectedIds
            });
            setMessage(response.data?.message || 'Retiros aprobados en lote con éxito.');
            setSelectedIds([]);
            fetchRequests();
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al procesar la aprobación masiva.');
        } finally {
            setIsApprovingBatch(false);
        }
    };

    // Select/Deselect handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === requests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requests.map(r => r.id));
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Export to Bank File (CSV / ACH Excel compatible)
    const exportBankFile = () => {
        const recordsToExport = selectedIds.length > 0
            ? requests.filter(r => selectedIds.includes(r.id))
            : requests;

        if (recordsToExport.length === 0) {
            alert('No hay solicitudes disponibles para exportar.');
            return;
        }

        const headers = [
            "ID Retiro",
            "Fecha Solicitud",
            "Beneficiario (Titular)",
            "Email Usuario",
            "Tipo Doc",
            "Numero Doc / NIT",
            "Codigo ACH Banco",
            "Nombre Banco",
            "Tipo de Cuenta",
            "Numero de Cuenta",
            "Monto Bruto (USD/COP)",
            "Tasa Retefuente (%)",
            "Valor Retefuente",
            "Tasa ReteICA (%)",
            "Valor ReteICA",
            "Total Retenciones",
            "Neto a Pagar (Banco)",
            "Regimen Fiscal",
            "Estado KYC"
        ];

        const rows = recordsToExport.map(r => [
            r.id,
            new Date(r.created_at).toISOString().slice(0, 10),
            `"${(r.beneficiary_name || r.user_name || '').replace(/"/g, '""')}"`,
            `"${(r.user_email || '').replace(/"/g, '""')}"`,
            "CC/NIT",
            `"${(r.beneficiary_doc || r.user_doc || '').replace(/"/g, '""')}"`,
            `"${(r.bank_ach_code || '').replace(/"/g, '""')}"`,
            `"${(r.bank_name || '').replace(/"/g, '""')}"`,
            `"${(r.bank_account_type || 'Ahorros').replace(/"/g, '""')}"`,
            `"\t${r.bank_account_number || ''}"`, // Leading tab prevents scientific notation in Excel
            (r.gross_amount ?? r.amount ?? 0).toFixed(2),
            (r.retefuente_rate ?? 0).toFixed(2),
            (r.retefuente_val ?? 0).toFixed(2),
            (r.reteica_rate ?? 0).toFixed(3),
            (r.reteica_val ?? 0).toFixed(2),
            (r.total_withholding ?? 0).toFixed(2),
            (r.net_amount ?? r.amount ?? 0).toFixed(2),
            `"${(r.tax_regime || 'Régimen Ordinario').replace(/"/g, '""')}"`,
            r.user_kyc ? "Verificado" : "No Verificado"
        ]);

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.join(";"))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `retiros_banco_ACH_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate quick totals
    const totalGross = requests.reduce((sum, r) => sum + (r.gross_amount ?? r.amount ?? 0), 0);
    const totalWithholdings = requests.reduce((sum, r) => sum + (r.total_withholding ?? 0), 0);
    const totalNet = requests.reduce((sum, r) => sum + (r.net_amount ?? r.amount ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ArrowRightLeft className="w-7 h-7 text-blue-600" />
                        Gestión de Retiros Masivos
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Control de solicitudes de desembolso bancario, retenciones tributarias (DIAN / ICA) y dispersión ACH.
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
                        title="Recargar listado"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Recargar</span>
                    </button>

                    <button
                        onClick={exportBankFile}
                        disabled={requests.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                            requests.length === 0 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                        }`}
                        title="Descargar archivo estructurado compatible con ACH bancario y Excel"
                    >
                        <Download className="w-4 h-4" />
                        <span>
                            Descargar Archivo Banco {selectedIds.length > 0 ? `(${selectedIds.length} selec.)` : '(Todos)'}
                        </span>
                    </button>

                    {activeTab === 'pending' && (
                        <button
                            onClick={handleBatchApprove}
                            disabled={selectedIds.length === 0 || isApprovingBatch}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                                selectedIds.length === 0 || isApprovingBatch
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>
                                {isApprovingBatch 
                                    ? 'Aprobando...' 
                                    : `Aprobar Lote Masivo (${selectedIds.length})`}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification alert */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    message.includes('Error') 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
                }`}>
                    {message.includes('Error') ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />}
                    <span className="text-sm font-medium">{message}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monto Bruto Total</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Retenciones (DIAN + ICA)</p>
                        <p className="text-xl font-bold text-amber-700 mt-1">-${totalWithholdings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                        %
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Neto Total a Dispersar (Banco)</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <CreditCard className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 gap-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
                        activeTab === 'pending'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Pendientes por Pago</span>
                    {activeTab === 'pending' && requests.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-bold">
                            {requests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('paid')}
                    className={`pb-3 px-5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
                        activeTab === 'paid'
                            ? 'text-emerald-600 border-emerald-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>Historial Pagados</span>
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`pb-3 px-5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
                        activeTab === 'rejected'
                            ? 'text-red-600 border-red-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazados</span>
                </button>
            </div>

            {/* MAIN TABLE CONTAINER WITH TOP SCROLLBAR */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Visual indicator for horizontal scrolling */}
                <div className="px-4 py-2 bg-slate-50 border-b border-gray-200 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        Desplaza la barra de aquí arriba hacia la derecha para ver todas las columnas:
                    </span>
                    <span className="font-semibold text-slate-700">
                        {requests.length} registros {selectedIds.length > 0 && `(${selectedIds.length} seleccionados)`}
                    </span>
                </div>

                {/* 1. TOP SYNCHRONIZED SCROLLBAR */}
                <div
                    ref={topScrollRef}
                    onScroll={handleTopScroll}
                    className="overflow-x-auto bg-slate-100 border-b border-gray-300"
                    style={{ minHeight: '16px' }}
                >
                    <div style={{ width: `${tableScrollWidth}px`, height: '16px' }}></div>
                </div>

                {/* 2. TABLE BODY (CONNECTED WITH SYNCHRONIZED SCROLL) */}
                <div
                    ref={tableScrollRef}
                    onScroll={handleTableScroll}
                    className="overflow-x-auto"
                >
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <tr>
                                {activeTab === 'pending' && (
                                    <th className="px-4 py-3.5 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={requests.length > 0 && selectedIds.length === requests.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            title="Seleccionar todos"
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-3.5 whitespace-nowrap">Fecha</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Beneficiario</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Doc / NIT</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Banco & Código ACH</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Tipo & Cuenta</th>
                                <th className="px-4 py-3.5 whitespace-nowrap text-right">Monto Bruto</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Retenciones (ReteFuente + ICA)</th>
                                <th className="px-4 py-3.5 whitespace-nowrap text-right">Neto a Pagar (Banco)</th>
                                <th className="px-4 py-3.5 whitespace-nowrap text-center">Estado KYC</th>
                                <th className="px-4 py-3.5 whitespace-nowrap text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 11 : 10} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                            <span>Cargando solicitudes de retiro...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 11 : 10} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Clock className="w-8 h-8 text-gray-300" />
                                            <p className="font-medium text-gray-600">No hay solicitudes {activeTab === 'pending' ? 'pendientes' : 'en esta sección'}.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => {
                                    const isSelected = selectedIds.includes(req.id);
                                    const isRst = (req.tax_regime || '').toLowerCase().includes('simple') || (req.tax_regime || '').toLowerCase().includes('rst') || (req.tax_regime || '').includes('47');

                                    return (
                                        <tr 
                                            key={req.id} 
                                            className={`transition-colors hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/70' : ''}`}
                                        >
                                            {/* Checkbox */}
                                            {activeTab === 'pending' && (
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectOne(req.id)}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                            )}

                                            {/* Fecha */}
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-xs">
                                                <div className="font-semibold text-gray-900">
                                                    {new Date(req.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </div>
                                                <div className="text-gray-400">
                                                    {new Date(req.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Beneficiario */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-bold text-gray-900">
                                                    {req.beneficiary_name || req.user_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {req.user_email}
                                                </div>
                                                {req.beneficiary_name && req.user_name && req.beneficiary_name !== req.user_name && (
                                                    <div className="text-[10px] text-amber-600 font-medium">
                                                        Usuario: {req.user_name}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Doc / NIT */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                    {req.beneficiary_doc || req.user_doc || 'No Registrado'}
                                                </span>
                                            </td>

                                            {/* Banco & Código ACH */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                                                    <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                    <span>{req.bank_name || 'No especificado'}</span>
                                                </div>
                                                <div className="mt-0.5">
                                                    {req.bank_ach_code && req.bank_ach_code !== 'N/A' ? (
                                                        <span className="text-[11px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold border border-blue-200">
                                                            ACH: {req.bank_ach_code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400">Sin código ACH</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Tipo & Cuenta */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {req.bank_account_type || 'Ahorros'}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-mono text-xs font-bold text-gray-900 tracking-wider">
                                                        {req.bank_account_number || req.payment_info || 'N/A'}
                                                    </span>
                                                    {req.bank_account_number && (
                                                        <button
                                                            onClick={() => handleCopy(req.bank_account_number, req.id)}
                                                            className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                                                            title="Copiar número de cuenta"
                                                        >
                                                            {copiedAccount === req.id ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Monto Bruto */}
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <span className="font-bold text-gray-900">
                                                    ${(req.gross_amount ?? req.amount ?? 0).toFixed(2)}
                                                </span>
                                            </td>

                                            {/* Retenciones */}
                                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                                                {isRst ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                        Exento RST (0%)
                                                    </span>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <div className="flex justify-between gap-3 text-gray-600">
                                                            <span>Retefuente ({req.retefuente_rate || 0}%):</span>
                                                            <span className="font-medium text-gray-800">-${(req.retefuente_val || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-3 text-gray-600">
                                                            <span>ReteICA ({req.reteica_rate || 0}%):</span>
                                                            <span className="font-medium text-gray-800">-${(req.reteica_val || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-3 pt-0.5 border-t border-gray-100 font-bold text-amber-700">
                                                            <span>Total Retenido:</span>
                                                            <span>-${(req.total_withholding || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Neto a Pagar (Banco) */}
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                                    ${(req.net_amount ?? req.amount ?? 0).toFixed(2)}
                                                </span>
                                            </td>

                                            {/* Estado KYC */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                {req.user_kyc ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                        Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                        No Verificado
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                {activeTab === 'pending' && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Aprobar
                                                        </button>

                                                        {rejectingId === req.id ? (
                                                            <div className="flex flex-col gap-1 text-left min-w-[140px]">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Motivo..."
                                                                    className="border border-gray-300 p-1 rounded text-xs w-full focus:ring-1 focus:ring-red-500 outline-none"
                                                                    value={rejectReason}
                                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleReject(req.id)}
                                                                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs font-medium"
                                                                    >
                                                                        Confirmar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Rechazar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === 'paid' && (
                                                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        Pagado {req.processed_at ? new Date(req.processed_at).toLocaleDateString('es-CO') : ''}
                                                    </span>
                                                )}

                                                {activeTab === 'rejected' && (
                                                    <div className="text-xs">
                                                        <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 block">
                                                            Rechazado
                                                        </span>
                                                        {req.rejection_reason && (
                                                            <span className="text-gray-400 block mt-0.5 text-[11px] max-w-[150px] truncate" title={req.rejection_reason}>
                                                                {req.rejection_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
