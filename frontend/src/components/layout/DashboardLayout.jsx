import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import TeiLogo from '../TeiLogo';
import './DashboardLayout.css';
import MobileBottomNav from './MobileBottomNav';
import ActionSheet from './ActionSheet';
import DesktopNavbar from './DesktopNavbar';
import { api } from '../../api/api';

const DashboardLayout = () => {
  // Version Log
  useEffect(() => console.log('APP VERSION: DESKTOP_TOP_NAV_V1'), []);

  // State
  const [isAdmin, setIsAdmin] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // Desktop Nav State (moved to DesktopNavbar component internal state for dropdowns)

  // Mobile Sheet State
  const [activeSheet, setActiveSheet] = useState(null); // 'personal', 'network', 'more' or null

  // Mobile Screen Detection (Force Hide Desktop Elements)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const location = useLocation();
  
  // Mandatory Rating State
  const [pendingRatingOrder, setPendingRatingOrder] = useState(null);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');

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
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (payload.is_admin) setIsAdmin(true);
      } catch (e) {
        console.error("Error checking admin status", e);
      }

      if (localStorage.getItem('admin_token')) {
        setImpersonating(true);
      }
    };
    checkAdmin();
  }, []);

  const token = localStorage.getItem('access_token');
  
  useEffect(() => {
    const fetchPendingRating = async () => {
      try {
        const res = await api.get('/api/merchants/orders/pending-rating');
        if (res.data && res.data.length > 0) {
          setPendingRatingOrder(res.data[0]);
        }
      } catch (e) {
        console.error("Error fetching pending rating", e);
      }
    };
    if (token && !isAdmin && !impersonating) {
      fetchPendingRating();
    }
  }, [token, isAdmin, impersonating]);

  if (!token) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path;

  // Close Sheet helper
  const closeSheet = () => setActiveSheet(null);

  const handleStopImpersonating = () => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      localStorage.setItem('access_token', adminToken);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('userId'); // Remove impersonated userId if any
      window.location.href = '/admin/users';
    }
  };

  const submitRating = async () => {
    if (!pendingRatingOrder) return;
    if (ratingVal < 1 || ratingVal > 7) {
        setRatingError("Por favor selecciona entre 1 y 7 estrellas.");
        return;
    }
    if (ratingVal <= 3 && (!ratingReason || ratingReason.trim().length < 5)) {
        setRatingError("Por favor escribe el motivo de tu calificación.");
        return;
    }
    
    setRatingSubmitting(true);
    setRatingError('');
    try {
        await api.post(`/api/merchants/orders/${pendingRatingOrder.id}/rate`, {
            rating: ratingVal,
            reason: ratingReason
        });
        setPendingRatingOrder(null);
        setRatingVal(0);
        setRatingReason('');
    } catch (e) {
        setRatingError(e.response?.data?.detail || "Error al enviar la calificación");
    } finally {
        setRatingSubmitting(false);
    }
  };

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

  // Group 4: Más / Gestión
  const moreItems = [
    { to: '/dashboard', icon: '🏠', label: 'Mi Oficina Virtual', gradient: 'from-blue-500 to-indigo-600' },
    { to: '/dashboard/qualified-ranks', icon: '🏆', label: 'Rangos Calificación', gradient: 'from-purple-500 to-purple-600' },
    { to: '/dashboard/honor-ranks', icon: '🏅', label: 'Rangos Honor', gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/dashboard/orders', icon: '📦', label: 'Mis Pedidos', gradient: 'from-orange-500 to-orange-600' },
    { to: '/', icon: '🔙', label: 'Volver a Inicio', gradient: 'from-gray-500 to-gray-600' }
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
            {impersonating && (
              <div style={{
                background: '#ef4444',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <span>🕵️‍♂️</span>
                  <span>Estás navegando en MODO IMPERSONACIÓN (como otro usuario)</span>
                </div>
                <button 
                  onClick={handleStopImpersonating}
                  style={{
                    background: 'white',
                    color: '#ef4444',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Volver a Administrador
                </button>
              </div>
            )}
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
              {renderLinks([
                { to: '/dashboard/unilevel', icon: '🌳', label: 'Red Unilevel', gradient: 'from-indigo-500 to-indigo-600' },
                { to: '/dashboard/directs', icon: '👥', label: 'Mis Afiliados', gradient: 'from-emerald-500 to-emerald-600' },
                { to: '/dashboard/binary-global', icon: '🌐', label: 'Red Binaria Global', gradient: 'from-cyan-500 to-cyan-600' },
                { to: '/dashboard/binary-millionaire', icon: '💎', label: 'Binaria Millonaria', gradient: 'from-pink-500 to-pink-600' },
                { to: '/dashboard/matrix', icon: '🔷', label: 'Matrices Forzadas', gradient: 'from-teal-500 to-teal-600' },
                ...moreItems
              ], true)}
            </ActionSheet>
          </div>
        </div>
      )}

      {/* --- MANDATORY RATING MODAL --- */}
      {pendingRatingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-95 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-8 text-center animate-fade-in-up border-4 border-indigo-500">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">¡Califica tu compra!</h2>
            <p className="text-gray-600 mb-6 font-medium">
              Antes de continuar, por favor cuéntanos cómo te fue con el pedido en <strong className="text-indigo-700">{pendingRatingOrder.merchant_name}</strong>.
            </p>
            
            <div className="flex flex-col items-center space-y-2 mb-6">
                <div className="flex gap-2 justify-center flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className={`text-4xl transition-transform hover:scale-110 ${ratingVal >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-2">
                    {ratingVal === 0 && "Selecciona de 1 a 7 estrellas"}
                    {ratingVal > 0 && ratingVal <= 3 && <span className="text-red-500">Insatisfecho ({ratingVal}/7)</span>}
                    {ratingVal === 4 && <span className="text-yellow-500">Regular ({ratingVal}/7)</span>}
                    {ratingVal >= 5 && <span className="text-green-500">Excelente ({ratingVal}/7)</span>}
                </div>
            </div>

            {ratingVal > 0 && ratingVal <= 3 && (
                <div className="w-full mb-6 text-left animate-fade-in">
                    <label className="block text-sm font-bold text-red-600 mb-2">
                        Motivo de tu insatisfacción (Obligatorio)
                    </label>
                    <textarea 
                        required
                        rows="3"
                        placeholder="Por favor explícanos qué salió mal con tu compra..."
                        value={ratingReason}
                        onChange={e => setRatingReason(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50 focus:border-red-500 focus:outline-none"
                    ></textarea>
                </div>
            )}
            
            {ratingError && <p className="text-red-500 text-sm font-bold mb-4">{ratingError}</p>}
            
            <button 
                onClick={submitRating}
                disabled={ratingVal === 0 || (ratingVal <= 3 && ratingReason.trim().length < 5) || ratingSubmitting}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                    (ratingVal === 0 || (ratingVal <= 3 && ratingReason.trim().length < 5))
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl hover:shadow-indigo-500/50'
                }`}
            >
                {ratingSubmitting ? 'Enviando...' : 'ENVIAR CALIFICACIÓN'}
            </button>
            <p className="text-xs text-gray-400 mt-4">
                Esta calificación nos ayuda a mejorar el Centro Comercial TEI.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
