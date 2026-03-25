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

  const addToCart = (product, selectedOptionsStr = null) => {
    const unique_cart_id = product.id + '_' + (selectedOptionsStr || '');
    const newCart = (() => {
      const exists = cart.find((p) => p.unique_cart_id === unique_cart_id || (!p.unique_cart_id && p.id === product.id));
      if (exists) {
        return cart.map((p) =>
          (p.unique_cart_id === unique_cart_id || (!p.unique_cart_id && p.id === product.id))
             ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...cart, { ...product, quantity: 1, selected_options: selectedOptionsStr, unique_cart_id }];
    })();
    updateCart(newCart);
  };

  const removeFromCart = (unique_cart_id_or_id) => {
    const newCart = cart.filter((p) => 
      p.unique_cart_id ? p.unique_cart_id !== unique_cart_id_or_id : p.id !== unique_cart_id_or_id
    );
    updateCart(newCart);
  };

  const updateItemOptions = (unique_cart_id_or_id, newSelectedOptionsStr) => {
    // 1. Find the item we want to modify
    const itemToUpdate = cart.find(p => p.unique_cart_id ? p.unique_cart_id === unique_cart_id_or_id : p.id === unique_cart_id_or_id);
    if (!itemToUpdate) return;
    
    // 2. Build the new identifier
    const new_unique_id = itemToUpdate.id + '_' + (newSelectedOptionsStr || '');
    
    // 3. Check if an item with this new identifier already exists
    const itemAlreadyExists = cart.find(p => p.unique_cart_id === new_unique_id && p !== itemToUpdate);
    
    let newCart = [];
    
    if (itemAlreadyExists) {
      // Merge into the existing item and remove the old one
      newCart = cart.map(p => {
        if (p.unique_cart_id === new_unique_id) {
          return { ...p, quantity: p.quantity + itemToUpdate.quantity };
        }
        return p;
      }).filter(p => p !== itemToUpdate);
    } else {
      // Just update the item in place
      newCart = cart.map((p) => {
        if (p === itemToUpdate) {
          return { ...p, selected_options: newSelectedOptionsStr, unique_cart_id: new_unique_id };
        }
        return p;
      });
    }
    
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateItemOptions, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
