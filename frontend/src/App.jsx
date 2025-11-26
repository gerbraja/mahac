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

// Component to capture username from URL and redirect to home with ref parameter
function ReferralRedirect() {
  const { username } = useParams();
  return <Navigate to={`/?ref=${username}`} replace />;
}

import MarketingBubbles from "./components/MarketingBubbles";

import AdminDashboard from './pages/dashboard/AdminDashboard';
import SimpleAdmin from './pages/SimpleAdmin';
import Login from './pages/Login';

export default function App() {
  return (
    <>
      <MarketingBubbles />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<SimpleAdmin />} />
        <Route path="/usuario/:username" element={<ReferralRedirect />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/cart" element={<CartPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div><h2>Overview</h2><p>Welcome to your dashboard.</p></div>} />
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
