// Frontend cart service (simple fetch wrappers)
const API_URL = "http://127.0.0.1:8000/cart";

export const getCart = async (token) => {
  const res = await fetch(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Error loading cart");
  return res.json();
};

export const addToCart = async (user_id, product_id, quantity = 1, token) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ user_id, product_id, quantity }),
  });
  if (!res.ok) throw new Error("Error adding to cart");
  return res.json();
};

export const updateCart = async (item_id, quantity, token) => {
  const res = await fetch(`${API_URL}/${item_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error("Error updating cart");
  return res.json();
};

export const deleteFromCart = async (item_id, token) => {
  const res = await fetch(`${API_URL}/${item_id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Error deleting item");
  return res.json();
};
