import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useCart();

  const token = localStorage.getItem('access_token');

  return (
    <nav style={{ padding: "1rem", backgroundColor: "#0a0a23", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Link to="/" style={{ marginRight: "2rem", color: "white" }}>
          Inicio
        </Link>
        <Link to="/cart" style={{ color: "white" }}>
          🛒 Carrito ({cart.length})
        </Link>
      </div>
      <div>
        {token ? (
          <span style={{ color: "#4ade80", fontWeight: "bold" }}>
            👤 Sesión Activa ( Token: {token.substring(0, 5)}... )
          </span>
        ) : (
          <span style={{ color: "#f87171", fontWeight: "bold" }}>
            ⭕ Sin Sesión
          </span>
        )}
      </div>
    </nav>
  );
}
