import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import MatrixView from "./pages/dashboard/MatrixView";
import WalletView from "./pages/dashboard/WalletView";
import BinaryGlobalView from './pages/dashboard/BinaryGlobalView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cart" element={<CartPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<div><h2>Overview</h2><p>Welcome to your dashboard.</p></div>} />
        <Route path="matrix" element={<MatrixView />} />
        <Route path="binary-global" element={<BinaryGlobalView />} />
        <Route path="wallet" element={<WalletView />} />
        <Route path="unilevel" element={<div><h2>Unilevel Network</h2><p>Coming soon...</p></div>} />
        <Route path="binary" element={<div><h2>Binary Tree</h2><p>Coming soon...</p></div>} />
      </Route>
    </Routes>
  );
}
