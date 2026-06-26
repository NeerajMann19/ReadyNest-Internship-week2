/**
 * CustomerIQ - Topbar Component
 * Header navigation bar displaying the tenant scope, current user indicator, and logout buttons.
 */

import React from "react"
import { useAuth } from "../context/AuthContext"
import { LogOut, User, Shield, Database } from "lucide-react"

export const Topbar: React.FC = () => {
  const { user, logout, datasets, selectedDatasetId, setSelectedDatasetId } = useAuth()

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedDatasetId(val ? Number(val) : null)
  }

  return (
    <header className="h-16 bg-[#1E293B] border-b border-slate-700/50 flex items-center justify-between px-8 text-slate-300">
      {/* Workspace Indicator */}
      <div className="flex items-center gap-3">
        <Database className="h-4.5 w-4.5 text-cyan-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dataset:</span>
        {datasets.length > 0 ? (
          <select
            value={selectedDatasetId || ""}
            onChange={handleDatasetChange}
            className="bg-slate-900 border border-slate-700/60 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">-- No Active Dataset --</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id} disabled={d.upload_status !== "completed"}>
                {d.name} {d.row_count ? `(${d.row_count.toLocaleString()} rows)` : ""} {d.upload_status !== "completed" ? `[${d.upload_status}]` : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-slate-500 italic">No datasets uploaded</span>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* User Identity and Role Badge */}
        <div className="flex items-center gap-3 border-r border-slate-700/50 pr-4">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-white">{user?.email || "loading..."}</span>
            <span className="text-[10px] text-slate-400 capitalize mt-0.5 flex items-center gap-1 justify-end">
              <Shield className="h-2.5 w-2.5 text-cyan-400" />
              {user?.role || "user"}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 hover:text-white text-slate-400 text-sm font-semibold transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </header>
  )
}

export default Topbar
