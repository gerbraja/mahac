import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Tu Carrito</h2>
      {cart.length === 0 ? (
        <p>No hay productos.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} — ${item.price.toFixed(2)} × {item.quantity}
                <button onClick={() => removeFromCart(item.id)}>❌</button>
              </li>
            ))}
          </ul>
          <h3>Total: ${total.toFixed(2)}</h3>
          <button onClick={clearCart}>Vaciar carrito</button>
        </>
      )}
    </div>
  );
}
