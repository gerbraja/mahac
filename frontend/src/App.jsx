import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import CompleteRegistration from "./pages/CompleteRegistration";
import DashboardLayout from "./components/layout/DashboardLayout";
import MatrixView from "./pages/dashboard/MatrixView";
import WalletView from "./pages/dashboard/WalletView";
import BinaryGlobalView from './pages/dashboard/BinaryGlobalView';
import BinaryMillionaireView from './pages/dashboard/BinaryMillionaireView';
import UnilevelView from './pages/dashboard/UnilevelView';
import DirectsView from './pages/dashboard/DirectsView';
import EducationView from './pages/dashboard/EducationView';
import PersonalView from './pages/dashboard/PersonalView';
import SecurityView from './pages/dashboard/SecurityView';
import StoreView from './pages/dashboard/StoreView';
import DashboardHome from './pages/dashboard/DashboardHome';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Login from './pages/Login';
import Personal from './pages/Personal';
import OrderConfirmation from './pages/OrderConfirmation';
import QualifiedRanksView from './pages/dashboard/QualifiedRanksView';
import HonorRanksView from './pages/dashboard/HonorRanksView';
import MarketingBubbles from "./components/MarketingBubbles";


// Admin imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSponsorshipCommissions from './pages/admin/AdminSponsorshipCommissions';
import AdminQualifiedRanks from './pages/admin/AdminQualifiedRanks';
import AdminHonorRanks from './pages/admin/AdminHonorRanks';
import RequireAdmin from './components/auth/RequireAdmin';

// Component to capture username from URL and redirect to home with ref parameter
function ReferralRedirect() {
  const { username } = useParams();
  return <Navigate to={`/?ref=${username}`} replace />;
}

export default function App() {
  return (
    <>
      <MarketingBubbles />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/usuario/:username" element={<ReferralRedirect />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="sponsorship-commissions" element={<AdminSponsorshipCommissions />} />
          <Route path="qualified-ranks" element={<AdminQualifiedRanks />} />
          <Route path="honor-ranks" element={<AdminHonorRanks />} />
          <Route path="reports" element={<div><h2>Reportes</h2><p>Próximamente...</p></div>} />
        </Route>

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="store" element={<StoreView />} />
          <Route path="wallet" element={<WalletView />} />
          <Route path="education" element={<EducationView />} />
          <Route path="personal" element={<PersonalView />} />
          <Route path="security" element={<SecurityView />} />
          <Route path="binary-global" element={<BinaryGlobalView />} />
          <Route path="binary-millionaire" element={<BinaryMillionaireView />} />
          <Route path="matrix" element={<MatrixView />} />
          <Route path="qualified-ranks" element={<QualifiedRanksView />} />
          <Route path="honor-ranks" element={<HonorRanksView />} />
          <Route path="directs" element={<DirectsView />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="unilevel" element={<UnilevelView />} />
          <Route path="binary" element={<div><h2>Binary Tree</h2><p>Coming soon...</p></div>} />
        </Route>
      </Routes>
    </>
  );
}
