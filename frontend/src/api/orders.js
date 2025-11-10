import axios from "axios";
const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export async function getMyOrders(token) {
  const res = await axios.get(`${BASE}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function getOrder(id, token) {
  const res = await axios.get(`${BASE}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function createOrder(payload, token) {
  const res = await axios.post(`${BASE}/api/orders/`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
