
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

const AdminKYC = () => {
    const { globalCountry } = useAdmin();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        fetchRecords();
    }, [globalCountry]);

    const fetchRecords = async () => {
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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Validaciones KYC & Cumplimiento</h1>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">País</th>
                                <th className="p-4">Documento</th>
                                <th className="p-4">PEP</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center">Cargando registros...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan="6" className="p-6 text-center">No hay registros de KYC aún.</td></tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">
                                            {record.user_name}
                                            <div className="text-xs text-gray-400">{record.user_email}</div>
                                        </td>
                                        <td className="p-4 flex items-center gap-2">
                                            {record.country === 'Colombia' ? '🇨🇴' :
                                                record.country === 'Panama' ? '🇵🇦' : '🇩🇴'}
                                            {record.country}
                                        </td>
                                        <td className="p-4">{record.user_document}</td>
                                        <td className="p-4">
                                            {record.is_pep ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">SI - PEP</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">NO</span>
                                            )}
                                        </td>
                                        <td className="p-4">{new Date(record.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition"
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">Detalle de Cumplimiento</h2>
                            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* User Info */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div><span className="text-xs font-bold text-gray-500 uppercase">Nombre</span><div className="font-medium">{selectedRecord.user_name}</div></div>
                                <div><span className="text-xs font-bold text-gray-500 uppercase">Documento</span><div className="font-medium">{selectedRecord.user_document}</div></div>
                                <div><span className="text-xs font-bold text-gray-500 uppercase">Email</span><div className="font-medium">{selectedRecord.user_email}</div></div>
                                <div><span className="text-xs font-bold text-gray-500 uppercase">País</span><div className="font-medium">{selectedRecord.country}</div></div>
                            </div>

                            {/* Compliance Flags */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">Información Declarada</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between border-b pb-1">
                                        <span>Facturador Electrónico:</span>
                                        <span className="font-medium">{selectedRecord.details.is_facturador ? "SI" : "NO"}</span>
                                    </li>
                                    <li className="flex justify-between border-b pb-1">
                                        <span>Declarante de Renta:</span>
                                        <span className="font-medium">{selectedRecord.details.is_declarante ? "SI" : "NO"}</span>
                                    </li>
                                    <li className="flex justify-between border-b pb-1">
                                        <span>Usa Criptomonedas:</span>
                                        <span className="font-medium">{selectedRecord.details.uses_crypto ? "SI" : "NO"}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* PEP Details if applicable */}
                            {selectedRecord.is_pep && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <h3 className="font-bold text-red-800 mb-2">⚠️ Alerta PEP</h3>
                                    <p className="text-sm">Cargo reportado: <strong>{selectedRecord.details.pep_details}</strong></p>
                                </div>
                            )}

                            {/* Documents Links */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-green-500 pl-2">Documentos Adjuntos</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <a href="#" className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 text-blue-600">
                                        📄 Ver RUT
                                    </a>
                                    <a href="#" className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 text-blue-600">
                                        📄 Ver Cédula
                                    </a>
                                    <a href="#" className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 text-blue-600">
                                        📄 Ver Cert. Bancaria
                                    </a>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Nota: Los enlaces de descarga se activarán al conectar Google Cloud Storage.</p>
                            </div>

                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKYC;
