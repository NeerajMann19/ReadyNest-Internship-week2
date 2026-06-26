/**
 * CustomerIQ - Protected Layout Component
 * Restricts access to authenticated users and wraps pages inside the Sidebar + Topbar grid layout.
 */

import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export const Layout: React.FC = () => {
  const { user, token, loading } = useAuth()

  // Display page loader while recovering stored session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-10 h-10">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700/50 rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
          Recovering Session...
        </p>
      </div>
    )
  }

  // Redirect to Login if session credentials do not exist
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden text-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
