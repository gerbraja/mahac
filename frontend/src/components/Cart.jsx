import { useCart } from "../context/CartContext";
import { useState } from "react";
import axios from "axios";

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalUSD = cart.reduce((sum, p) => sum + (p.price_usd || 0) * p.quantity, 0);
  const totalCOP = totalUSD * 4500;
  const totalPV = cart.reduce((sum, p) => sum + (p.pv || 0) * p.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const payload = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        shipping_address: "Default Address" // Placeholder
      };

      const res = await axios.post("http://localhost:8000/api/orders/", payload, config);
      setMessage(`Order #${res.data.id} created successfully!`);
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      setMessage("Error creating order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🛒 Tu Carrito</h2>
      {message && <p style={{ padding: "1rem", backgroundColor: "#e0f2fe", borderRadius: "4px" }}>{message}</p>}

      {cart.length === 0 ? (
        <p>No hay productos en el carrito.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {cart.map((item) => (
              <li key={item.id} style={{ borderBottom: "1px solid #eee", padding: "1rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>
                    ${item.price_usd?.toFixed(2)} USD x {item.quantity}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    PV: {item.pv} | Total PV: {item.pv * item.quantity}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "2rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px" }}>
            <h3>Resumen del Pedido</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Total USD:</span>
              <strong>${totalUSD.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#666" }}>
              <span>Total COP (Estimado):</span>
              <span>${totalCOP.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "#2563eb", fontWeight: "bold" }}>
              <span>Total Puntos (PV):</span>
              <span>💎 {totalPV}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                width: "100%",
                padding: "1rem",
                background: loading ? "#9ca3af" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1.1rem",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Procesando..." : "Finalizar Compra"}
            </button>

            <button
              onClick={clearCart}
              style={{ marginTop: "1rem", background: "transparent", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}
            >
              Vaciar carrito
            </button>
          </div>
        </>
      )}
    </div>
  );
}
