import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function InventoryAdmin() {
  const [products, setProducts] = useState([]);
  const [adjust, setAdjust] = useState({ product_id: null, qty: 0 });

  useEffect(()=> {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`${BASE}/api/products`);
    setProducts(res.data);
  };

  const handleAdjust = async () => {
    if (!adjust.product_id) return alert("Select a product");
    try {
      await axios.post(`${BASE}/api/inventory/adjust/${adjust.product_id}`, null, { params: { quantity: adjust.qty }});
      setAdjust({ product_id: null, qty: 0});
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to adjust stock");
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Inventory Admin</h3>
      <div className="mb-3">
        <select value={adjust.product_id || ""} onChange={e=>setAdjust({...adjust, product_id: Number(e.target.value)})}>
          <option value="">Select product</option>
          {products.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}
        </select>
        <input type="number" value={adjust.qty} onChange={e=>setAdjust({...adjust, qty: Number(e.target.value)})} className="ml-2" />
        <button onClick={handleAdjust} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">Adjust</button>
      </div>
      <div>
        <h4 className="font-medium">Products</h4>
        <ul>
          {products.map(p=> <li key={p.id}>{p.name} — {p.stock}</li>)}
        </ul>
      </div>
    </div>
  );
}
