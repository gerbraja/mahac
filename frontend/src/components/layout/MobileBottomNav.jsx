import React from 'react';
import { useLocation, Link } from 'react-router-dom';

/**
 * MobileBottomNav Component
 * Fixed bottom navigation bar with 4 main categories.
 * 
 * @param {string} currentPath - Current router path
 * @param {function} onOpenSheet - Callback to open specific sheets ('personal', 'network', 'more')
 */
const MobileBottomNav = ({ currentPath, onOpenSheet }) => {

    // Check active state
    const isActive = (path) => currentPath === path;
    const isGroupActive = (paths) => paths.some(p => currentPath.startsWith(p));

    // Button Base Style
    const btnClass = "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors";

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center z-40 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">

            {/* 1. Tienda (Direct Link) */}
            <Link to="/dashboard/store" className={`${btnClass} ${isActive('/dashboard/store') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                <span className="text-2xl">🛍️</span>
                <span className="text-[10px] font-bold">Tienda</span>
            </Link>

            {/* 2. Personal (Action Sheet Trigger) */}
            <button
                onClick={() => onOpenSheet('personal')}
                className={`${btnClass} ${isGroupActive(['/dashboard/wallet', '/dashboard/security', '/dashboard/education', '/dashboard/personal']) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
                <span className="text-2xl">👤</span>
                <span className="text-[10px] font-bold">Personal</span>
            </button>

            {/* 3. Redes (Action Sheet Trigger) */}
            <button
                onClick={() => onOpenSheet('network')}
                className={`${btnClass} ${isGroupActive(['/dashboard/unilevel', '/dashboard/directs', '/dashboard/binary', '/dashboard/matrix']) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg -mt-6 border-4 border-gray-50">
                    <span className="text-xl">🌐</span>
                </div>
                <span className="text-[10px] font-bold text-blue-800">Redes</span>
            </button>

            {/* 4. Más / Gestión (Action Sheet Trigger) */}
            <button
                onClick={() => onOpenSheet('more')}
                className={`${btnClass} ${isGroupActive(['/dashboard/orders', '/dashboard/ranks']) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
                <span className="text-2xl">☰</span>
                <span className="text-[10px] font-bold">Más</span>
            </button>

        </div>
    );
};

export default MobileBottomNav;
