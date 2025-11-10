import React from "react";

export default function OrderItem({ order }) {
  return (
    <div className="border rounded p-3">
      <div className="flex justify-between">
        <div>
          <div className="text-sm text-gray-600">Order #{order.id}</div>
          <div className="font-semibold">{order.status}</div>
        </div>
        <div className="text-right">
          <div>${order.total_usd.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
