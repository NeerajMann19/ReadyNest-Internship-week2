/**
 * CustomerIQ - Sidebar Component
 * Left-side navigation layout displaying platform branding and links to all analytics workspaces.
 */

import React from "react"
import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  Trophy, 
  Sparkles, 
  FileText, 
  Settings as SettingsIcon 
} from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export const Sidebar: React.FC = () => {
  const navItems: NavItem[] = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Products", path: "/products", icon: Package },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Rankings", path: "/rankings", icon: Trophy },
    { name: "Business Advisor", path: "/advisor", icon: Sparkles },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ]

  return (
    <aside className="w-64 bg-[#1E293B] border-r border-slate-700/50 flex flex-col h-screen shrink-0 text-slate-300">
      {/* Branding Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <span className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
          <span className="text-cyan-400">Customer</span>IQ
        </span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/10 font-semibold"
                    : "hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
      
      {/* Small footer branding */}
      <div className="p-4 border-t border-slate-700/50 text-[10px] text-slate-500 text-center font-medium">
        v1.0.0 (PAX 2.0 Engine)
      </div>
    </aside>
  )
}

export default Sidebar
