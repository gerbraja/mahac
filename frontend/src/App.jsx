import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import CompleteRegistration from "./pages/CompleteRegistration";
import DashboardLayout from "./components/layout/DashboardLayout";
import MatrixView from "./pages/dashboard/MatrixView";
import WalletView from "./pages/dashboard/WalletView";
import BinaryGlobalView from './pages/dashboard/BinaryGlobalView';
import StoreView from './pages/dashboard/StoreView';
import DashboardHome from './pages/dashboard/DashboardHome';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Login from './pages/Login';
import Personal from './pages/Personal';
import OrderConfirmation from './pages/OrderConfirmation';
import MarketingBubbles from "./components/MarketingBubbles";

// Admin imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPayments from './pages/admin/AdminPayments';

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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<div><h2>Reportes</h2><p>Próximamente...</p></div>} />
        </Route>

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="store" element={<StoreView />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="matrix" element={<MatrixView />} />
          <Route path="binary-global" element={<BinaryGlobalView />} />
          <Route path="wallet" element={<WalletView />} />
          <Route path="unilevel" element={<div><h2>Unilevel Network</h2><p>Coming soon...</p></div>} />
          <Route path="binary" element={<div><h2>Binary Tree</h2><p>Coming soon...</p></div>} />
        </Route>
      </Routes>
    </>
  );
}
