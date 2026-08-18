import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/api';

const ProductReviewModal = ({ isOpen, onClose, orderItem, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !orderItem) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Por favor selecciona una calificación de 1 a 7 estrellas.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.post(`/api/products/${orderItem.product_id}/reviews`, {
                order_item_id: orderItem.id,
                rating: rating,
                comment: comment
            });
            onReviewSubmitted();
            onClose();
            alert("¡Gracias por tu calificación!");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Ocurrió un error al enviar la calificación.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>
                        <span className="text-4xl block mb-2">⭐</span>
                        <h2 className="text-xl font-bold">Calificar Producto</h2>
                        <p className="text-blue-100 text-sm mt-1">{orderItem.product_name}</p>
                    </div>

                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-gray-700 font-medium mb-1">¿Qué tan satisfecho estás con la relación Calidad/Precio de este producto?</p>
                            <p className="text-xs text-gray-500 mb-4">(Esta calificación es solo para el producto, no incluye tiempos de entrega de la transportadora)</p>
                            
                            <div className="flex justify-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className={`text-3xl transition-transform ${hoverRating >= star ? 'scale-125' : ''}`}
                                    >
                                        <span className={`${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'} drop-shadow-sm`}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-bold text-blue-600 h-5">
                                {rating > 0 ? `${rating} de 7 Estrellas` : ''}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comentario (Opcional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Cuéntanos qué te pareció el producto..."
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 text-sm"
                                maxLength={500}
                            />
                            <p className="text-right text-xs text-gray-400 mt-1">{comment.length}/500</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || rating === 0}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                                loading || rating === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {loading ? 'Enviando...' : 'Enviar Calificación'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProductReviewModal;
