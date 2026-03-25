import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [selectedOptions, setSelectedOptions] = useState({});

  let parsedOptions = null;
  if (product.options) {
    try {
      parsedOptions = JSON.parse(product.options);
    } catch (e) {
      console.error("Error parsing product options");
    }
  }

  const isOptionsComplete = () => {
    if (!parsedOptions) return true;
    return Object.keys(parsedOptions).every((key) => selectedOptions[key]);
  };

  const handleAddToCart = () => {
    if (!isOptionsComplete()) return;
    const optionsStr = Object.keys(selectedOptions).length > 0 ? JSON.stringify(selectedOptions) : null;
    addToCart(product, optionsStr);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "1rem",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <h3>{product.name}</h3>
      <div style={{ margin: "0.5rem 0" }}>
        <p style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#16a34a" }}>
          ${product.price_local?.toLocaleString()} COP
        </p>
        <p style={{ color: "#2563eb", fontWeight: "bold", marginTop: "0.25rem" }}>
          💎 {product.pv} PV
        </p>
      </div>

      {parsedOptions && (
        <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Object.keys(parsedOptions).map((optionName) => (
            <select
              key={optionName}
              value={selectedOptions[optionName] || ""}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, [optionName]: e.target.value })}
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Selecciona {optionName}</option>
              {parsedOptions[optionName].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!isOptionsComplete()}
        style={{
          background: isOptionsComplete() ? "#2563eb" : "#9ca3af",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          border: "none",
          cursor: isOptionsComplete() ? "pointer" : "not-allowed",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        {isOptionsComplete() ? "Agregar al carrito" : "Selecciona opción"}
      </button>
    </div>
  );
}

