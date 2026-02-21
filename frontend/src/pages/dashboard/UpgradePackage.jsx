import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const UpgradePackage = () => {
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/upgrade/options');
            setOptions(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching upgrade options", err);
            setError('No se pudieron cargar las opciones de avance.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (targetLevel, cost) => {
        if (!window.confirm(`¿Estás seguro de realizar el avance por $${cost.toLocaleString()} COP?`)) return;

        setProcessing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await api.post('/api/upgrade/purchase', {
                target_level: targetLevel,
                payment_method: 'wallet'
            });
            setSuccessMessage(`¡Felicidades! Has avanzado al Nivel ${res.data.new_level}.`);
            fetchOptions(); // Refresh options
        } catch (err) {
            console.error("Error purchasing upgrade", err);
            setError(err.response?.data?.detail || 'Error al procesar el avance. Verifica tu saldo.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-4">Cargando opciones...</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Avance de Paquete (Upgrade)</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {options.length === 0 ? (
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <p className="text-lg text-blue-800">Ya tienes el máximo nivel de paquete o no hay avances disponibles para ti.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {options.map((opt) => (
                        <div key={opt.target_level} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                                <h3 className="text-xl font-bold text-white">{opt.name}</h3>
                                <div className="text-purple-100 text-sm mt-1">Nivel Actual: {opt.current_level} → Nivel {opt.target_level}</div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">Costo del Avance:</span>
                                    <span className="text-2xl font-bold text-gray-800">${opt.cost_cop.toLocaleString()} COP</span>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-600">Puntos Adicionales:</span>
                                    <span className="text-lg font-semibold text-green-600">+{opt.pv_difference} PV</span>
                                </div>

                                <button
                                    onClick={() => handlePurchase(opt.target_level, opt.cost_cop)}
                                    disabled={processing}
                                    className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md transition-colors ${processing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                >
                                    {processing ? 'Procesando...' : 'Pagar con Billetera (Saldo)'}
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-3">
                                    Se descontará el valor de tu saldo disponible.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-2">¿Cómo funciona?</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Solo pagas la diferencia entre tu paquete actual y el nuevo.</li>
                    <li>Recibirás los productos correspondientes al nuevo nivel.</li>
                    <li>Se generará una orden de envío automáticamente.</li>
                    <li>Las comisiones (PV) se calculan sobre la diferencia de puntos.</li>
                </ul>
            </div>
        </div>
    );
};

export default UpgradePackage;
