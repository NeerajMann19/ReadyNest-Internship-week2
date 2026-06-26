/**
 * CustomerIQ - Analytics Dashboard Page (Real-time SaaS UI)
 * Visualizes monthly sales growth curves, seasonal revenue partitions,
 * and purchase behaviors (weekday transactions & hourly peaks) using Recharts.
 */

import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUp, 
  Clock, 
  Calendar,
  Loader2, 
  Database
} from "lucide-react"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell
} from "recharts"
import { motion } from "framer-motion"

interface RevenueTrend {
  month: string
  revenue: number
  orders: number
}

interface HourDistribution {
  hour: number
  orders: number
}

interface DayDistribution {
  day: string
  orders: number
}

interface AnalyticsData {
  sales: {
    revenue_trends: RevenueTrend[]
    monthly_growth: number
    quarterly_growth: number
    seasonal_distribution: Record<string, number>
  }
  behavior: {
    hours: HourDistribution[]
    days: DayDistribution[]
    peak_hour: number
    peak_day: string
  }
}

const COLORS = ["#06B6D4", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"]

export const Analytics: React.FC = () => {
  const { selectedDatasetId, getAnalytics } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

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
        console.error("Failed to load sales analytics:", err)
        setError("Could not retrieve sales analytics metrics. Please check dataset status.")
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
          <p className="text-slate-400 text-sm">Analyzing Transaction Logs & Purchasing Trends...</p>
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

  const { sales, behavior } = analytics

  // Parse hourly distribution for bar charts, sorting by hour asc
  const hourlyData = [...behavior.hours]
    .sort((a, b) => a.hour - b.hour)
    .map(h => ({
      hour: `${h.hour}:00`,
      orders: h.orders
    }))

  // Parse seasonal distribution
  const seasonalData = Object.entries(sales.seasonal_distribution).map(([season, revenue]) => ({
    season,
    revenue
  }))

  const suffix = behavior.peak_hour >= 12 ? "PM" : "AM"
  const formattedPeakHour = behavior.peak_hour > 12 
    ? behavior.peak_hour - 12 
    : (behavior.peak_hour === 0 ? 12 : behavior.peak_hour)

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sales & Behavior Analytics</h1>
          <p className="text-slate-400 mt-1">Deep-dive customer behavior and sales curves analysis.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <BarChart3 className="h-6 w-6" />
        </div>
      </div>

      {/* Growth and Peak KPI summaries */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 shadow-md flex items-center gap-4"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MoM Sales Growth</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {sales.monthly_growth >= 0 ? "+" : ""}
              {sales.monthly_growth.toFixed(1)}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Last active month vs previous</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 shadow-md flex items-center gap-4"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <ArrowUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">QoQ Growth</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {sales.quarterly_growth >= 0 ? "+" : ""}
              {sales.quarterly_growth.toFixed(1)}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Last 3 months vs previous 3</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 shadow-md flex items-center gap-4"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Purchase Day</p>
            <h3 className="text-2xl font-bold text-white mt-1 capitalize">{behavior.peak_day}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Day with maximum transactions</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-panel p-5 rounded-xl border border-slate-700/40 shadow-md flex items-center gap-4"
        >
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Purchase Hour</p>
            <h3 className="text-2xl font-bold text-white mt-1">{formattedPeakHour} {suffix}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Hour with peak purchase intent</p>
          </div>
        </motion.div>
      </div>

      {/* Core Revenue Trend */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <h3 className="text-md font-semibold text-white">Monthly Sales Growth Curve</h3>
        {sales.revenue_trends.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.revenue_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Revenue"]}
                  labelClassName="text-white font-bold"
                />
                <Area type="monotone" dataKey="revenue" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-xs italic text-center py-20">Revenue trend data not available.</p>
        )}
      </div>

      {/* Grid of secondary charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hourly distribution */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Purchasing Hour Analysis</h3>
          {hourlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    labelClassName="text-white font-bold"
                    itemStyle={{ color: "#06B6D4" }}
                  />
                  <Bar dataKey="orders" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-20">Hourly activity logs missing.</p>
          )}
        </div>

        {/* Day of week distribution */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="text-md font-semibold text-white">Purchase Activity by Day of Week</h3>
          {behavior.days.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={behavior.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                    labelClassName="text-white font-bold"
                    itemStyle={{ color: "#3B82F6" }}
                  />
                  <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {behavior.days.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic text-center py-20">Weekday activity logs missing.</p>
          )}
        </div>
      </div>

      {/* Seasonal Revenue Share */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <h3 className="text-md font-semibold text-white">Seasonal Revenue Performance</h3>
        {seasonalData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155/30" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis dataKey="season" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", borderRadius: "8px" }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]}>
                  {seasonalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-xs italic text-center py-20">Seasonal data missing.</p>
        )}
      </div>
    </div>
  )
}

export default Analytics

