import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ActionSheet Component
 * A mobile-optimized slide-up menu.
 * 
 * @param {boolean} isOpen - Whether the sheet is visible
 * @param {function} onClose - Function to call when closing
 * @param {string} title - Title of the menu
 * @param {React.ReactNode} children - Menu items
 */
const ActionSheet = ({ isOpen, onClose, title, children }) => {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling

            // Cleanup: Always unlock scroll when unmounting or changing state
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = '';
            };
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300); // Wait for animation
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end flex-col">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isVisible ? 'opacity-50' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-out shadow-2xl z-10 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Handle Bar (Visual cue) */}
                <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                            ✕
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 pb-8 space-y-2">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ActionSheet;
