import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { motion, AnimatePresence } from 'framer-motion';

export default function Checkout() {
    const { cart, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Guest Info state
    const [guestInfo, setGuestInfo] = useState({
        name: "",
        email: "",
        phone: ""
    });

    // Shipping Info state
    const [shippingMethod, setShippingMethod] = useState("delivery"); // pickup, delivery
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingCity, setShippingCity] = useState("");

    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState("");

    // Pickup Points State
    const [pickupPoints, setPickupPoints] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState("");

    // Fetch Pickup Points
    useEffect(() => {
        const loadPoints = async () => {
            try {
                const res = await api.get('/api/pickup-points/');
                setPickupPoints(res.data);
            } catch (e) {
                console.error("Failed to load pickup points", e);
            }
        };
        loadPoints();
    }, []);

    const [error, setError] = useState("");
    const [token, setToken] = useState(localStorage.getItem("access_token"));
    const [userId, setUserId] = useState(localStorage.getItem("userId"));

    // Check auth on mount
    useEffect(() => {
        // If user is logged in, try to fetch their default address (Not implemented in this snippet but good practice)
    }, []);

    // Totals Calculation (Same as Cart)
    const subtotalCOP = cart.reduce((sum, p) => sum + (p.price_local || 0) * p.quantity, 0);
    const totalWeightGrams = cart.reduce((sum, p) => sum + (p.weight_grams || 500) * p.quantity, 0);

    let shippingCostCOP = 0;
    if (shippingMethod === "delivery") {
        if (subtotalCOP >= 397000) {
            shippingCostCOP = 0;
        } else {
            // Quantity-Based Shipping Cost
            // Base cost: $13,700 for the first product
            // Additional cost: $1,700 for each additional product
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

            if (totalItems > 0) {
                const baseRate = 13700;
                const additionalRate = 1700;
                shippingCostCOP = baseRate + ((totalItems - 1) * additionalRate);
            } else {
                shippingCostCOP = 0;
            }
        }
    }

    const totalCOP = subtotalCOP + shippingCostCOP;

    const handleCreateOrder = async () => {
        setError("");

        // Validate
        if (shippingMethod === "delivery" && (!shippingAddress || !shippingCity)) {
            setError("Por favor completa la dirección de envío y ciudad.");
            return;
        }

        if (shippingMethod === "pickup" && !selectedPointId) {
            setError("Por favor selecciona un Punto de Recogida.");
            return;
        }

        if (paymentMethod === "wallet" && !token) {
            // Enforce Login for Wallet
            setError("⚠️ Para pagar con Billetera Virtual debes iniciar sesión.");
            localStorage.setItem("returnTo", "/checkout");
            setTimeout(() => navigate("/login"), 1500);
            return;
        }

        // For manual/guest checkout, require basic info if not logged in
        if (!token && (!guestInfo.name || !guestInfo.phone)) {
            setError("Por favor ingresa tu nombre y teléfono para contactarte.");
            return;
        }

        setLoading(true);

        try {
            let finalAddress = "";
            if (shippingMethod === "delivery") {
                finalAddress = `${shippingAddress}, ${shippingCity}`;
            } else {
                const point = pickupPoints.find(p => p.id === parseInt(selectedPointId));
                finalAddress = `RECOGIDA EN: ${point.name} (${point.address}, ${point.city})`;
            }

            const payload = {
                payment_method: paymentMethod,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                })),
                shipping_address: finalAddress,
                guest_info: !token ? guestInfo : null
            };

            const res = await api.post("/api/orders/", payload);

            // Success
            clearCart();
            navigate(`/order-confirmation/${res.data.id}`);

        } catch (err) {
            console.error("Order creation error:", err);
            setError(err.response?.data?.detail || "Error al crear la orden.");
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
                <button
                    onClick={() => navigate("/dashboard/store")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
                >
                    Volver a la Tienda
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Forms */}
                <div className="md:col-span-2 space-y-6">

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Finalizar Compra</h1>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* 1. Guest Info (if not logged in) */}
                    {!token && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">👤 Tus Datos</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Celular / WhatsApp</label>
                                        <input
                                            type="text"
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                            value={guestInfo.phone}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                            placeholder="300 123 4567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                                        <input
                                            type="email"
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                            value={guestInfo.email}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-blue-600">
                                <span className="cursor-pointer hover:underline" onClick={() => navigate("/login", { state: { returnTo: "/checkout" } })}>
                                    ¿Ya tienes cuenta? Inicia sesión aquí
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 2. Shipping Method */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">🚚 Método de Entrega</h2>
                        <div className="flex gap-4 mb-4">
                            <label className={`flex-1 p-4 border rounded-lg cursor-pointer ${shippingMethod === "delivery" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input type="radio" value="delivery" checked={shippingMethod === "delivery"} onChange={() => setShippingMethod("delivery")} className="mr-2" />
                                <span className="font-bold">Domicilio</span>
                            </label>
                            <label className={`flex-1 p-4 border rounded-lg cursor-pointer ${shippingMethod === "pickup" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input type="radio" value="pickup" checked={shippingMethod === "pickup"} onChange={() => setShippingMethod("pickup")} className="mr-2" />
                                <span className="font-bold">Recogida</span>
                            </label>
                        </div>

                        {shippingMethod === "delivery" && (
                            <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Dirección de Entrega</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Calle 123 # 45-67"
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ciudad / Municipio</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Bogotá, Medellín..."
                                        value={shippingCity}
                                        onChange={(e) => setShippingCity(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {shippingMethod === "pickup" && (
                            <div className="animate-fadeIn mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona un Punto de Recogida</label>
                                {pickupPoints.length === 0 ? (
                                    <p className="text-gray-500 italic">No hay puntos de recogida disponibles.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {pickupPoints.map(point => (
                                            <label key={point.id} className={`block p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${selectedPointId == point.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                                                <div className="flex items-start">
                                                    <input
                                                        type="radio"
                                                        name="pickupPoint"
                                                        value={point.id}
                                                        checked={selectedPointId == point.id}
                                                        onChange={(e) => setSelectedPointId(e.target.value)}
                                                        className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div>
                                                        <span className="font-bold block text-gray-800">{point.name}</span>
                                                        <span className="text-sm text-gray-600 block">{point.address}, {point.city}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Payment Method Selection (Visual Only, Action happens on Order Confirm page usually, but here we select INTENT) 
                ACTUALLY: The user asked to SEE options. We can select method here, create order, 
                then OrderConfirmation handles the actual payment flow. 
            */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">💳 Medio de Pago</h2>
                        <p className="text-sm text-gray-500 mb-4">Selecciona cómo deseas pagar. El pago se realizará en el siguiente paso.</p>

                        <div className="grid grid-cols-1 gap-3">
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${paymentMethod === "wallet" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="wallet"
                                    checked={paymentMethod === "wallet"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600 mr-3"
                                />
                                <div className="flex-1">
                                    <span className="font-bold block">💰 Billetera Virtual (Saldo TEI)</span>
                                    <span className="text-xs text-gray-500">Requiere inicio de sesión y segunda clave.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${paymentMethod === "bank" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="bank"
                                    checked={paymentMethod === "bank"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600 mr-3"
                                />
                                <div className="flex-1">
                                    <span className="font-bold block">🏦 Transferencia Bancaria (Bancolombia)</span>
                                    <span className="text-xs text-gray-500">Envía comprobante por WhatsApp. No requiere cuenta inmediata.</span>
                                </div>
                            </label>

                            {/* Other mock options */}
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${paymentMethod === "binance" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="binance"
                                    checked={paymentMethod === "binance"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600 mr-3"
                                />
                                <div className="flex-1">
                                    <span className="font-bold block">🔶 Binance Pay / Cripto</span>
                                    <span className="text-xs text-gray-500">Paga con USDT/BTC. Escanea el QR.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${paymentMethod === "other" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="other"
                                    checked={paymentMethod === "other"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600 mr-3"
                                />
                                <div className="flex-1">
                                    <span className="font-bold block">📍 Otros (Efecty, Nequi, Pago en Oficina)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                </div>

                {/* Right Column: Summary */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen</h2>
                        <div className="space-y-3 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-bold">${subtotalCOP.toLocaleString()} COP</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Envío</span>
                                <span className="font-bold">{shippingCostCOP === 0 ? "Gratis" : `$${shippingCostCOP.toLocaleString()}`}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold text-green-600">
                                <span>Total</span>
                                <span>${totalCOP.toLocaleString()} COP</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateOrder}
                            disabled={loading || !paymentMethod}
                            className={`w-full py-3 rounded-lg font-bold text-white transition
                        ${loading || !paymentMethod ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 transform hover:scale-105 shadow-lg"}
                    `}
                        >
                            {loading ? "Procesando..." : "✅ Confirmar Pedido"}
                        </button>

                        {!paymentMethod && (
                            <p className="text-center text-xs text-red-500 mt-2">Selecciona un método de pago para continuar</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
