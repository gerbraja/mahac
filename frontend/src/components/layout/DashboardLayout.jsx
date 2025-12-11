import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import TeiLogo from '../TeiLogo';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Check authentication
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { to: '/dashboard/store', icon: '🛍️', label: 'Tienda', gradient: 'from-blue-500 to-blue-600' },
    { to: '/dashboard/wallet', icon: '💰', label: 'Billetera', gradient: 'from-green-500 to-green-600' },
    { to: '/dashboard/education', icon: '📚', label: 'Educación', gradient: 'from-purple-500 to-purple-600' },
    { to: '/dashboard/personal', icon: '👤', label: 'Personal', gradient: 'from-orange-500 to-orange-600' },
    { to: '/dashboard/security', icon: '🔒', label: 'Seguridad', gradient: 'from-red-500 to-red-600' },
    { to: '/dashboard/unilevel', icon: '🌳', label: 'Red Unilevel', gradient: 'from-indigo-500 to-indigo-600' },
    { to: '/dashboard/directs', icon: '👥', label: 'Mis Afiliados', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/dashboard/binary-global', icon: '🌐', label: 'Red Binaria Global', gradient: 'from-cyan-500 to-cyan-600' },
    { to: '/dashboard/binary-millionaire', icon: '💎', label: 'Red Binaria Millonaria', gradient: 'from-pink-500 to-pink-600' },
    { to: '/dashboard/matrix', icon: '🔷', label: 'Matrices Forzadas', gradient: 'from-teal-500 to-teal-600' },
    { to: '/dashboard/qualified-ranks', icon: '🏆', label: 'Rangos Calificación', gradient: 'from-purple-500 to-purple-600' },
    { to: '/dashboard/honor-ranks', icon: '🎖️', label: 'Rangos Honor', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/dashboard/orders', icon: '📦', label: 'Mis Pedidos', gradient: 'from-orange-500 to-orange-600' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex dashboard-container">
      {/* Sidebar - Desktop */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white shadow-xl flex-shrink-0 border-r border-gray-200 transition-all duration-300 relative`} data-collapsed={sidebarCollapsed}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-10"
          title={sidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>

        <div className={`p-6 border-b border-gray-200 flex justify-center bg-gradient-to-r from-blue-600 to-blue-800 ${sidebarCollapsed ? 'px-2' : ''}`}>
          {!sidebarCollapsed && <TeiLogo size="small" showSubtitle={false} />}
          {sidebarCollapsed && <span className="text-white text-2xl font-bold">T</span>}
        </div>

        <nav className="p-4 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'} p-4 rounded-xl transition-all duration-300 border-2 ${isActive(item.to)
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl border-transparent transform scale-105 font-bold`
                : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:shadow-lg hover:border-gray-300 border-gray-200 hover:transform hover:scale-102'
                }`}
              style={!isActive(item.to) ? {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              } : {}}
              title={sidebarCollapsed ? item.label : ''}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isActive(item.to)
                ? 'bg-white bg-opacity-20'
                : 'bg-gradient-to-br ' + item.gradient
                }`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className={`font-bold text-sm flex-1 ${isActive(item.to) ? 'text-white' : 'text-gray-800'}`}>
                    {item.label}
                  </span>
                  {isActive(item.to) && (
                    <span className="text-white text-lg">▶</span>
                  )}
                </>
              )}
            </Link>
          ))}

          <div className="border-t-2 border-gray-300 my-4 pt-4">
            <Link
              to="/"
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'} p-4 rounded-xl bg-white text-gray-700 hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg`}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              title={sidebarCollapsed ? "Volver al Inicio" : ''}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                <span className="text-2xl">🏠</span>
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-sm flex-1 text-gray-800">Volver al Inicio</span>
              )}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-72 bg-white h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-800">
              <TeiLogo size="small" showSubtitle={false} />
              <button onClick={() => setMobileMenuOpen(false)} className="text-white text-2xl">✕</button>
            </div>

            <nav className="p-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border-2 ${isActive(item.to)
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl border-transparent font-bold`
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  style={!isActive(item.to) ? {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  } : {}}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isActive(item.to)
                    ? 'bg-white bg-opacity-20'
                    : 'bg-gradient-to-br ' + item.gradient
                    }`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <span className={`font-bold text-sm flex-1 ${isActive(item.to) ? 'text-white' : 'text-gray-800'}`}>
                    {item.label}
                  </span>
                  {isActive(item.to) && (
                    <span className="text-white text-lg">▶</span>
                  )}
                </Link>
              ))}

              <div className="border-t-2 border-gray-300 my-4 pt-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white text-gray-700 hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200"
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <span className="font-bold text-sm flex-1 text-gray-800">Volver al Inicio</span>
                </Link>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-6 main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
