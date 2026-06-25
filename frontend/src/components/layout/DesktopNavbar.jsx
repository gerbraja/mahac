import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TeiLogo from '../TeiLogo';

const DesktopNavbar = ({
    navData, // { personalItems, networkItems, moreItems }
    isActive
}) => {
    const tiendaItems = [
        { to: '/dashboard/store', icon: '🛍️', label: 'Ver Todo' },
        { to: '/dashboard/store?cat=ropa-interior', icon: '👙', label: 'Ropa Interior' },
        { to: '/dashboard/store?cat=conjuntos', icon: '👗', label: 'Conjuntos' },
        { to: '/dashboard/store?cat=pijamas', icon: '🛌', label: 'Pijamas' },
        { to: '/dashboard/store?cat=vestidos-faldas', icon: '💃', label: 'Vestidos y Faldas' },
        { to: '/dashboard/store?cat=vestidos-bano', icon: '🩱', label: 'Vestidos de Baño' },
        { to: '/dashboard/store?cat=camisas-damas', icon: '👚', label: 'Camisas y Blusas' },
        { to: '/dashboard/store?cat=camisas-hombre', icon: '👕', label: 'Camisas Hombre' },
        { to: '/dashboard/store?cat=calzado', icon: '👟', label: 'Calzado' },
        { to: '/dashboard/store?cat=salud', icon: '🩺', label: 'Salud' }
    ];

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState(null); // 'tienda', 'personal', 'network', 'more', or null
    const dropdownRef = useRef(null);
    const location = useLocation();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on route change
    useEffect(() => {
        setOpenDropdown(null);
    }, [location.pathname]);

    const toggleDropdown = (key) => {
        if (openDropdown === key) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(key);
        }
    };

    // Helper to verify if an item is active including search params
    const isItemActive = (to) => {
        if (to.includes('?')) {
            return location.pathname + location.search === to;
        }
        return isActive(to);
    };

    // Helper to render dropdown menu
    const renderDropdownMenu = (items) => (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in-down">
            {items.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors
                        ${isItemActive(item.to) ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-600'}
                    `}
                >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );

    // Helper for Top Level Link
    const NavTrigger = ({ label, id, isOpen }) => (
        <button
            onClick={() => toggleDropdown(id)}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all relative
                ${isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-white'}
            `}
        >
            {label}
            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
    );

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-4">
                <TeiLogo size="small" showSubtitle={false} />
                {localStorage.getItem('access_token') ? (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">
                        👤 Conectado
                    </span>
                ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200">
                        ⭕ Desconectado
                    </span>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-2" ref={dropdownRef}>

                {/* 1. Tienda Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('tienda')}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all relative
                            ${openDropdown === 'tienda' 
                                ? 'text-blue-600 bg-blue-50' 
                                : location.pathname.startsWith('/dashboard/store')
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }
                        `}
                    >
                        <span>🛍️</span> Tienda
                        <span className={`transform transition-transform duration-200 ${openDropdown === 'tienda' ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {openDropdown === 'tienda' && renderDropdownMenu(tiendaItems)}
                </div>

                {/* 2. Personal Group */}
                <div className="relative">
                    <NavTrigger label="Personal" id="personal" isOpen={openDropdown === 'personal'} />
                    {openDropdown === 'personal' && renderDropdownMenu(navData.personalItems)}
                </div>

                {/* 3. Redes Group */}
                <div className="relative">
                    <NavTrigger label="Redes y Negocio" id="network" isOpen={openDropdown === 'network'} />
                    {openDropdown === 'network' && renderDropdownMenu(navData.networkItems)}
                </div>

                {/* 4. More Group */}
                <div className="relative">
                    <NavTrigger label="Gestión" id="more" isOpen={openDropdown === 'more'} />
                    {openDropdown === 'more' && renderDropdownMenu(navData.moreItems)}
                </div>
            </nav>
        </header>
    );
};

export default DesktopNavbar;
