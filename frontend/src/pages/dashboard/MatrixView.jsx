import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
const MatrixNode = ({ node }) => {
    if (!node) return null;

    return (
        <div className="flex flex-col items-center mx-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-2 shadow-lg">
                {node.user_id}
            </div>
            <div className="text-xs text-gray-500 mb-4">Lvl {node.level}</div>

            {node.children && node.children.length > 0 && (
                <div className="flex flex-row border-t-2 border-gray-300 pt-4">
                    {node.children.map((child) => (
                        <MatrixNode key={child.id} node={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

const MatrixView = () => {
    // const { token } = useContext(AuthContext); // AuthContext not implemented yet
    // For demo purposes, we might need to decode token to get user_id, or store it in context
    // Let's assume context has user object
    const user_id = 1; // Placeholder: Replace with actual user ID from context
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matrixId, setMatrixId] = useState(27); // Default matrix ID

    useEffect(() => {
        const fetchTree = async () => {
            try {
                // In a real app, use the token for auth headers
                const res = await axios.get(`http://localhost:8000/api/matrix/tree/${user_id}/${matrixId}`);
                setTree(res.data);
            } catch (error) {
                console.error("Error fetching matrix tree:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTree();
    }, [user_id, matrixId]);

    const buyMatrix = async () => {
        try {
            await axios.post(`http://localhost:8000/api/matrix/buy`, {
                user_id: user_id,
                matrix_id: matrixId
            });
            alert("Matrix purchased!");
            window.location.reload();
        } catch (e) {
            alert("Error purchasing matrix: " + e.response?.data?.detail || e.message);
        }
    }

    if (loading) return <div>Loading Matrix...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Matrix Structure</h2>
                <button onClick={buyMatrix} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Buy Level {matrixId}
                </button>
            </div>

            <div className="overflow-x-auto pb-10">
                <div className="min-w-max flex justify-center">
                    {tree && !tree.error ? (
                        <MatrixNode node={tree} />
                    ) : (
                        <div className="text-center text-gray-500 mt-10">
                            <p>You are not active in this matrix level.</p>
                            <p className="mt-2">Purchase a position to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatrixView;
