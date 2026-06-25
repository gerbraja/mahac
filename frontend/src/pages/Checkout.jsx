import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { motion, AnimatePresence } from 'framer-motion';
import { Country, State, City } from 'country-state-city';
import { COLOMBIA_DIVIPOLA_COMPLETO } from '../data/colombiaDivipolaCompleto';

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
    const [selectedCountryCode, setSelectedCountryCode] = useState("CO");
    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [shippingDivipola, setShippingDivipola] = useState("");

    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState("");

    // Pickup Points State
    const [pickupPoints, setPickupPoints] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState("");

    // Dynamic Shipping State
    const [shippingDetails, setShippingDetails] = useState({
        costo_flete_real: 0,
        costo_cobrado_cliente: 0,
        subsidio_aplicado: 0,
        base_iva: 0,
        iva_flete: 0,
        mensaje: ''
    });
    const [fetchingShipping, setFetchingShipping] = useState(false);

    // Fetch Pickup Points
    useEffect(() => {
        const loadPoints = async () => {
            try {
                const res = await api.get('/api/pickup-points/?active_only=false');
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

    // Call dynamic shipping API
    useEffect(() => {
        const fetchShipping = async () => {
            if (cart.length === 0) return;
            setFetchingShipping(true);
            try {
                // If it's pickup but no point selected yet, wait.
                if (shippingMethod === "pickup" && !selectedPointId) {
                    setShippingDetails({ costo_flete_real: 0, costo_cobrado_cliente: 0, subsidio_aplicado: 0, base_iva: 0, iva_flete: 0, mensaje: 'Selecciona un punto de recogida.' });
                    setFetchingShipping(false);
                    return;
                }
                
                // Try to infer divipola, backend defaults to NACIONAL if empty
                let pseudoDivipola = "";
                let cityToTest = shippingCity;

                if (shippingMethod === "pickup" && selectedPointId) {
                    const point = pickupPoints.find(p => p.id === parseInt(selectedPointId));
                    if (point) cityToTest = point.city;
                } else if (shippingMethod === "delivery" && shippingDivipola) {
                    pseudoDivipola = shippingDivipola;
                }

                if (!pseudoDivipola) {
                    if (cityToTest.toLowerCase().includes("medellín") || cityToTest.toLowerCase().includes("medellin")) {
                        pseudoDivipola = "05001";
                    } else if (cityToTest.length >= 3) {
                        pseudoDivipola = "00000"; 
                    }
                }

                const reqData = {
                    divipola_destino: pseudoDivipola,
                    shipping_method: shippingMethod,
                    items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
                };

                const res = await api.post("/api/shipping/calculate", reqData);
                setShippingDetails(res.data);
            } catch (error) {
            console.error("Error calculating shipping", error);
            const detail = error.response?.data?.detail || 'Error al cotizar envío.';
            setShippingDetails({ ...shippingDetails, costo_flete_real: 0, costo_cobrado_cliente: null, mensaje: detail });
        } finally {
                setFetchingShipping(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (shippingMethod === 'pickup' && selectedPointId) {
                fetchShipping();
            } else if (shippingMethod === 'delivery' && shippingCity) {
                fetchShipping();
            } else {
                setShippingDetails({ costo_flete_real: 0, costo_cobrado_cliente: null, subsidio_aplicado: 0, base_iva: 0, iva_flete: 0, mensaje: 'Ingresa una ciudad o punto para cotizar.' });
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [shippingMethod, shippingCity, selectedPointId, cart, shippingDivipola]);

    const totalCOP = subtotalCOP + (shippingDetails.costo_cobrado_cliente || 0);

    const hasSubsidizedItems = cart.some(item => item.shipping_class === 'subsidized' || item.product?.shipping_class === 'subsidized');
    const hasFreeItems = cart.some(item => item.shipping_class === 'free' || item.product?.shipping_class === 'free');

    const handleCreateOrder = async () => {
        setError("");

        // Validate
        if (shippingMethod === "delivery" && (!shippingAddress || !shippingCity || !shippingDivipola || !selectedStateCode)) {
            setError("Por favor completa todos los campos de la dirección de envío (incluyendo Provincia, Ciudad y DIVIPOLA).");
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
                shipping_type: shippingMethod, // delivery or pickup
                guest_info: !token ? guestInfo : null,
                // Add detailed shipping fields for backend
                shipping_cost_base: shippingDetails.base_iva || 0,
                shipping_tax_amount: shippingDetails.iva_flete || 0,
                pickup_point_id: shippingMethod === "pickup" ? parseInt(selectedPointId) : null
            };

            const res = await api.post("/api/orders/", payload);

            // Success
            clearCart();
            navigate(`/order-confirmation/${res.data.id}`);

        } catch (err) {
            console.error("Order creation error:", err);
            const detail = err.response?.data?.detail;
            if (detail) {
                if (typeof detail === 'string') {
                    setError(detail);
                } else {
                    setError(JSON.stringify(detail));
                }
            } else {
                setError("Error al crear la orden. Por favor intenta de nuevo o contacta soporte.");
            }
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
                                    <label className="block text-sm font-medium text-gray-700">Dirección Completa *</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Calle, número, apartamento, etc."
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Provincia/Estado *</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                            value={selectedStateCode}
                                            onChange={(e) => {
                                                setSelectedStateCode(e.target.value);
                                                setShippingCity("");
                                                setShippingDivipola("");
                                            }}
                                        >
                                            <option value="">Selecciona...</option>
                                            {State.getStatesOfCountry(selectedCountryCode).map((state) => (
                                                <option key={state.isoCode} value={state.isoCode}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ciudad *</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                            value={shippingCity}
                                            onChange={(e) => {
                                                const cityName = e.target.value;
                                                setShippingCity(cityName);
                                                if (selectedCountryCode === 'CO' && cityName) {
                                                    const divipolaCode = COLOMBIA_DIVIPOLA_COMPLETO[selectedStateCode]?.[cityName];
                                                    if (divipolaCode) setShippingDivipola(divipolaCode);
                                                }
                                            }}
                                            disabled={!selectedStateCode}
                                        >
                                            <option value="">Selecciona...</option>
                                            {City.getCitiesOfState(selectedCountryCode, selectedStateCode).map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Código DIVIPOLA *</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Ej: 05001"
                                            value={shippingDivipola}
                                            onChange={(e) => setShippingDivipola(e.target.value)}
                                            maxLength={5}
                                            pattern="^[0-9]{5}$"
                                            title="El código DIVIPOLA debe tener exactamente 5 dígitos"
                                        />
                                    </div>
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
                                    <span className="text-xs text-gray-500">Envía comprobante al correo: ventas@tuempresainternacional.com. No requiere cuenta inmediata.</span>
                                </div>
                            </label>

                            {/* Option breb commented out to simplify options
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${paymentMethod === "breb" ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="breb"
                                    checked={paymentMethod === "breb"}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-purple-600 mr-3"
                                />
                                <div className="flex-1">
                                    <span className="font-bold block">📲 Bre-B / Pago Rápido (QR)</span>
                                    <span className="text-xs text-gray-500">Paga al instante sin comisiones desde la App de tu banco escaneando nuestro QR o llave Bre-B.</span>
                                </div>
                            </label>
                            */}

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
                                    <span className="text-xs text-gray-500">Paga con USDT/BTC. Envía comprobante al correo: ventas@tuempresainternacional.com.</span>
                                </div>
                            </label>

                            {/* Option other commented out to simplify options
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
                            */}
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
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    Flete {shippingMethod === 'pickup' ? '(Recogida 50% Dto)' : ''}
                                </span>
                                <span className="font-bold">
                                    {fetchingShipping ? "Calculando..." : 
                                    (shippingDetails.costo_cobrado_cliente === null ? "Por calcular" : 
                                     (shippingDetails.costo_cobrado_cliente === 0 ? "¡Gratis!" : `$${shippingDetails.costo_cobrado_cliente.toLocaleString()} COP`))
                                    }
                                </span>
                            </div>
                            {shippingDetails.subsidio_aplicado > 0 && (
                                <div className="flex justify-between text-xs text-blue-600">
                                    <span>Subsidio Flete Aplicado</span>
                                    <span className="font-bold">- ${shippingDetails.subsidio_aplicado.toLocaleString()} COP</span>
                                </div>
                            )}

                            
                            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold text-green-600">
                                <span>Total</span>
                                <span>${totalCOP.toLocaleString()} COP</span>
                            </div>
                        </div>

                        {shippingDetails.mensaje && (
                            <p className="text-xs text-center text-blue-500 mb-3 font-semibold">{shippingDetails.mensaje}</p>
                        )}
                        
                        {(hasSubsidizedItems || subtotalCOP >= 490000) && !hasFreeItems && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded mb-4">
                                ℹ️ <b>Aviso:</b> El beneficio de envío gratis asociado a tu pedido cubre el flete <b>únicamente hasta por un valor máximo de $17.700</b>. Cualquier excedente calculado por la transportadora se reflejará en el total a pagar.
                            </div>
                        )}

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
