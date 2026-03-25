import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    axios.get(`${BASE}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrder(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Order #{order.id}</h3>
      <p>Status: <strong>{order.status}</strong></p>
      <div className="mt-3">
        <h4 className="font-medium">Items</h4>
        <ul>
          {order.items.map(i => (
            <li key={i.id} className="mb-2">
              <span className="font-semibold">{i.product_name}</span> x{i.quantity} — ${i.subtotal_usd.toFixed(2)}
              {i.selected_options && (
                <div className="text-xs text-blue-600 ml-4">
                  Opción: {Object.entries(JSON.parse(i.selected_options)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
