import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import TeiLogo from '../TeiLogo';
import './DashboardLayout.css';
import MobileBottomNav from './MobileBottomNav';
import ActionSheet from './ActionSheet';
import DesktopNavbar from './DesktopNavbar';

const DashboardLayout = () => {
  // Version Log
  useEffect(() => console.log('APP VERSION: DESKTOP_TOP_NAV_V1'), []);

  // State
  const [isAdmin, setIsAdmin] = useState(false);

  // Desktop Nav State (moved to DesktopNavbar component internal state for dropdowns)

  // Mobile Sheet State
  const [activeSheet, setActiveSheet] = useState(null); // 'personal', 'network', 'more' or null

  // Mobile Screen Detection (Force Hide Desktop Elements)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.is_admin) setIsAdmin(true);
      } catch (e) {
        console.error("Error checking admin status", e);
      }
    };
    checkAdmin();
  }, []);

  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path;

  // Close Sheet helper
  const closeSheet = () => setActiveSheet(null);

  // --- NAVIGATION CONFIGURATION ---

  // Group 2: Personal
  const personalItems = [
    { to: '/dashboard/wallet', icon: '💰', label: 'Billetera', gradient: 'from-green-500 to-green-600' },
    { to: '/dashboard/security', icon: '🔒', label: 'Seguridad', gradient: 'from-red-500 to-red-600' },
    { to: '/dashboard/education', icon: '📚', label: 'Educación', gradient: 'from-purple-500 to-purple-600' },
    { to: '/dashboard/personal', icon: '👤', label: 'Info Personal', gradient: 'from-orange-500 to-orange-600' },
    { to: '/dashboard/kyc', icon: '🆔', label: 'Validar Documentos', gradient: 'from-blue-500 to-blue-600' },
  ];

  // Group 3: Redes
  const networkItems = [
    { to: '/dashboard/unilevel', icon: '🌳', label: 'Red Unilevel', gradient: 'from-indigo-500 to-indigo-600' },
    { to: '/dashboard/directs', icon: '👥', label: 'Mis Afiliados', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/dashboard/binary-global', icon: '🌐', label: 'Red Binaria Global', gradient: 'from-cyan-500 to-cyan-600' },
    { to: '/dashboard/binary-millionaire', icon: '💎', label: 'Binaria Millonaria', gradient: 'from-pink-500 to-pink-600' },
    { to: '/dashboard/matrix', icon: '🔷', label: 'Matrices Forzadas', gradient: 'from-teal-500 to-teal-600' },
  ];

  // Group 4: Más
  const moreItems = [
    { to: '/dashboard/qualified-ranks', icon: '🏆', label: 'Rangos Calificación', gradient: 'from-purple-500 to-purple-600' },
    { to: '/dashboard/honor-ranks', icon: '🎖️', label: 'Rangos Honor', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/dashboard/orders', icon: '📦', label: 'Mis Pedidos', gradient: 'from-orange-500 to-orange-600' },
    { to: '/', icon: '🏠', label: 'Volver a Inicio', gradient: 'from-gray-500 to-gray-600' }
  ];

  if (isAdmin) {
    moreItems.unshift({
      to: '/admin',
      icon: '🛡️',
      label: 'Panel Admin',
      gradient: 'from-slate-700 to-slate-900',
    });
  }

  // Helper to render links (Used for Mobile Actions Sheets)
  const renderLinks = (items, sheetMode = false) => (
    <div className={`space-y-1 ${sheetMode ? 'px-2' : ''}`}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={sheetMode ? closeSheet : undefined}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 
                        ${isActive(item.to)
              ? `bg-gradient-to-r ${item.gradient} text-white font-bold shadow-md`
              : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }
                    `}
        >
          <span className="text-xl w-8 text-center">{item.icon}</span>
          <span className="text-sm font-medium">{item.label}</span>
          {isActive(item.to) && <span className="ml-auto text-white">▶</span>}
        </Link>
      ))}
    </div>
  );

  const navData = { personalItems, networkItems, moreItems };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* --- DESKTOP LAYOUT (Top Bar + Content) --- */}
      <div className="flex flex-col h-screen overflow-hidden">

        {/* 1. TOP NAVBAR (Hidden on Mobile) */}
        <div className="hidden md:block">
          <DesktopNavbar navData={navData} isActive={isActive} />
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-auto p-4 md:p-6 main-content bg-gray-50 pb-24 md:pb-6">
            <Outlet />
          </main>
        </div>

      </div>
      {/* --- END DESKTOP LAYOUT --- */}

      {/* --- MOBILE OVERLAYS (STRICTLY RENDERED ONLY ON MOBILE) --- */}
      {isMobile && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <MobileBottomNav currentPath={location.pathname} onOpenSheet={setActiveSheet} />
          </div>

          <div className="pointer-events-auto">
            <ActionSheet
              isOpen={activeSheet === 'personal'}
              onClose={closeSheet}
              title="👤 Área Personal"
            >
              {renderLinks(personalItems, true)}
            </ActionSheet>

            <ActionSheet
              isOpen={activeSheet === 'network'}
              onClose={closeSheet}
              title="🌐 Mis Redes"
            >
              {renderLinks(networkItems, true)}
            </ActionSheet>

            <ActionSheet
              isOpen={activeSheet === 'more'}
              onClose={closeSheet}
              title="☰ Gestión & Más"
            >
              {renderLinks(moreItems, true)}
            </ActionSheet>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
