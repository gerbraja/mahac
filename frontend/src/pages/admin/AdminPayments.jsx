import { useState, useEffect } from 'react';
import { api } from '../../api/api';

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/pending-payments');
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setMessage('Error al cargar pagos pendientes');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setActiveSearchTerm(searchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setActiveSearchTerm('');
    };

    const filteredPayments = payments.filter(payment => {
        if (!activeSearchTerm) return true;
        const searchLower = activeSearchTerm.toLowerCase();
        return (
            payment.user.name.toLowerCase().includes(searchLower) ||
            payment.user.email.toLowerCase().includes(searchLower) ||
            (payment.user.document_id && payment.user.document_id.includes(searchLower))
        );
    });

    const handleApprove = async (paymentId) => {
        if (!window.confirm('¿Estás seguro de aprobar este pago? Se activará al usuario y se procesarán las comisiones.')) {
            return;
        }

        try {
            await api.post(`/api/admin/approve-payment/${paymentId}`);
            setMessage('Pago aprobado exitosamente. Usuario activado y comisiones procesadas.');
            fetchPayments();
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Error al aprobar pago');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    Pagos Pendientes (Consignación Bancaria)
                </h2>
                <p style={{ color: '#6b7280' }}>
                    Aprueba los pagos realizados por consignación bancaria para activar usuarios.
                </p>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginTop: '1rem',
                        borderRadius: '0.5rem',
                        background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                        color: message.includes('Error') ? '#dc2626' : '#065f46',
                        border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#6ee7b7'}`
                    }}>
                        {message}
                    </div>
                )}

                {/* Search Bar */}
                <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔍 Buscar
                    </button>
                    {(searchTerm || activeSearchTerm) && (
                        <button
                            onClick={handleClearSearch}
                            style={{
                                padding: '0.75rem',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            ❌
                        </button>
                    )}
                </div>
            </div>

            {/* Payments Table */}
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Usuario</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Documento</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Monto</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Proveedor</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    Cargando...
                                </td>
                            </tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    {searchTerm ? '🔍 No se encontraron pagos con ese criterio' : '✅ No hay pagos pendientes'}
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((payment) => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{payment.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{payment.user.name}</div>
                                            {!payment.user.registration_complete && (
                                                <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                                                    ⚠️ Registro incompleto
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{payment.user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {payment.user.document_id || (
                                            <span style={{ color: '#ef4444' }}>Sin documento</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        {payment.currency === 'USD' ? '$' : '$'}{payment.amount.toFixed(2)} {payment.currency}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.875rem',
                                            background: '#dbeafe',
                                            color: '#1e40af'
                                        }}>
                                            {payment.provider}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        {new Date(payment.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {payment.user.registration_complete ? (
                                            <button
                                                onClick={() => handleApprove(payment.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ✅ Aprobar
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                                                Usuario debe completar registro primero
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.5rem',
                color: '#1e40af'
            }}>
                <strong>ℹ️ Información:</strong> Al aprobar un pago, el sistema automáticamente:
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    <li>Cambia el estado del pedido a "paid"</li>
                    <li>Activa al usuario si es un paquete de activación</li>
                    <li>Distribuye comisiones a su red (Binario Global, Binario Millonario, Uninivel)</li>
                </ul>
            </div>
        </div>
    );
}
