import React, { useState } from 'react';
import { calculateBinary } from '../../api/api';

export default function BinaryDashboard() {
  const [sellerId, setSellerId] = useState('');
  const [amount, setAmount] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onCalculate = async (e) => {
    e.preventDefault();
    setError(null);
    setCommissions([]);
    const id = parseInt(sellerId, 10);
    const amt = parseFloat(amount);
    if (!id || isNaN(amt)) {
      setError('Please enter valid values');
      return;
    }
    setLoading(true);
    try {
      const res = await calculateBinary({ seller_id: id, package_amount: amt });
      setCommissions(res || []);
    } catch (err) {
      setError(err.message || 'API error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Binary Global - Calculator</h2>
      <form onSubmit={onCalculate}>
        <label>Seller ID <input value={sellerId} onChange={(e) => setSellerId(e.target.value)} /></label>
        <label>Package amount <input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</button>
      </form>

      {error && <div style={{color: 'red'}}>{error}</div>}

      <ul>
        {commissions.map((c) => (
          <li key={c.id}>{c.user_id} — {c.commission_amount} — {c.type}</li>
        ))}
      </ul>
    </div>
  );
}
