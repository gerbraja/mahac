import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const BinaryGlobalView = () => {
    const { userId } = useParams(); // Assuming route is /dashboard/binary-global/:userId or we get it from context
    // For now, let's assume we might need to fetch current user ID from local storage or context if not in URL
    // But DashboardLayout usually has context. Let's use a hardcoded ID or fetch from an auth endpoint if needed.
    // For this demo, we'll assume the user ID is passed or we use "1" for root if missing.

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to get current user ID (mocked or from localStorage)
    const getCurrentUserId = () => {
        // In a real app, decode JWT or use Context.
        // For this MVP, we might need to ask the user or use a fixed ID.
        // Let's try to get it from localStorage 'user_id' if set by login
        return localStorage.getItem('user_id') || 1;
    };

    const activeUserId = userId || getCurrentUserId();

    const fetchStatus = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/binary/global/${activeUserId}`);
            if (!res.ok) throw new Error("Failed to fetch status");
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [activeUserId]);

    const handleActivate = async () => {
        if (!confirm("Confirm activation payment?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/binary/activate-global/${activeUserId}`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error("Activation failed");
            alert("Activated successfully!");
            fetchStatus();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    if (status.status === 'not_registered') {
        return (
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Binary Global 2x2</h2>
                <div className="bg-yellow-100 p-4 rounded">
                    <p>You are not registered in the Binary Global plan yet.</p>
                    <p>Purchase a Starter Package to join automatically.</p>
                </div>
            </div>
        );
    }

    const deadline = status.activation_deadline ? new Date(status.activation_deadline) : null;
    const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Binary Global 2x2 Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">My Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-bold ${status.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                                {status.status.toUpperCase().replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Global Position:</span>
                            <span className="font-mono font-bold">#{status.global_position}</span>
                        </div>
                        {status.status === 'pre_registered' && (
                            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
                                <p className="text-orange-800 font-semibold">Activation Required</p>
                                <p className="text-sm text-orange-700 mt-1">
                                    You have <span className="font-bold">{daysLeft} days</span> to activate your account before removal.
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Deadline: {deadline?.toLocaleDateString()}</p>
                                <button
                                    onClick={handleActivate}
                                    className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                                >
                                    Activate Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Global Spillover (Order of Arrival)</li>
                        <li>Arrival Bonuses on Odd Levels (3-21)</li>
                        <li>120 Days Pre-registration Period</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BinaryGlobalView;
