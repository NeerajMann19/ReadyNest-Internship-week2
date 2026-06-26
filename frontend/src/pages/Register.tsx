/**
 * CustomerIQ - Registration Page
 * Allows new tenants to register their profile credentials.
 */

import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Lock, Mail, AlertTriangle, UserCheck, Shield } from "lucide-react"

export const Register: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await register(email, password, role)
      setSuccess(true)
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        "Failed to register. Email may already be in use."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              <span className="text-cyan-400">Customer</span>IQ
            </h1>
            <p className="text-slate-400 text-sm">Create your multi-tenant workspace account</p>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg flex items-start gap-3 text-sm">
              <UserCheck className="h-5 w-5 shrink-0" />
              <p>Account registered successfully! Redirecting to login...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Security Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                >
                  <option value="user">Business User</option>
                  <option value="admin">Platform Owner (Admin)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || success}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
