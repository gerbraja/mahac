import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize from localStorage if available
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load cart", e);
      return [];
    }
  });

  // Helper to sync with localStorage
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart_items', JSON.stringify(newCart));
  };

  const addToCart = (product) => {
    const newCart = (() => {
      const exists = cart.find((p) => p.id === product.id);
      if (exists) {
        return cart.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...cart, { ...product, quantity: 1 }];
    })();
    updateCart(newCart);
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter((p) => p.id !== id);
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
