import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductFilters from "./ProductFilters";

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function ProductsWithFilters() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(()=> {
    fetchProducts(filters);
  }, [filters]);

  const fetchProducts = async (f) => {
    const params = {};
    if (f.q) params.q = f.q;
    if (f.min_price) params.min_price = f.min_price;
    if (f.max_price) params.max_price = f.max_price;
    if (f.in_stock !== undefined) params.in_stock = f.in_stock;
    try {
      const res = await axios.get(`${BASE}/api/products`, { params });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-1"><ProductFilters onFilter={setFilters} /></div>
      <div className="col-span-3">
        <div className="grid grid-cols-3 gap-3">
          {products.map(p => (
            <div key={p.id} className="border p-2 rounded">
              <div className="font-medium">{p.name}</div>
              <div>${p.price_usd.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
