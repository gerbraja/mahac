import React, { useState } from 'react';
import { calculateCommissions } from '../unilevel/CommissionService';
import CommissionTable from './CommissionTable';

export default function UnilevelDashboard() {
  const [sellerId, setSellerId] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [error, setError] = useState(null);

  const onCalculate = async (e) => {
    e.preventDefault();
    setError(null);
    setCommissions([]);

    const id = parseInt(sellerId, 10);
    const amount = parseFloat(saleAmount);
    if (!id || isNaN(amount)) {
      setError('Please enter a valid seller id and sale amount.');
      return;
    }

    setLoading(true);
    try {
      const result = await calculateCommissions(id, amount);
      setCommissions(result || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unilevel-dashboard">
      <h2>Unilevel commissions</h2>

      <form onSubmit={onCalculate} style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Seller ID
          <input
            type="number"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Sale amount
          <input
            type="number"
            step="0.01"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate commissions'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <CommissionTable commissions={commissions} />
    </div>
  );
}
