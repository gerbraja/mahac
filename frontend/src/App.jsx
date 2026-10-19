import React from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MarketingBubbles from "./components/MarketingBubbles";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import MagicMerchantLogin from "./pages/auth/MagicMerchantLogin";
import StoreDirectory from './pages/stores/StoreDirectory';
import Storefront from './pages/stores/Storefront';
import StoreCheckout from './pages/stores/StoreCheckout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy imports for pages
const MatrixView = React.lazy(() => import("./pages/dashboard/MatrixView"));
const WalletView = React.lazy(() => import("./pages/dashboard/WalletView"));
const BinaryGlobalView = React.lazy(() => import("./pages/dashboard/BinaryGlobalView"));
const BinaryMillionaireView = React.lazy(() => import("./pages/dashboard/BinaryMillionaireView"));
const UnilevelView = React.lazy(() => import("./pages/dashboard/UnilevelView"));
const DirectsView = React.lazy(() => import("./pages/dashboard/DirectsView"));
const EducationView = React.lazy(() => import("./pages/dashboard/EducationView"));
const DigitalMarketingCourse = React.lazy(() => import("./pages/dashboard/DigitalMarketingCourse"));
const NetworkBuildingCourse = React.lazy(() => import("./pages/dashboard/NetworkBuildingCourse"));
const PersonalView = React.lazy(() => import("./pages/dashboard/PersonalView"));
const SecurityView = React.lazy(() => import("./pages/dashboard/SecurityView"));
const StoreView = React.lazy(() => import("./pages/dashboard/StoreView"));
const DashboardHome = React.lazy(() => import("./pages/dashboard/DashboardHome"));
const Login = React.lazy(() => import("./pages/Login"));
const Personal = React.lazy(() => import("./pages/Personal"));
const OrderConfirmation = React.lazy(() => import("./pages/OrderConfirmation"));
const QualifiedRanksView = React.lazy(() => import("./pages/dashboard/QualifiedRanksView"));
const HonorRanksView = React.lazy(() => import("./pages/dashboard/HonorRanksView"));
const UserOrders = React.lazy(() => import("./components/UserOrders"));
const UpgradePackage = React.lazy(() => import("./pages/dashboard/UpgradePackage"));
const KYCValidation = React.lazy(() => import("./pages/dashboard/KYCValidation"));
const PickupPointPortal = React.lazy(() => import("./pages/PickupPointPortal"));
const CompleteRegistration = React.lazy(() => import("./pages/CompleteRegistration"));
const Opportunity = React.lazy(() => import("./pages/Opportunity"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const SupplierInventory = React.lazy(() => import("./pages/SupplierInventory"));
const MerchantPortal = React.lazy(() => import("./pages/merchant/MerchantPortal"));
const MerchantApply = React.lazy(() => import("./pages/dashboard/MerchantApply"));

// Transport Module Imports
const PassengerDashboard = React.lazy(() => import("./components/transport/PassengerDashboard"));
const DriverRadar = React.lazy(() => import("./components/transport/DriverRadar"));
const DriverRegistration = React.lazy(() => import("./components/transport/DriverRegistration"));
const DriverWallet = React.lazy(() => import("./components/transport/DriverWallet"));
const AdminTransportKYC = React.lazy(() => import("./pages/admin/AdminTransportKYC"));
const AdminTransportDrivers = React.lazy(() => import("./pages/admin/AdminTransportDrivers"));

// Admin imports and lazy components
import AdminLayout from './components/layout/AdminLayout';
import RequireAdmin from './components/auth/RequireAdmin';
import { AdminProvider } from './context/AdminContext';

const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminWithdrawals = React.lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminLogistics = React.lazy(() => import('./pages/admin/AdminLogistics'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminSponsorshipCommissions = React.lazy(() => import('./pages/admin/AdminSponsorshipCommissions'));
const AdminQualifiedRanks = React.lazy(() => import('./pages/admin/AdminQualifiedRanks'));
const AdminHonorRanks = React.lazy(() => import('./pages/admin/AdminHonorRanks'));
const AdminOrders = React.lazy(() => import('./components/AdminOrders'));
const AdminPickupPoints = React.lazy(() => import('./pages/admin/AdminPickupPoints'));
const AdminKYC = React.lazy(() => import('./pages/admin/AdminKYC'));
const AdminSuppliers = React.lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminSupplierOrders = React.lazy(() => import('./pages/admin/AdminSupplierOrders'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminCountryStats = React.lazy(() => import('./pages/admin/AdminCountryStats'));
const AdminTaxes = React.lazy(() => import('./pages/admin/AdminTaxes'));
const AdminAccounting = React.lazy(() => import('./pages/admin/AdminAccounting'));
const AdminPromotions = React.lazy(() => import('./pages/admin/AdminPromotions'));
const AdminCountryManagers = React.lazy(() => import('./pages/admin/AdminCountryManagers'));
const AdminMerchants = React.lazy(() => import('./pages/admin/AdminMerchants'));
const AdminMerchantsList = React.lazy(() => import('./pages/admin/AdminMerchantsList'));
const AdminCRM = React.lazy(() => import('./pages/admin/AdminCRM'));

// Component to capture username from URL and redirect to home with ref parameter
function ReferralRedirect() {
  const { username } = useParams();
  return <Navigate to={`/?ref=${username}`} replace />;
}

// Component to redirect /register to home while preserving ref parameter
function RegisterRedirect() {
  const search = window.location.search;
  return <Navigate to={`/${search}`} replace />;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Auto-recuperación ante despliegues nuevos (chunk desactualizado)
    const isChunkError = error?.message && (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("error loading dynamically imported module")
    );

    if (isChunkError) {
      const lastReload = sessionStorage.getItem("tei_chunk_reload");
      const now = Date.now();
      if (!lastReload || (now - parseInt(lastReload, 10)) > 15000) {
        sessionStorage.setItem("tei_chunk_reload", now.toString());
        console.warn("Detectada nueva versión desplegada. Actualizando automáticamente...");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message && (
        this.state.error.message.includes("Failed to fetch dynamically imported module") ||
        this.state.error.message.includes("Importing a module script failed") ||
        this.state.error.message.includes("Loading chunk")
      );

      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 flex-col p-4">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            {isChunkError ? "¡Nueva versión disponible!" : "¡Algo salió mal!"}
          </h1>
          <p className="text-gray-700 mb-6 text-center max-w-md">
            {isChunkError 
              ? "Hemos actualizado la plataforma con nuevas mejoras. Haz clic en el botón para cargar la última versión."
              : "Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página."}
          </p>
          <button
            onClick={() => {
              // Limpiar cachés y recargar
              if ('caches' in window) {
                caches.keys().then((keys) => {
                  keys.forEach((key) => caches.delete(key));
                });
              }
              window.location.reload();
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            {isChunkError ? "Actualizar Ahora" : "Recargar Página"}
          </button>
          {import.meta.env.DEV && (
            <details className="mt-8 p-4 bg-white rounded shadow max-w-4xl overflow-auto text-left w-full">
              <summary className="cursor-pointer font-bold text-gray-500 text-xs">Ver Detalles Técnicos</summary>
              <pre className="text-red-500 text-xs mt-2 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <PwaInstallPrompt />
      <MarketingBubbles />
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-xl">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/opportunity" element={<Opportunity />} />
          <Route path="/personal" element={<Personal />} />
          
          <Route path="/comercios-virtuales" element={<StoreDirectory />} />
          <Route path="/tienda/:slug" element={<Storefront />} />
          <Route path="/tienda/:slug/checkout" element={
            <ProtectedRoute>
              <StoreCheckout />
            </ProtectedRoute>
          } />
          <Route path="/magic-merchant/:token" element={<MagicMerchantLogin />} />
          <Route path="/usuario/:username" element={<ReferralRedirect />} />
          <Route path="/complete-registration" element={<CompleteRegistration />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/supplier-inventory/:token" element={<SupplierInventory />} />
          <Route path="/punto-de-entrega/:token" element={<PickupPointPortal />} />
          <Route path="/merchant" element={<MerchantPortal />} />

          {/* Transport Routes (Full Screen) */}
          <Route path="/transport/passenger" element={
            <ProtectedRoute>
              <PassengerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/transport/driver" element={
            <ProtectedRoute>
              <DriverRadar />
            </ProtectedRoute>
          } />
          <Route path="/transport/driver/register" element={
            <ProtectedRoute>
              <DriverRegistration />
            </ProtectedRoute>
          } />
          <Route path="/transport/driver/wallet" element={
            <ProtectedRoute>
              <DriverWallet />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <RequireAdmin>
              <AdminProvider>
                <AdminLayout />
              </AdminProvider>
            </RequireAdmin>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="sponsorship-commissions" element={<AdminSponsorshipCommissions />} />
            <Route path="qualified-ranks" element={<AdminQualifiedRanks />} />
            <Route path="honor-ranks" element={<AdminHonorRanks />} />
            <Route path="pickup-points" element={<AdminPickupPoints />} />
            <Route path="logistics" element={<AdminLogistics />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="supplier-orders" element={<AdminSupplierOrders />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="country-stats" element={<AdminCountryStats />} />
            <Route path="taxes" element={<AdminTaxes />} />
            <Route path="accounting" element={<AdminAccounting />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="country-managers" element={<AdminCountryManagers />} />
            <Route path="merchants" element={<AdminMerchants />} />
            <Route path="merchants-directory" element={<AdminMerchantsList />} />
            <Route path="transport-kyc" element={<AdminTransportKYC />} />
            <Route path="transport-drivers" element={<AdminTransportDrivers />} />
            <Route path="crm" element={<AdminCRM />} />
          </Route>

          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="store" element={<StoreView />} />
            <Route path="wallet" element={<WalletView />} />
            <Route path="education" element={<EducationView />} />
            <Route path="education/marketing" element={<DigitalMarketingCourse />} />
            <Route path="education/network" element={<NetworkBuildingCourse />} />
            <Route path="personal" element={<PersonalView />} />
            <Route path="security" element={<SecurityView />} />
            <Route path="orders" element={<UserOrders />} />
            <Route path="binary-global" element={<BinaryGlobalView />} />
            <Route path="binary-millionaire" element={<BinaryMillionaireView />} />
            <Route path="matrix" element={<MatrixView />} />
            <Route path="qualified-ranks" element={<QualifiedRanksView />} />
            <Route path="honor-ranks" element={<HonorRanksView />} />
            <Route path="directs" element={<DirectsView />} />
            <Route path="unilevel" element={<UnilevelView />} />
            <Route path="upgrade" element={<UpgradePackage />} />
            <Route path="kyc" element={<KYCValidation />} />
            <Route path="merchant-apply" element={<MerchantApply />} />
            <Route path="binary" element={<div><h2>Binary Tree</h2><p>Coming soon...</p></div>} />
          </Route>
        </Routes>
      </React.Suspense>
    </ErrorBoundary>
  );
}
