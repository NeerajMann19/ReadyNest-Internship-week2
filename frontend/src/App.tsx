/**
 * CustomerIQ - Application Root
 * Sets up routing, global context providers, and protected route hierarchies.
 */

import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Layout } from "./components/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Overview } from "./pages/Overview"
import { Customers } from "./pages/Customers"
import { Products } from "./pages/Products"
import { Analytics } from "./pages/Analytics"
import { Rankings } from "./pages/Rankings"
import { BusinessAdvisor } from "./pages/BusinessAdvisor"
import { Reports } from "./pages/Reports"
import { Settings } from "./pages/Settings"

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Shell Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/advisor" element={<BusinessAdvisor />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
