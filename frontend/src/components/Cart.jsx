import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Shipping options
  const [shippingMethod, setShippingMethod] = useState("pickup"); // "pickup" or "delivery"
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");

  // Discount code
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);

  // Calculate totals
  const totalPV = cart.reduce((sum, p) => sum + (p.pv || 0) * p.quantity, 0);

  // Calculate total weight in grams
  const totalWeightGrams = cart.reduce((sum, p) => sum + (p.weight_grams || 500) * p.quantity, 0);

  // Calculate subtotal in COP using fixed local prices
  const subtotalCOP = cart.reduce((sum, p) => sum + (p.price_local || 0) * p.quantity, 0);

  // Calculate Shipping Cost (Weight Based)
  // Base cost: $15,000 COP for first 500g
  // Additional cost: $5,000 COP for each additional 500g
  let shippingCostCOP = 0;

  if (subtotalCOP >= 397000) {
    shippingCostCOP = 0; // Free shipping for orders over $397,000 COP
  } else {
    const baseRate = 15000;
    const additionalRate = 5000;

    if (totalWeightGrams <= 500) {
      shippingCostCOP = baseRate;
    } else {
      const additionalWeight = totalWeightGrams - 500;
      const additionalUnits = Math.ceil(additionalWeight / 500);
      shippingCostCOP = baseRate + (additionalUnits * additionalRate);
    }
  }

  // Convert shipping cost to USD (removed as we only use COP)
  // const shippingCostUSD = shippingCostCOP / 4000;

  const discountAmount = discountApplied ? (subtotalCOP * discountApplied.percentage / 100) : 0;

  // Final total
  const totalCOP = subtotalCOP + shippingCostCOP - discountAmount;

  const handleApplyDiscount = () => {
    // Simulate discount validation
    if (discountCode.toUpperCase() === "BIENVENIDO10") {
      setDiscountApplied({ code: "BIENVENIDO10", percentage: 10 });
      setMessage("✅ Código de descuento aplicado: 10% de descuento");
    } else if (discountCode.toUpperCase() === "PROMO20") {
      setDiscountApplied({ code: "PROMO20", percentage: 20 });
      setMessage("✅ Código de descuento aplicado: 20% de descuento");
    } else {
      setMessage("❌ Código de descuento inválido");
      setDiscountApplied(null);
    }
  };

  const navigate = useNavigate();

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("⚠️ Debes iniciar sesión para completar la compra.");
      setTimeout(() => navigate('/login', { state: { view: 'login' } }), 2000);
      return;
    }

    if (shippingMethod === "delivery" && (!shippingAddress || !shippingCity)) {
      setMessage("❌ Por favor completa la dirección de envío");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const payload = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        shipping_address: shippingMethod === "delivery"
          ? `${shippingAddress}, ${shippingCity}`
          : "Recogida en punto de entrega"
      };

      const res = await api.post("/api/orders/", payload);
      // Success - Redirect to confirmation
      clearCart();
      setDiscountApplied(null);
      setDiscountCode("");
      navigate(`/order-confirmation/${res.data.id}`);

    } catch (error) {
      console.error("Checkout error:", error);
      if (error.response && error.response.status === 401) {
        setMessage("⚠️ Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        setTimeout(() => navigate('/login', { state: { view: 'login' } }), 2000);
      } else {
        setMessage("❌ Error al crear la orden. Por favor intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos desde la tienda para continuar</p>
          <a href="/dashboard/store" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            Ir a la Tienda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🛒 Carrito de Compras</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Productos</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-3xl"
                        style={{ display: item.image_url ? 'none' : 'block' }}
                      >
                        {item.is_activation ? '💎' : '📦'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description?.substring(0, 60)}...</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-green-600 font-bold text-base">${item.price_local?.toLocaleString()} COP</span>
                        <span className="text-gray-500">PV: {item.pv}</span>
                        <span className="text-gray-500">Cantidad: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">${(item.price_local * item.quantity).toLocaleString()} COP</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Options */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🚚 Método de Entrega</h2>

              {subtotalCOP >= 397000 && shippingMethod === "delivery" && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
                  🎉 ¡Envío GRATIS! Tu pedido supera los $397,000 COP
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  style={{ borderColor: shippingMethod === "pickup" ? "#3b82f6" : "#e5e7eb" }}>
                  <input
                    type="radio"
                    name="shipping"
                    value="pickup"
                    checked={shippingMethod === "pickup"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">📍 Recogida en Punto de Entrega</p>
                    <p className="text-sm text-gray-600">Gratis - Recoge tu pedido en el punto más cercano</p>
                  </div>
                  <span className="font-bold text-green-600">GRATIS</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  style={{ borderColor: shippingMethod === "delivery" ? "#3b82f6" : "#e5e7eb" }}>
                  <input
                    type="radio"
                    name="shipping"
                    value="delivery"
                    checked={shippingMethod === "delivery"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">🏠 Envío a Domicilio</p>
                    <p className="text-sm text-gray-600">
                      {subtotalCOP >= 397000 ? "GRATIS - Tu pedido califica para envío gratis" : "Recibe tu pedido en la puerta de tu casa"}
                    </p>
                  </div>
                  <span className={`font-bold ${subtotalCOP >= 397000 ? 'text-green-600' : 'text-blue-600'}`}>
                    {subtotalCOP >= 397000 ? 'GRATIS' : `$${shippingCostCOP.toLocaleString()} COP`}
                  </span>
                </label>
              </div>

              {shippingMethod === "delivery" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Calle, número, apartamento..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="Tu ciudad"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen del Pedido</h2>

              {/* Discount Code */}
              <div className="mb-4 pb-4 border-b">
                <label className="block text-sm font-medium text-gray-700 mb-2">Código de Descuento</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 font-medium"
                  >
                    Aplicar
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-sm text-green-600 mt-2">✅ {discountApplied.code} aplicado ({discountApplied.percentage}% desc.)</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cart.length} productos)</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${subtotalCOP.toLocaleString()} COP</div>
                  </div>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Envío</span>
                  <span>{shippingCostCOP === 0 ? 'GRATIS' : `$${shippingCostCOP.toLocaleString()} COP`}</span>
                </div>

                {discountApplied && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Descuento ({discountApplied.percentage}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Puntos Totales (PV)</span>
                  <span>💎 {totalPV}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-2xl font-bold text-green-600 mb-2">
                  <span>Total a Pagar</span>
                  <span>${totalCOP.toLocaleString()} COP</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {loading ? '⏳ Procesando...' : '✅ Proceder al Pago'}
              </button>

              <button
                onClick={clearCart}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                🗑️ Vaciar Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
