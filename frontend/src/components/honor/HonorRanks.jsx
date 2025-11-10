import React, { useEffect, useState } from "react";

export default function HonorRanks() {
  const [honors, setHonors] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("/api/honor/my_honors", {
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    })
      .then((res) => res.json())
      .then(setHonors)
      .catch((err) => console.error("failed to load honors", err));
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">🎖️ Ranks of Honor</h2>
      <ul>
        {honors.length > 0 ? (
          honors.map((h, i) => (
            <li key={i} className="p-3 border-b border-gray-300">
              <p className="font-semibold text-lg text-gold-600">{h.rank}</p>
              <p>{h.reward}</p>
              <p className="text-sm text-gray-500">Accomplished on: {new Date(h.date).toLocaleDateString()}</p>
            </li>
          ))
        ) : (
          <li className="p-3 text-gray-500">You have no honors yet.</li>
        )}
      </ul>
    </div>
  );
}
