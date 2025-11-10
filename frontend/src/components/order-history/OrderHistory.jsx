import React, { useEffect, useState } from "react";
import axios from "axios";
import OrderItem from "./OrderItem";

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  useEffect(()=> {
    const token = localStorage.getItem("token");
    axios.get(`${BASE}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Order History</h3>
      {orders.length === 0 ? <p>No orders yet.</p> : (
        <div className="space-y-4">
          {orders.map(o => (
            <OrderItem key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
