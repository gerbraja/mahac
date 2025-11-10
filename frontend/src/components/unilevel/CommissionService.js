const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function calculateCommissions(sellerId, saleAmount) {
  const url = `${API_BASE}/api/unilevel/calculate`;
  const body = { seller_id: sellerId, sale_amount: saleAmount };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Expecting an array of commission objects
  return data;
}
