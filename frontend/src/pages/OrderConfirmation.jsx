import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/api';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('wallet');

    // Wallet Modal State
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [secondPassword, setSecondPassword] = useState("");
    const [walletError, setWalletError] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/api/orders/${orderId}`);
                setOrder(res.data);
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) return <div className="p-8 text-center">Cargando detalles del pedido...</div>;
    if (!order) return <div className="p-8 text-center text-red-600">Pedido no encontrado.</div>;

    // Format Order Number: YYYYMMDDHHmm + 00001 (using ID)
    const dateObj = new Date(order.created_at);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const sequence = String(order.id).padStart(5, '0');
    const formattedOrderNumber = `${yyyy}${mm}${dd}${hh}${min}${sequence}`;

    const handleConfirmPayment = () => {
        if (paymentMethod === 'wallet') {
            setShowWalletModal(true);
        } else if (paymentMethod === 'bank') {
            alert("Por favor envía el comprobante por WhatsApp para confirmar tu pago.");
        } else {
            // For other methods, we might redirect or show a success message for now
            alert(`Redirigiendo a pasarela de pago para ${paymentMethod}...`);
        }
    };

    const processWalletPayment = async () => {
        if (!secondPassword) {
            setWalletError("Por favor ingresa tu contraseña de seguridad.");
            return;
        }

        setProcessingPayment(true);
        setWalletError("");

        try {
            // Simulate API call to verify second password and process payment
            // await api.post('/api/wallet/pay', { orderId, secondPassword });

            await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay

            // Mock success
            alert("✅ Pago realizado con éxito desde tu Billetera Virtual!");
            setShowWalletModal(false);
            // Update order status locally or refetch
            setOrder(prev => ({ ...prev, status: 'paid' }));

        } catch (error) {
            console.error("Payment error:", error);
            setWalletError("Contraseña incorrecta o saldo insuficiente.");
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 relative">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-blue-900 text-white p-6 text-center">
                    <h1 className="text-3xl font-bold uppercase tracking-wide">Confirmación del Pedido</h1>
                </div>

                <div className="p-8">
                    {/* Order Details Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Datos de Pedido</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Número de Pedido</p>
                                <p className="text-lg font-mono font-bold text-blue-900">{formattedOrderNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Fecha</p>
                                <p className="text-lg font-medium text-gray-800">{dateObj.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Dirección de Entrega</p>
                                <p className="text-lg font-medium text-gray-800">{order.shipping_address || 'Recogida en Oficina'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Estado</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Importe del Pedido</span>
                                <span className="font-bold text-gray-800">${order.total_cop?.toLocaleString()} COP</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-blue-600">Puntos Totales (P.V)</span>
                                <span className="font-bold text-blue-600">{order.total_pv} PV</span>
                            </div>
                            <div className="border-t border-gray-300 my-2 pt-2 flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">Total a Pagar</span>
                                <span className="text-xl font-bold text-green-600">${order.total_cop?.toLocaleString()} COP</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Section */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Pagar Con</h2>

                        <div className="space-y-4">
                            {/* Wallet Option */}
                            <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="wallet"
                                    checked={paymentMethod === 'wallet'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mt-1 w-5 h-5 text-blue-600"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💰</span>
                                        <span className="font-bold text-gray-800">Billetera Virtual</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Pagar usando el saldo disponible en tu oficina virtual.</p>
                                </div>
                            </label>

                            {/* Bank Transfer Option */}
                            <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="bank"
                                    checked={paymentMethod === 'bank'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mt-1 w-5 h-5 text-blue-600"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🏦</span>
                                        <span className="font-bold text-gray-800">Transferencia Bancaria</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                        <p><strong>Banco:</strong> Bancolombia</p>
                                        <p><strong>Tipo:</strong> Cuenta de Ahorros</p>
                                        <p><strong>Número:</strong> 10083093825</p>
                                        <p><strong>Titular:</strong> Tu Empresa Internacional S.A.S</p>
                                        <p><strong>NIT:</strong> 000000</p>
                                        <p className="mt-2 text-xs text-blue-600 font-bold">⚠️ Debes enviar el comprobante por WhatsApp para confirmar tu pedido.</p>
                                    </div>
                                </div>
                            </label>

                            {/* Other Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {['Pagar en Oficina', 'PSE', 'Nequi', 'Efecty'].map((method) => (
                                    <label key={method} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === method ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method}
                                            checked={paymentMethod === method}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="font-medium text-gray-700">{method}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Dynamic Forms for Other Methods */}
                            {(paymentMethod === 'PSE' || paymentMethod === 'Nequi' || paymentMethod === 'Efecty') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2"
                                >
                                    <h3 className="font-bold text-gray-800 mb-3">Datos para {paymentMethod}</h3>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Nombre Completo" className="w-full p-2 border rounded" />
                                        <input type="text" placeholder="Documento de Identidad" className="w-full p-2 border rounded" />
                                        {paymentMethod === 'PSE' && (
                                            <select className="w-full p-2 border rounded">
                                                <option>Selecciona tu Banco</option>
                                                <option>Bancolombia</option>
                                                <option>Davivienda</option>
                                                <option>Banco de Bogotá</option>
                                            </select>
                                        )}
                                        {paymentMethod === 'Nequi' && (
                                            <input type="tel" placeholder="Número de Celular Nequi" className="w-full p-2 border rounded" />
                                        )}
                                        <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                                            Continuar con {paymentMethod}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        {/* Hide main button if a specific form is shown above */}
                        {!['PSE', 'Nequi', 'Efecty'].includes(paymentMethod) && (
                            <button
                                onClick={handleConfirmPayment}
                                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-shadow shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>✅ Confirmar Pago</span>
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/dashboard/store')}
                            className="w-full mt-4 text-blue-600 font-medium hover:underline"
                        >
                            Volver a la Tienda
                        </button>
                    </div>
                </div>
            </div>

            {/* Wallet Payment Modal */}
            <AnimatePresence>
                {showWalletModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">🔐</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Seguridad de Billetera</h2>
                                <p className="text-gray-600 mt-2">Para confirmar el pago, por favor ingresa tu contraseña de seguridad (segundo nivel).</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña de Dos Niveles</label>
                                <input
                                    type="password"
                                    value={secondPassword}
                                    onChange={(e) => setSecondPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg tracking-widest"
                                    placeholder="••••••••"
                                />
                                {walletError && <p className="text-red-500 text-sm mt-2 text-center">{walletError}</p>}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowWalletModal(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={processWalletPayment}
                                    disabled={processingPayment}
                                    className={`flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors ${processingPayment ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {processingPayment ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderConfirmation;
