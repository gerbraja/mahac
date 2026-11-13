
import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useParams, useNavigate } from 'react-router-dom';

const StoreCheckout = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    
    const [cart, setCart] = useState([]);
    const [store, setStore] = useState(null);
    const [orderInfo, setOrderInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Confirm, 2: Success
    const [paymentMode, setPaymentMode] = useState('');

    useEffect(() => {
        const savedCart = sessionStorage.getItem(`cart_${slug}`);
        if (savedCart) setCart(JSON.parse(savedCart));
        
        api.get(`/api/stores/${slug}`).then(res => setStore(res.data)).catch(console.error);
        api.get('/auth/me').then(res => setUser(res.data)).catch(() => navigate('/login'));
    }, [slug, navigate]);

    const handleCreateOrder = async (mode) => {
        setLoading(true);
        try {
            const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
            const res = await api.post(`/api/stores/${slug}/checkout`, { 
                items,
                payment_mode: mode 
            });
            setPaymentMode(mode);
            setOrderInfo(res.data);
            setStep(2);
            sessionStorage.removeItem(`cart_${slug}`);
        } catch (error) {
            alert(`Error al procesar: ${error.response?.data?.detail}`);
        } finally {
            setLoading(false);
        }
    };

    if (!store || !user) return <div className="min-h-screen pt-24 text-center">Cargando...</div>;

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = 15000; // Fixed for now
    const finalTotal = cartTotal + shippingCost;
    const finalTotalUSD = finalTotal / 4500.0;
    
    const hasEnoughBalance = user.available_balance >= finalTotalUSD;

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gray-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black text-white">Finalizar Compra</h1>
                        <p className="text-gray-300 mt-2">en {store.name}</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Stepper */}
                    <div className="flex justify-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                            <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                            <div className={`w-16 h-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>✓</div>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen del Pedido</h2>
                            <div className="space-y-4 mb-8">
                                {cart.map(item => (
                                    <div key={item.product_id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-gray-500">{item.quantity}x</span>
                                            <span className="font-semibold text-gray-800">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2 text-green-600 font-bold border-t border-gray-100 mt-4 pt-4">
                                    <span>Envío Nacional Estimado:</span>
                                    <span>$15,000 COP</span>
                                </div>
                                <div className="flex justify-between items-center py-4 text-2xl font-black text-gray-900 border-t-2 border-gray-900 border-dashed">
                                    <span>Total a Pagar:</span>
                                    <span>${finalTotal.toLocaleString()} COP</span>
                                </div>
                            </div>
                            
                            {hasEnoughBalance ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
                                    <p className="text-green-800 font-bold mb-2">¡Tienes saldo TEI suficiente!</p>
                                    <p className="text-sm text-green-700 mb-4">Tu compra estará 100% asegurada en Custodia TEI hasta que recibas el producto.</p>
                                    <button 
                                        onClick={() => handleCreateOrder('escrow')}
                                        disabled={loading || cart.length === 0}
                                        className="w-full py-4 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Procesando...' : 'Pagar Seguro con Billetera TEI'}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6 text-center">
                                    <p className="text-orange-800 font-bold mb-2">Pago Contra Entrega / Acuerdo Directo</p>
                                    <p className="text-sm text-orange-700 mb-4">Pagarás el producto directamente al vendedor (en efectivo al recibir o por transferencia). Puede que el vendedor exija una garantía de envío.</p>
                                    <button 
                                        onClick={() => handleCreateOrder('direct_cod')}
                                        disabled={loading || cart.length === 0}
                                        className="w-full py-4 bg-orange-500 text-white font-bold text-xl rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Generando Orden...' : 'Acordar Pago con el Comercio'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && orderInfo && (
                        <div className="animate-fadeIn text-center py-10">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                                ✓
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4">¡Orden Generada!</h2>
                            
                            {paymentMode === 'escrow' ? (
                                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                                    Tu pago de <strong>${finalTotal.toLocaleString()} COP</strong> ha sido retenido de manera segura en tu Billetera TEI. El vendedor despachará pronto.
                                </p>
                            ) : (
                                <div className="text-left bg-orange-50 border border-orange-200 p-6 rounded-2xl mb-8 max-w-md mx-auto">
                                    <h3 className="font-black text-orange-900 mb-4 text-center">Instrucciones del Comercio</h3>
                                    <p className="text-gray-700 mb-4">Comunícate con el vendedor para acordar el pago del envío y confirmar tu dirección:</p>
                                    <p className="font-bold text-lg text-gray-900 mb-2">📞 Teléfono: {store.customer_service_phone || store.phone || "No registrado"}</p>
                                    {store.payment_instructions && (
                                        <div className="mt-4 pt-4 border-t border-orange-200 text-sm whitespace-pre-wrap">
                                            {store.payment_instructions}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-blue-600 transition-colors"
                            >
                                Ir a Mis Pedidos
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoreCheckout;
