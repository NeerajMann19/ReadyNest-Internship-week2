/**
 * CustomerIQ - Rankings Dashboard Page (Real-time SaaS UI)
 * Implements animated Duolingo-style top 3 podiums and detailed leaderboard
 * lists with relative contribution bars for Customers, Products, Categories, and Countries.
 */

import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  Trophy, 
  Users, 
  ShoppingBag, 
  Globe, 
  Tag, 
  Loader2, 
  Database,
  Medal
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TopCustomer {
  rank: number
  ref: string
  name: string
  revenue: number
  orders: number
  contribution_pct: number
}

interface TopProduct {
  rank: number
  ref: string
  name: string
  revenue: number
  units_sold: number
}

interface TopCategory {
  rank: number
  category: string
  revenue: number
  share: number
}

interface TopCountry {
  rank: number
  country: string
  revenue: number
  share: number
}

interface RankingsData {
  customers: TopCustomer[]
  products: TopProduct[]
  categories: TopCategory[]
  countries: TopCountry[]
}

type TabType = "customers" | "products" | "categories" | "countries"

export const Rankings: React.FC = () => {
  const { selectedDatasetId, getRankings } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [rankings, setRankings] = useState<RankingsData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("customers")

  useEffect(() => {
    if (!selectedDatasetId) {
      setRankings(null)
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getRankings(selectedDatasetId, abortController.signal)
        setRankings(response)
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return
        }
        console.error("Failed to load rankings:", err)
        setError("Could not retrieve podium rankings. Please check dataset status.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [selectedDatasetId, getRankings])

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
          <p className="text-slate-400 text-sm">Building Gamified Leaderboards & Podiums...</p>
        </div>
      </div>
    )
  }

  if (error || !rankings) {
    return (
      <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Rankings</h3>
        <p className="text-sm text-slate-300">{error || "Failed to load leaderboards."}</p>
      </div>
    )
  }

  // Retrieve current active data array
  const getCurrentTabItems = () => {
    switch (activeTab) {
      case "customers":
        return rankings.customers.map(c => ({
          rank: c.rank,
          id: c.ref,
          title: c.name,
          subtitle: `${c.orders} orders`,
          amount: c.revenue,
          share: c.contribution_pct,
          type: "Customer"
        }))
      case "products": {
        const maxRev = rankings.products[0]?.revenue || 1
        return rankings.products.map(p => ({
          rank: p.rank,
          id: p.ref,
          title: p.name,
          subtitle: `${p.units_sold.toLocaleString()} units sold`,
          amount: p.revenue,
          share: (p.revenue / maxRev) * 100, // relative share to top seller
          type: "Product"
        }))
      }
      case "categories":
        return rankings.categories.map(cat => ({
          rank: cat.rank,
          id: `CAT-${cat.category.substring(0, 3).toUpperCase()}`,
          title: cat.category,
          subtitle: `${cat.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total sales`,
          amount: cat.revenue,
          share: cat.share,
          type: "Category"
        }))
      case "countries":
        return rankings.countries.map(c => ({
          rank: c.rank,
          id: `GEO-${c.country.substring(0, 3).toUpperCase()}`,
          title: c.country,
          subtitle: `${c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total sales`,
          amount: c.revenue,
          share: c.share,
          type: "Country"
        }))
    }
  }

  const items = getCurrentTabItems()

  // Extract Podium positions (Top 3)
  const rank1 = items.find(i => i.rank === 1)
  const rank2 = items.find(i => i.rank === 2)
  const rank3 = items.find(i => i.rank === 3)

  // Leaderboard list items (Ranks 4-10)
  const listItems = items.filter(i => i.rank > 3)

  const tabs = [
    { type: "customers", label: "Top Customers", icon: Users },
    { type: "products", label: "Top Products", icon: ShoppingBag },
    { type: "categories", label: "Top Categories", icon: Tag },
    { type: "countries", label: "Top Countries", icon: Globe }
  ] as const

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gamified Leaderboards</h1>
          <p className="text-slate-400 mt-1">Identify your top revenue-generating customers, products, categories, and countries.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <Trophy className="h-6 w-6" />
        </div>
      </div>

      {/* Pill Tab Switcher */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.type
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10 font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Podium and Leaderboard container */}
      <div className="space-y-8">
        {/* Podium Layout */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto pt-6 items-end">
          
          {/* Rank 2 (Left) */}
          <div className="order-2 md:order-1 flex flex-col items-center">
            {rank2 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full text-center space-y-3"
              >
                <div className="relative inline-block">
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-slate-300 font-bold text-xl shadow-lg">
                    {rank2.title[0]?.toUpperCase() || "C"}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-slate-400 text-slate-950 text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border border-slate-900 shadow">
                    2
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/35 h-36 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[180px] mx-auto">{rank2.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{rank2.id}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">{rank2.subtitle}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-cyan-400 font-mono font-bold text-sm">${rank2.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[9px] text-slate-500 block font-medium">{rank2.share.toFixed(1)}% share</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-32 text-slate-700 italic text-xs py-8">N/A</div>
            )}
          </div>

          {/* Rank 1 (Middle - Taller) */}
          <div className="order-1 md:order-2 flex flex-col items-center">
            {rank1 ? (
              <motion.div 
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full text-center space-y-3"
              >
                <div className="relative inline-block scale-110">
                  <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-bold text-2xl shadow-xl shadow-amber-500/5">
                    {rank1.title[0]?.toUpperCase() || "A"}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[11px] font-extrabold h-6 w-6 rounded-full flex items-center justify-center border border-slate-900 shadow">
                    <Medal className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-amber-500/25 bg-slate-900/60 h-44 flex flex-col justify-between shadow-lg shadow-cyan-950/10">
                  <div>
                    <span className="text-[9px] font-extrabold tracking-widest text-amber-400 uppercase">🏆 Category Leader</span>
                    <h4 className="text-md font-extrabold text-white truncate max-w-[200px] mx-auto mt-1">{rank1.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{rank1.id}</p>
                    <p className="text-xs text-cyan-300 font-semibold mt-1.5">{rank1.subtitle}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-cyan-400 font-mono font-extrabold text-md">${rank1.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">{rank1.share.toFixed(1)}% share</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-32 text-slate-700 italic text-xs py-8">N/A</div>
            )}
          </div>

          {/* Rank 3 (Right) */}
          <div className="order-3 flex flex-col items-center">
            {rank3 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full text-center space-y-3"
              >
                <div className="relative inline-block">
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-amber-600 font-bold text-xl shadow-lg">
                    {rank3.title[0]?.toUpperCase() || "B"}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-amber-700 text-slate-950 text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border border-slate-900 shadow">
                    3
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/35 h-36 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[180px] mx-auto">{rank3.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{rank3.id}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">{rank3.subtitle}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-cyan-400 font-mono font-bold text-sm">${rank3.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[9px] text-slate-500 block font-medium">{rank3.share.toFixed(1)}% share</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-32 text-slate-700 italic text-xs py-8">N/A</div>
            )}
          </div>

        </div>

        {/* Leaderboard Table (Ranks 4-10) */}
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/40 max-w-4xl mx-auto shadow-lg">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/20">
            <h3 className="text-sm font-semibold text-white">Full Leaderboard Positions</h3>
          </div>
          <div className="divide-y divide-slate-800">
            <AnimatePresence mode="wait">
              {listItems.length > 0 ? (
                listItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="flex flex-col sm:flex-row justify-between sm:items-center px-6 py-4 hover:bg-slate-800/20 transition-all gap-4"
                  >
                    {/* Identity */}
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-bold text-slate-500 w-6 text-sm text-center">#{item.rank}</span>
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-sm font-semibold text-white truncate max-w-[280px]">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">{item.id} | {item.subtitle}</p>
                      </div>
                    </div>

                    {/* Relative Progress bar */}
                    <div className="hidden md:block w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, item.share)}%` }} />
                    </div>

                    {/* Financial details */}
                    <div className="text-right flex sm:flex-col justify-between items-center sm:items-end gap-2 sm:gap-0 font-medium">
                      <span className="text-sm font-bold text-white font-mono">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/10">
                        {item.share.toFixed(1)}% share
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-slate-500 italic text-sm">
                  No secondary entries to display.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rankings

