/**
 * CustomerIQ - Settings Page
 * Customization panel for profile setup, multi-tenant roles, and API configuration.
 */

import React from "react"
import { Settings as SettingsIcon, Save, Key, Shield } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export const Settings: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure your personal preferences, tenant details, and security roles.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <SettingsIcon className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-xl space-y-4 md:col-span-2">
          <h3 className="text-md font-semibold text-white border-b border-slate-700/50 pb-2">Profile Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Email Address</label>
              <input 
                type="email" 
                disabled 
                value={user?.email || "loading@example.com"} 
                className="w-full mt-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Tenant Scope</label>
              <input 
                type="text" 
                disabled 
                value="Global Workspace" 
                className="w-full mt-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-slate-700/50">
              <Save className="h-4 w-4" />
              Save Preferences
            </button>
          </div>
        </div>

        {/* Roles and Security Widget */}
        <div className="glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <h3 className="text-md font-semibold text-white">Security & Role</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Current Role</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 uppercase border border-cyan-500/20">
                  {user?.role || "user"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your role dictates access across workspace tables and admin panels. Administrators can monitor upload traffic and manage platform tenants.
              </p>
            </div>
          </div>

          <button className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 rounded-lg transition-colors border border-slate-700/50 mt-6">
            <Key className="h-4 w-4" />
            Manage API Credentials
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
