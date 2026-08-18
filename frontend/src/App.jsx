import React from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MarketingBubbles from "./components/MarketingBubbles";
import PwaInstallPrompt from "./components/PwaInstallPrompt";

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
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
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
          {true && (
            <details className="mt-8 p-4 bg-white rounded shadow max-w-4xl overflow-auto text-left w-full">
              <summary className="cursor-pointer font-bold text-red-600">Ver Detalles del Error (Haga clic aquí)</summary>
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
      <PwaInstallPrompt />
      <MarketingBubbles />
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-xl">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/opportunity" element={<Opportunity />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/register" element={<RegisterRedirect />} />
          <Route path="/usuario/:username" element={<ReferralRedirect />} />
          <Route path="/complete-registration" element={<CompleteRegistration />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/supplier-inventory/:token" element={<SupplierInventory />} />
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
            <Route path="promotions" element={<AdminPromotions />} />
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
      </React.Suspense>
    </ErrorBoundary>
  );
}
