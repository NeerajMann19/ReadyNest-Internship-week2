/**
 * CustomerIQ - Customers Directory Page (Real-time SaaS UI)
 * Visualizes customer metrics, age/gender demographics, regional distributions,
 * and a searchable top customers leaderboard using Recharts and Framer Motion.
 */

import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  Users, 
  Search, 
  Globe, 
  Percent, 
  Activity, 
  CreditCard, 
  UserCheck, 
  Loader2, 
  Database
} from "lucide-react"
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid
} from "recharts"
import { motion } from "framer-motion"

interface CustomerMetrics {
  total_customers: number
  new_customers: number
  returning_customers: number
  returning_rate: number
  clv: number
  average_spend: number
  age_distribution: Record<string, number>
  gender_distribution: Record<string, number>
}

interface GeoCountry {
  country: string
  revenue: number
  orders: number
  share: number
}

interface GeoRegion {
  region: string
  revenue: number
  orders: number
  share: number
}

interface AnalyticsData {
  customer: CustomerMetrics
  geo: {
    countries: GeoCountry[]
    regions: GeoRegion[]
  }
}

interface RankedCustomer {
  rank: number
  ref: string
  name: string
  revenue: number
  orders: number
  contribution_pct: number
}

interface RankingsData {
  customers: RankedCustomer[]
}

const COLORS = ["#06B6D4", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"]

export const Customers: React.FC = () => {
  const { selectedDatasetId, getAnalytics, getRankings } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [rankings, setRankings] = useState<RankingsData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!selectedDatasetId) {
      setAnalytics(null)
      setRankings(null)
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [anData, rankData] = await Promise.all([
          getAnalytics(selectedDatasetId, abortController.signal),
          getRankings(selectedDatasetId, abortController.signal)
        ])
        setAnalytics(anData)
        setRankings(rankData)
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return
        }
        console.error("Failed to load customer analytics:", err)
        setError("Could not retrieve customer details. Please verify dataset is fully processed.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [selectedDatasetId, getAnalytics, getRankings])

  // Empty State
  if (!selectedDatasetId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl max-w-md border border-slate-700/50 flex flex-col items-center space-y-4 shadow-2xl"
        >
          <div className="p-4 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
            <Database className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">No Active Dataset Selected</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Please select an uploaded business dataset in the header dropdown or go to the Overview tab to upload a new spreadsheet.
          </p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Analyzing Customer Demographics & Behavior...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics || !rankings) {
    return (
      <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Analytics</h3>
        <p className="text-sm text-slate-300">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const { customer, geo } = analytics

  // Parse age distribution for Recharts
  const ageData = Object.entries(customer.age_distribution).map(([group, count]) => ({
    group,
    count
  }))

  // Parse gender distribution for Recharts
  const genderData = Object.entries(customer.gender_distribution).map(([gender, count]) => ({
    name: gender === "M" ? "Male" : gender === "F" ? "Female" : gender,
    value: count
  }))

  // Filter rankings by search term
  const filteredCustomers = rankings.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.ref.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Customers Workspace</h1>
        <p className="text-slate-400 mt-1">Audit customer segments, retention ratios, and geographic distributions in real-time.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 flex items-center gap-4 shadow-md"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <h3 className="text-2xl font-bold text-white mt-1">{customer.total_customers.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Mapped unique profiles</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 flex items-center gap-4 shadow-md"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Returning Rate</p>
            <h3 className="text-2xl font-bold text-white mt-1">{customer.returning_rate.toFixed(1)}%</h3>
            <div className="w-24 bg-slate-800 rounded-full h-1 mt-2">
              <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${customer.returning_rate}%` }} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 flex items-center gap-4 shadow-md"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Repeat Buyers</p>
            <h3 className="text-2xl font-bold text-white mt-1">{customer.returning_customers.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">{customer.new_customers.toLocaleString()} new acquisitions</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 flex items-center gap-4 shadow-md"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Lifetime Value</p>
            <h3 className="text-2xl font-bold text-white mt-1">${customer.clv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium">${customer.average_spend.toFixed(2)} Avg order value</p>
          </div>
        </motion.div>
      </div>

      {/* Demographics Visualization Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Age Groups Bar Chart */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Age Bracket Distribution</h3>
          {ageData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
                  <XAxis dataKey="group" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    labelClassName="text-white font-bold"
                    itemStyle={{ color: "#06B6D4" }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]}>
                    {ageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? "#06B6D4" : "#3B82F6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-20">Age data not available.</p>
          )}
        </div>

        {/* Gender Distribution Pie Chart */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Gender Split Ratios</h3>
          {genderData.length > 0 ? (
            <div className="h-64 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-300 text-xs font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-20">Gender data not available.</p>
          )}
        </div>
      </div>

      {/* Split Geographic Markets & Top Customer Directory */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Geo Markets */}
        <div className="glass-panel p-6 rounded-xl space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-white border-b border-slate-700/50 pb-3 flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-cyan-400" />
              Regional Contribution
            </h3>
            <div className="mt-4 space-y-4 overflow-y-auto max-h-[350px] pr-1">
              {geo.countries.length > 0 ? (
                geo.countries.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-xs pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white text-sm">{c.country}</span>
                      <span className="text-slate-400 block">{c.orders.toLocaleString()} orders</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">${c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="text-cyan-400 font-semibold">{c.share.toFixed(1)}% share</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic">Geographic markets missing.</p>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500">
            * Geographic distribution derived from database profiles
          </div>
        </div>

        {/* Right Side: Customers Table */}
        <div className="glass-panel p-6 rounded-xl space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/50 pb-3">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Percent className="h-4.5 w-4.5 text-cyan-400" />
              Top Customer Directory
            </h3>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by name or reference ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-800/20">
                  <th className="px-4 py-2 text-center w-12">Rank</th>
                  <th className="px-4 py-2">ID Ref</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 text-right">Orders</th>
                  <th className="px-4 py-2 text-right">Contribution %</th>
                  <th className="px-4 py-2 text-right">Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.ref} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-500">#{c.rank}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">{c.ref}</td>
                      <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-right">{c.orders}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{c.contribution_pct.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-white">${c.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 italic">No matching customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customers

