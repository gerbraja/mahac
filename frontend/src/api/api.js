import axios from "axios";

// Support both NEXT_PUBLIC_API_BASE (Next.js) and REACT_APP_API_BASE (CRA/Vite)
const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: BASE,
});

export const calculateBinary = async (payload) => {
  const res = await api.post('/api/binary/calculate', payload);
  return res.data;
};

export const calculateUnilevel = async (payload) => {
  const res = await api.post('/api/unilevel/calculate', payload);
  return res.data;
};
