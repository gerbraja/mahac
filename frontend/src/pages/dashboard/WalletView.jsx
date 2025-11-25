import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WalletView = () => {
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Using a hardcoded token for MVP or assuming auth header is set globally
                // For this demo, we might need to pass a token if we implemented auth.
                // If not, we can mock the user_id in the backend or use a test token.
                // Assuming the backend 'get_current_user' dependency works with a mock or real token.
                // Since we don't have a full login flow in this snippet, I'll assume we use a test token.
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const res = await axios.get(`http://localhost:8000/api/wallet/summary`, config);
                setWalletData(res.data);
            } catch (error) {
                console.error("Error fetching wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading wallet data...</div>;
    if (!walletData) return <div className="p-4 text-red-500">Failed to load wallet data.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Current Balance</h3>
                    <p className="text-3xl font-bold text-gray-900">${walletData.balance?.toFixed(2) || '0.00'}</p>
                </div>

                {/* Frozen Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Frozen Balance</h3>
                    <p className="text-3xl font-bold text-gray-900">${walletData.frozen_balance?.toFixed(2) || '0.00'}</p>
                </div>

                {/* Total Earnings Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Earnings</h3>
                    <p className="text-3xl font-bold text-gray-900">${walletData.total_earnings?.toFixed(2) || '0.00'}</p>
                </div>
            </div>

            {/* Recent Transactions Placeholder */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-800">Recent Transactions</h3>
                </div>
                <div className="p-6 text-gray-500 text-center">
                    No recent transactions found.
                </div>
            </div>
        </div>
    );
};

export default WalletView;
