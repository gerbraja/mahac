import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useCart();

  return (
    <nav style={{ padding: "1rem", backgroundColor: "#0a0a23", color: "white" }}>
      <Link to="/" style={{ marginRight: "2rem", color: "white" }}>
        Inicio
      </Link>
      <Link to="/cart" style={{ color: "white" }}>
        🛒 Carrito ({cart.length})
      </Link>
    </nav>
  );
}
