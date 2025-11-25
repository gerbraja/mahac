import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "1rem",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <h3>{product.name}</h3>
      <div style={{ margin: "0.5rem 0" }}>
        <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
          ${product.price_usd?.toFixed(2)} USD
        </p>
        <p style={{ fontSize: "0.8rem", color: "#666" }}>
          ≈ ${(product.price_usd * 4500).toLocaleString()} COP
        </p>
        <p style={{ color: "#2563eb", fontWeight: "bold", marginTop: "0.25rem" }}>
          💎 {product.pv} PV
        </p>
      </div>
      <button onClick={() => addToCart(product)}>Agregar al carrito</button>
    </div>
  );
}
