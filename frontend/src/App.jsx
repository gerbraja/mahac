import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import UnilevelDashboard from "./components/unilevel/UnilevelDashboard";
import BinaryDashboard from "./components/binary/BinaryDashboard";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/unilevel" element={<UnilevelDashboard />} />
  <Route path="/binary" element={<BinaryDashboard />} />
      </Routes>
    </>
  );
}
