import React from 'react';

export default function CommissionTable({ commissions = [] }) {
  if (!commissions || commissions.length === 0) {
    return <div>No commissions to show.</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>User ID</th>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Type</th>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Level</th>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Commission</th>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Sale Amount</th>
          <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Created At</th>
        </tr>
      </thead>
      <tbody>
        {commissions.map((c, idx) => (
          <tr key={c.id || idx}>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{c.user_id}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{c.type}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{c.level}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{Number(c.commission_amount).toFixed(2)}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{Number(c.sale_amount).toFixed(2)}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
