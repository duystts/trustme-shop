import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage } from "./pages/AdminPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { Layout } from "./shared/Layout";
import { initAuth } from "./services/authApi";
import "./styles.css";

// Restore JWT token from localStorage on startup
initAuth();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Admin — uses its own full-screen layout */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Auth — uses Layout (so AI widget appears) */}
        <Route
          path="/auth/login"
          element={
            <Layout>
              <AuthPage />
            </Layout>
          }
        />

        {/* Client pages */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/"              element={<HomePage />} />
                <Route path="/home"          element={<HomePage />} />
                <Route path="/products/:id"  element={<ProductDetailPage />} />
                <Route path="/checkout"      element={<CheckoutPage />} />
                <Route path="/orders"        element={<OrderHistoryPage />} />
                <Route path="/profile"       element={<ProfilePage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);


