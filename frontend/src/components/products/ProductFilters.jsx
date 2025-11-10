import React, { useState } from "react";

export default function ProductFilters({ onFilter }) {
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const apply = () => {
    onFilter({
      q: q || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      in_stock: inStock ? true : undefined
    });
  };

  const clear = () => {
    setQ(""); setMinPrice(""); setMaxPrice(""); setInStock(false);
    onFilter({});
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Filters</h3>
      <div className="space-y-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="w-full p-2 border rounded" />
        <div className="flex gap-2">
          <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Min price" className="p-2 border rounded w-full" />
          <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max price" className="p-2 border rounded w-full" />
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)} /> In stock</label>
        <div className="flex gap-2">
          <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">Apply</button>
          <button onClick={clear} className="px-3 py-1 bg-gray-200 rounded">Clear</button>
        </div>
      </div>
    </div>
  );
}
