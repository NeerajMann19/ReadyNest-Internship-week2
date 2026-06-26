/**
 * CustomerIQ - Business Advisor & Opportunity Score Page (Real-time SaaS UI)
 * Evaluates business dataset health, renders radial SVG gauge rings for growth areas,
 * and streams color-coded tactical action items based on rule-based advisory metrics.
 */

import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  Sparkles, 
  ArrowRight, 
  Flame, 
  HeartHandshake, 
  Globe, 
  Tag, 
  TrendingUp, 
  Loader2, 
  Database
} from "lucide-react"
import { motion } from "framer-motion"

interface Recommendation {
  category: string
  title: string
  description: string
  action: string
  impact: string
}

interface ScoreDetail {
  score: number
  explanation: string
}

interface RecommendationsData {
  recommendations: Recommendation[]
  opportunity_scores: {
    customer_growth: ScoreDetail
    product_growth: ScoreDetail
    geographic_growth: ScoreDetail
    category_growth: ScoreDetail
    overall_score: number
  }
}

const actionGuides: Record<string, { title: string; explanation: string; steps: string[] }> = {
  "Configure re-engagement campaign": {
    title: "Re-Engagement Campaign Setup",
    explanation: "Win back inactive customers by targeting them with specialized email campaigns.",
    steps: [
      "Export your customer list from the Customers tab, filtering for customers with 1 order.",
      "Import the list into your email marketing platform (e.g. Klaviyo, Mailchimp) as a 'Leaky Retention' segment.",
      "Design a win-back email sequence offering a 15% discount code valid for 14 days.",
      "Set up automatic triggers to send email 1 at 30 days post-purchase, and email 2 at 60 days post-purchase."
    ]
  },
  "Set up referral loop": {
    title: "Referral Program Setup Guide",
    explanation: "Turn your most loyal repeat buyers into brand advocates.",
    steps: [
      "Select a referral software provider (e.g. ReferralCandy, Lootly).",
      "Configure a double-sided incentive: Give 10% off to the new customer, and reward the advocate with a $10 store credit upon successful purchase.",
      "Promote the referral program on the order confirmation page and in post-purchase confirmation emails.",
      "Monitor the 'Repeat Customer Rate' in CustomerIQ to track referral impact over time."
    ]
  },
  "Research category catalog": {
    title: "Category Expansion Research Guide",
    explanation: "Expand adjacent categories to reduce reliance on a single high-concentration product class.",
    steps: [
      "Navigate to the Products tab in CustomerIQ and sort by Category.",
      "Identify the secondary categories that show healthy average prices but low overall transaction count.",
      "Reach out to suppliers to source 3-5 new trial SKUs in those underperforming categories.",
      "Run targeted cross-category bundling promotions to expose existing customers to the new arrivals."
    ]
  },
  "Create bundle discounts": {
    title: "Product Bundling Guide",
    explanation: "Increase your Average Order Value (AOV) by packing related products.",
    steps: [
      "Identify products in your top category that are frequently bought together.",
      "Create a bundle SKU in your e-commerce platform at a 10% discount compared to purchasing separately.",
      "Promote the bundle on the product details pages using 'Frequently Bought Together' widgets.",
      "Track the AOV metric in CustomerIQ to ensure cart values are trending upward."
    ]
  },
  "Review localization options": {
    title: "International Expansion Roadmap",
    explanation: "Expand into secondary countries to scale beyond your saturated home market.",
    steps: [
      "Review the Geographic tab in CustomerIQ to identify the top 3 international countries generating organic sales.",
      "Partner with a cross-border shipping consolidator (e.g. DHL Express, Passport Shipping) to offer localized duties-paid shipping (DDP).",
      "Translate high-traffic landing pages and product descriptions into the primary language of those target regions.",
      "Allocate 10% of your current digital advertising budget to localized search campaigns in these new countries."
    ]
  },
  "Optimize ad targets": {
    title: "Geo-Targeted Advertising Guide",
    explanation: "Optimize ad spend by focusing on regions with proven high transaction volume.",
    steps: [
      "Access your Google Ads or Meta Ads manager.",
      "Adjust geographic targeting settings to focus ad delivery on the top regions identified in CustomerIQ's Geographic Analytics.",
      "Create regional ad copy using local terms, colloquialisms, or location-specific promotions.",
      "Exclude low-performing regions to immediately reduce budget waste."
    ]
  },
  "Configure off-peak newsletter": {
    title: "Off-Peak Marketing Configuration Guide",
    explanation: "Reach night-owl buyers during hours of high purchase density.",
    steps: [
      "Examine the peak purchase hours chart in CustomerIQ's Behavioral Analytics to identify secondary peaks (e.g. 9 PM - Midnight).",
      "Configure your email marketing tool's scheduling settings to send newsletters 30 minutes before this peak window.",
      "Craft copy tailored to nighttime shopping (e.g. 'Late Night Special: Free Shipping for the Next 4 Hours').",
      "Monitor the hourly conversion rate to verify the click-to-order uplift."
    ]
  },
  "Plan target ad campaigns": {
    title: "Peak-Time Advertising Dayparting",
    explanation: "Maximize conversion probability by aligning ad delivery with peak shopping hours.",
    steps: [
      "Go to your ad campaign settings and select the 'Dayparting' or 'Ad Scheduling' menu.",
      "Map your ad delivery schedule to the top 3 peak hours identified in CustomerIQ's Behavioral tab.",
      "Increase bids by 15-20% during these high-converting hours to capture maximum search share.",
      "Lower bids or pause campaigns during known dead hours (e.g., 2 AM - 6 AM) to preserve ad budget."
    ]
  }
}

export const BusinessAdvisor: React.FC = () => {
  const { selectedDatasetId, getRecommendations } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [data, setData] = useState<RecommendationsData | null>(null)
  const [selectedActionGuide, setSelectedActionGuide] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDatasetId) {
      setData(null)
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getRecommendations(selectedDatasetId, abortController.signal)
        setData(response)
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return
        }
        console.error("Failed to load recommendations:", err)
        setError("Could not retrieve business recommendations. Please check dataset status.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [selectedDatasetId, getRecommendations])

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
          <p className="text-slate-400 text-sm">Evaluating Growth Channels & Opportunity Index...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Recommendations</h3>
        <p className="text-sm text-slate-300">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const { recommendations, opportunity_scores } = data
  const overall = opportunity_scores.overall_score

  // Calculate SVG stroke parameters for circular gauges
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (overall / 100) * circumference

  // Helper to map category to icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "customer retention":
        return HeartHandshake
      case "category growth":
        return Tag
      case "geographic growth":
        return Globe
      case "marketing timing":
        return Flame
      default:
        return Sparkles
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 stroke-emerald-400 fill-emerald-500/5"
    if (score >= 50) return "text-cyan-400 stroke-cyan-400 fill-cyan-500/5"
    return "text-amber-400 stroke-amber-400 fill-amber-500/5"
  }

  const growthScores = [
    { label: "Customer Acquisition", data: opportunity_scores.customer_growth },
    { label: "Product Catalog", data: opportunity_scores.product_growth },
    { label: "Geographic Penetration", data: opportunity_scores.geographic_growth },
    { label: "Category Balance", data: opportunity_scores.category_growth },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Business Advisor</h1>
          <p className="text-slate-400 mt-1">Rule-based recommendations and growth strategies tailored to your uploaded data.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      {/* Action Guide Modal */}
      {selectedActionGuide && actionGuides[selectedActionGuide] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700/60 shadow-2xl relative space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  {actionGuides[selectedActionGuide].title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{actionGuides[selectedActionGuide].explanation}</p>
              </div>
              <button 
                onClick={() => setSelectedActionGuide(null)}
                className="text-slate-400 hover:text-white transition-colors font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Step-by-Step Implementation Strategy:</h4>
              <ol className="space-y-2.5">
                {actionGuides[selectedActionGuide].steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-slate-300 leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/20 font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedActionGuide(null)}
                className="text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Core Opportunity Gauges Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Overall Score Dial */}
        <div className="glass-panel p-6 rounded-xl border border-slate-700/40 flex flex-col items-center text-center justify-center space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Overall Opportunity Index</h3>
          
          <div className="relative h-32 w-32">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={overall >= 75 ? "stroke-emerald-400" : (overall >= 50 ? "stroke-cyan-400" : "stroke-amber-400")}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-mono">{overall}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Rating</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              {overall >= 75 ? "Excellent Balance" : (overall >= 50 ? "Moderate Performance" : "Growth Catalyst Needed")}
            </h4>
            <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto">Weighted average across core channel variables</p>
          </div>
        </div>

        {/* Detailed Growth Area Progress Indicators */}
        <div className="glass-panel p-6 rounded-xl border border-slate-700/40 md:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-700/50 pb-2">Target Growth Scores</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {growthScores.map((score, idx) => {
              return (
                <div key={idx} className="border border-slate-800 p-3 rounded-lg flex gap-3 hover:bg-slate-800/10 transition-colors">
                  {/* Miniature SVG Ring */}
                  <div className="relative h-12 w-12 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="18" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                      <circle 
                        cx="24" 
                        cy="24" 
                        r="18" 
                        className={getScoreColor(score.data.score)}
                        strokeWidth="3" 
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 - (score.data.score / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                      {score.data.score}
                    </div>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{score.label}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{score.data.explanation}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actionable Suggestions Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Growth Action Strategy Feed
        </h3>

        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => {
              const Icon = getCategoryIcon(rec.category)
              
              // Color coding by priority / impact
              let impactColor = "text-cyan-400 border-cyan-950 bg-cyan-950/20"
              if (rec.impact.toLowerCase() === "high") {
                impactColor = "text-red-400 border-red-950 bg-red-950/15"
              } else if (rec.impact.toLowerCase() === "medium") {
                impactColor = "text-amber-400 border-amber-950 bg-amber-950/15"
              }

              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all duration-200 hover:border-cyan-500/30 border border-slate-700/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 text-cyan-400 mt-1 shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">{rec.category}</span>
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold border ${impactColor}`}>
                          {rec.impact} Impact Priority
                        </span>
                      </div>
                      <h3 className="text-md font-bold text-white mt-1">{rec.title}</h3>
                      <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{rec.description}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedActionGuide(rec.action)}
                    className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap lg:self-center bg-cyan-950/40 border border-cyan-500/20 px-3.5 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 group"
                  >
                    View Guide
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-panel p-8 text-center text-slate-500 italic text-sm">
              No recommendations generated. Add transaction variables to prompt advice.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessAdvisor

