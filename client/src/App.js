import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import POSPage from "./pages/POSPage";
import DeployPage from "./pages/DeployPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import SideNav from "./components/SideNav";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("sb_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("sb_user", JSON.stringify(user));
  }, [user]);

  async function handleLogout() {
    try {
      await axios.post("/api/logout", {}, { withCredentials: true });
    } catch (err) {
      // ignore
    }
    setUser(null);
    localStorage.removeItem("sb_user");
    navigate("/login");
  }

  function handleLoginSuccess(nextUser) {
    setUser(nextUser);
    navigate("/pos");
  }

  const showNav = Boolean(user);

  return (
    <div className="app-shell side-layout">
      {showNav && <SideNav user={user} onLogout={handleLogout} />}
      <div className="app-body">
        <Routes>
          <Route path="/pos" element={user ? <POSPage /> : <Navigate to="/login" replace />} />
          <Route path="/deploy" element={user ? <DeployPage /> : <Navigate to="/login" replace />} />
          <Route path="/products" element={user ? <ProductsPage /> : <Navigate to="/login" replace />} />
          <Route path="/orders" element={user ? <OrdersPage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage onLogin={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to={user ? "/pos" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
