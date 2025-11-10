import { api } from './api'

export async function createPayment({ orderId = null, amount, currency = 'COP', provider = 'wompi', idempotencyKey = null, metadata = null }) {
  const payload = {
    order_id: orderId,
    amount,
    currency,
    provider,
    idempotency_key: idempotencyKey,
    metadata,
  }
  const res = await api.post('/api/payments/create', payload)
  return res.data
}

export async function getPayment(paymentId) {
  const res = await api.get(`/api/payments/${paymentId}`)
  return res.data
}
