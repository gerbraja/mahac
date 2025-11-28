import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/pending-payments');
            setPayments(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching payments", err);
            setError("Failed to load pending payments.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (paymentId) => {
        if (!window.confirm("Are you sure you want to approve this payment? This will activate the user if applicable.")) {
            return;
        }

        try {
            await api.post(`/api/admin/approve-payment/${paymentId}`);
            alert("Payment approved successfully!");
            fetchPayments(); // Refresh list
        } catch (err) {
            console.error("Error approving payment", err);
            const msg = err.response?.data?.detail || "Failed to approve payment.";
            alert(`Error: ${msg}`);
        }
    };

    if (loading) return <div className="p-4">Loading payments...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Pending Bank Transfers</h2>

            {payments.length === 0 ? (
                <p className="text-gray-500">No pending payments found.</p>
            ) : (
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Date</th>
                                <th className="p-3">User</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Reference</th>
                                <th className="p-3">Registration</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="font-medium">{p.user.name}</div>
                                        <div className="text-sm text-gray-500">{p.user.email}</div>
                                    </td>
                                    <td className="p-3">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: p.currency }).format(p.amount)}
                                    </td>
                                    <td className="p-3 font-mono text-sm">{p.reference}</td>
                                    <td className="p-3">
                                        {p.user.registration_complete ? (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Complete</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Incomplete</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleApprove(p.id)}
                                            disabled={!p.user.registration_complete}
                                            className={`px-3 py-1 rounded text-sm ${p.user.registration_complete
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                            title={!p.user.registration_complete ? "User must complete registration first" : "Approve Payment"}
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
