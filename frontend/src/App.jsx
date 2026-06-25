import React from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MatrixView from "./pages/dashboard/MatrixView";
import WalletView from "./pages/dashboard/WalletView";
import BinaryGlobalView from './pages/dashboard/BinaryGlobalView';
import BinaryMillionaireView from './pages/dashboard/BinaryMillionaireView';
import UnilevelView from './pages/dashboard/UnilevelView';
import DirectsView from './pages/dashboard/DirectsView';
import EducationView from './pages/dashboard/EducationView';
import DigitalMarketingCourse from './pages/dashboard/DigitalMarketingCourse';
import NetworkBuildingCourse from './pages/dashboard/NetworkBuildingCourse';
import PersonalView from './pages/dashboard/PersonalView';
import SecurityView from './pages/dashboard/SecurityView';
import StoreView from './pages/dashboard/StoreView';
import DashboardHome from './pages/dashboard/DashboardHome';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Personal from './pages/Personal';
import OrderConfirmation from './pages/OrderConfirmation';
import QualifiedRanksView from './pages/dashboard/QualifiedRanksView';
import HonorRanksView from './pages/dashboard/HonorRanksView';
import MarketingBubbles from "./components/MarketingBubbles";
import UserOrders from './components/UserOrders';
import UpgradePackage from './pages/dashboard/UpgradePackage';
import KYCValidation from './pages/dashboard/KYCValidation';
import PickupPointPortal from './pages/PickupPointPortal';

// Lazy imports for heavy pages
const CompleteRegistration = React.lazy(() => import("./pages/CompleteRegistration"));
const Opportunity = React.lazy(() => import('./pages/Opportunity'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const SupplierInventory = React.lazy(() => import('./pages/SupplierInventory'));

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 flex-col p-4">
          <h1 className="text-3xl font-bold text-red-600 mb-4">¡Algo salió mal!</h1>
          <p className="text-gray-700 mb-6 text-center max-w-md">
            Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recargar Página
          </button>
          {import.meta.env.DEV && (
            <details className="mt-8 p-4 bg-white rounded shadow max-w-4xl overflow-auto text-left">
              <summary className="cursor-pointer font-bold text-gray-800">Detalles del Error (Solo Desarrollo)</summary>
              <pre className="text-red-500 text-sm mt-2 whitespace-pre-wrap">
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
      <MarketingBubbles />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/opportunity" element={<React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-xl">Cargando...</div>}><Opportunity /></React.Suspense>} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route path="/usuario/:username" element={<ReferralRedirect />} />
        <Route path="/complete-registration" element={<React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-xl">Cargando...</div>}><CompleteRegistration /></React.Suspense>} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-xl">Cargando...</div>}><Checkout /></React.Suspense>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/supplier-inventory/:token" element={<React.Suspense fallback={<div>Cargando...</div>}><SupplierInventory /></React.Suspense>} />
        <Route path="/punto-de-entrega/:token" element={<PickupPointPortal />} />

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
          <Route path="binary" element={<div><h2>Binary Tree</h2><p>Coming soon...</p></div>} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
