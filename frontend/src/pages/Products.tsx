/**
 * CustomerIQ - Products Catalog Page (Real-time SaaS UI)
 * Analyzes and visualizes product category revenue shares, unit velocities,
 * and top/bottom selling catalog item tables using Recharts and Framer Motion.
 */

import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  Package, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  Database
} from "lucide-react"
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts"
import { motion } from "framer-motion"

interface TopSellingProduct {
  ref: string
  name: string
  units: number
  revenue: number
}

interface LowestSellingProduct {
  ref: string
  name: string
  units: number
  revenue: number
}

interface CategoryRanking {
  category: string
  revenue: number
  units: number
  share: number
}

interface AnalyticsData {
  product: {
    top_selling_products: TopSellingProduct[]
    lowest_selling_products: LowestSellingProduct[]
    category_rankings: CategoryRanking[]
    total_product_revenue: number
  }
}

const COLORS = ["#06B6D4", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"]

export const Products: React.FC = () => {
  const { selectedDatasetId, getAnalytics } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState<"top" | "lowest">("top")

  useEffect(() => {
    if (!selectedDatasetId) {
      setAnalytics(null)
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getAnalytics(selectedDatasetId, abortController.signal)
        setAnalytics(response)
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return
        }
        console.error("Failed to load product analytics:", err)
        setError("Could not retrieve product metrics. Please verify dataset is fully loaded.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [selectedDatasetId, getAnalytics])

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
          <p className="text-slate-400 text-sm">Analyzing Product Catalog & Stock Velocity...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Analytics</h3>
        <p className="text-sm text-slate-300">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const { product } = analytics
  const categories = product.category_rankings

  // Calculate total units sold
  const totalUnitsSold = categories.reduce((sum, c) => sum + c.units, 0)

  // Top Category Details
  const topCategory = categories[0] || { category: "N/A", share: 0, revenue: 0 }
  
  // Bottom Category Details
  const bottomCategory = categories.length > 1 ? categories[categories.length - 1] : { category: "N/A", share: 0 }

  // Pie chart data
  const pieData = categories.map((c) => ({
    name: c.category,
    value: c.revenue
  }))

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Products Catalog</h1>
          <p className="text-slate-400 mt-1">Track catalog performance, sales velocity, and category department statistics.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <Package className="h-6 w-6" />
        </div>
      </div>

      {/* Grid summarizing catalog KPIs */}
      <div className="grid gap-5 md:grid-cols-3">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-6 rounded-xl border border-slate-700/40 shadow-md space-y-2"
        >
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Top Performing Category</p>
          <h3 className="text-2xl font-bold text-white">{topCategory.category}</h3>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <ArrowUp className="h-3.5 w-3.5" />
            {topCategory.share.toFixed(1)}% of total catalog revenue
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-6 rounded-xl border border-slate-700/40 shadow-md space-y-2"
        >
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sales Velocity</p>
          <h3 className="text-2xl font-bold text-white">{totalUnitsSold.toLocaleString()} Units</h3>
          <p className="text-xs text-cyan-400 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            Total items shipped across departments
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-6 rounded-xl border border-slate-700/40 shadow-md space-y-2"
        >
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Lowest Revenue Category</p>
          <h3 className="text-2xl font-bold text-white">{bottomCategory.category}</h3>
          <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
            <ArrowDown className="h-3.5 w-3.5" />
            {bottomCategory.share.toFixed(1)}% revenue share
          </p>
        </motion.div>
      </div>

      {/* Category Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart: Revenue Share */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Department Revenue Share</h3>
          {pieData.length > 0 ? (
            <div className="h-64 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Revenue"]}
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
            <p className="text-slate-500 text-xs italic text-center py-20">Category rankings missing.</p>
          )}
        </div>

        {/* Bar Chart: Units Sold */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Units Shipped per Category</h3>
          {categories.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    labelClassName="text-white font-bold"
                    itemStyle={{ color: "#06B6D4" }}
                  />
                  <Bar dataKey="units" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-20">Category data missing.</p>
          )}
        </div>
      </div>

      {/* Product List Tables */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-md font-semibold text-white">Product Catalog Leaderboard</h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle between best selling stock items and items with low order volume.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab("top")}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === "top" ? "bg-cyan-500 text-slate-900 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Top Performers
            </button>
            <button 
              onClick={() => setActiveTab("lowest")}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === "lowest" ? "bg-cyan-500 text-slate-900 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Lowest Selling
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 w-28">Ref</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-center">Units Sold</th>
                <th className="px-6 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
              {activeTab === "top" ? (
                product.top_selling_products.map((p) => (
                  <tr key={p.ref} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{p.ref}</td>
                    <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                        {p.units} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono">
                      ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                product.lowest_selling_products.map((p) => (
                  <tr key={p.ref} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{p.ref}</td>
                    <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-500/20">
                        {p.units} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono">
                      ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Products

