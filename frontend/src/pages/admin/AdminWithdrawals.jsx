
import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminWithdrawals() {
    const { globalCountry } = useAdmin();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // pending, paid, rejected
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [activeTab, globalCountry]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ status: activeTab });
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const response = await api.get(`/api/admin/withdrawals?${queryParams.toString()}`);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            setMessage('Error al cargar solicitudes de retiro');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('¿Confirmas que has realizado este pago? Esta acción marcará el retiro como PAGADO.')) {
            return;
        }

        try {
            await api.post(`/api/admin/withdrawals/${id}/approve`);
            setMessage('Retiro aprobado y marcado como pagado.');
            fetchRequests();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al aprobar retiro');
        }
    };

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
            setMessage('Retiro rechazado y fondos devueltos.');
            setRejectingId(null);
            setRejectReason('');
            fetchRequests();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al rechazar retiro');
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    Gestión de Retiros
                </h2>
                <p className="text-gray-600">
                    Administra las solicitudes de retiro de fondos de los usuarios.
                </p>

                {message && (
                    <div className={`p-4 mt-4 rounded-lg border ${message.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🕒 Pendientes
                </button>
                <button
                    onClick={() => setActiveTab('paid')}
                    className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'paid' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ✅ Pagados
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'rejected' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ❌ Rechazados
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info Bancaria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado KYC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Cargando solicitudes...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay solicitudes {activeTab === 'pending' ? 'pendientes' : 'en esta sección'}.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(req.created_at).toLocaleDateString()}
                                            <div className="text-xs text-gray-400">
                                                {new Date(req.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{req.user_name}</div>
                                            <div className="text-sm text-gray-500">{req.user_email}</div>
                                            <div className="text-xs text-gray-400">ID: {req.user_doc || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-gray-900">
                                                ${req.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.payment_info}>
                                            {req.payment_info}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {req.user_kyc ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Verificado
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    No Verificado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {activeTab === 'pending' && (
                                                <div className="flex flex-col space-y-2">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm"
                                                    >
                                                        Aprobar Pago
                                                    </button>

                                                    {rejectingId === req.id ? (
                                                        <div className="mt-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Razón del rechazo..."
                                                                className="border p-1 rounded text-xs w-full mb-1"
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                            />
                                                            <div className="flex space-x-1">
                                                                <button onClick={() => handleReject(req.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">Confirmar</button>
                                                                <button onClick={() => setRejectingId(null)} className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs">Cancelar</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                                                            className="text-red-600 hover:text-red-900 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-md text-sm"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {activeTab === 'paid' && (
                                                <span className="text-gray-500">Procesado el {new Date(req.processed_at).toLocaleDateString()}</span>
                                            )}
                                            {activeTab === 'rejected' && (
                                                <div>
                                                    <span className="text-red-500 block">Rechazado</span>
                                                    <span className="text-xs text-gray-400">{req.rejection_reason}</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
