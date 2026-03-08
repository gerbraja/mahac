import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useAdmin } from '../../context/AdminContext';

export default function AdminTaxes() {
    const [loading, setLoading] = useState(true);
    const { globalCountry } = useAdmin();
    const [taxData, setTaxData] = useState([]);

    useEffect(() => {
        const fetchTaxes = async () => {
            setLoading(true);
            try {
                // Fetch the taxes from the backend
                const response = await api.get('/admin/reports/taxes');
                const allTaxes = response.data || [];

                // Filter locally by country based on dropdown
                if (globalCountry === 'Todos') {
                    setTaxData(allTaxes);
                } else {
                    setTaxData(allTaxes.filter(t => t.pais === globalCountry));
                }
            } catch (error) {
                console.error("Error fetching taxes data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTaxes();
    }, [globalCountry]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const formatCOP = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    const totalIVA = taxData.reduce((acc, curr) => acc + curr.ivaPagar, 0);
    const totalRetenciones = taxData.reduce((acc, curr) => acc + curr.retencionPagar, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🧾 Obligaciones Fiscales: <span className="text-red-700">{globalCountry === 'Todos' ? 'Global' : globalCountry}</span></h1>
                    <p className="text-gray-500 text-sm">Control consolidado de IVA y Retenciones por país operativo</p>
                </div>
                <div className="flex space-x-3">
                    <div className="bg-red-50 px-4 py-2 border border-red-200 rounded-lg text-right">
                        <span className="text-xs text-red-500 font-bold uppercase block">Total IVA a Pagar</span>
                        <span className="text-lg text-red-700 font-bold">{formatCOP(totalIVA)}</span>
                    </div>
                    <div className="bg-orange-50 px-4 py-2 border border-orange-200 rounded-lg text-right">
                        <span className="text-xs text-orange-500 font-bold uppercase block">Total Retenciones</span>
                        <span className="text-lg text-orange-700 font-bold">{formatCOP(totalRetenciones)}</span>
                    </div>
                </div>
            </div>

            {/* Tabla Financiera */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos (Base)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa IVA</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase tracking-wider">IVA Liquidado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Ret.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider">Retención Líquida</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Fiscal</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {taxData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">📍 {row.pais}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatCOP(row.ventas)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.tasaIva}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">{formatCOP(row.ivaPagar)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.reteFuente}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-orange-600">{formatCOP(row.retencionPagar)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${row.estado === 'Pagado' ? 'bg-green-100 text-green-800' :
                                                row.estado === 'En revisión' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {row.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
