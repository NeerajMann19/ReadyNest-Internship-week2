/**
 * CustomerIQ - Overview Page (Real-time SaaS UI)
 * Handles drag-and-drop CSV/Excel uploads, lists datasets with delete actions,
 * and visualizes key business diagnostic metrics and priority insights.
 */

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Percent, 
  Trash2, 
  CloudUpload, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { motion } from "framer-motion"

interface UploadSummary {
  dataset_name: string
  rows_imported: number
  columns_detected: string[]
  missing_values: Record<string, number>
  warnings: string[]
}

interface AnalyticsData {
  customer: {
    total_customers: number
    new_customers: number
    returning_customers: number
    returning_rate: number
    clv: number
    average_spend: number
  }
  sales: {
    monthly_growth: number
    quarterly_growth: number
  }
}

interface RecommendationsData {
  opportunity_scores: {
    overall_score: number
  }
}

interface Insight {
  title: string
  description: string
  impact: string
  priority: string
}

export const Overview: React.FC = () => {
  const { 
    datasets, 
    selectedDatasetId, 
    setSelectedDatasetId, 
    fetchDatasets,
    getAnalytics,
    getRecommendations,
    getInsights,
    clearCache
  } = useAuth()

  // Upload States
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null)

  // Analytics & Insights States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [scores, setScores] = useState<RecommendationsData | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!selectedDatasetId) {
      setAnalytics(null)
      setScores(null)
      setInsights([])
      return
    }

    const abortController = new AbortController()

    const loadData = async () => {
      setLoadingData(true)
      try {
        const [anData, scoreData, insData] = await Promise.all([
          getAnalytics(selectedDatasetId, abortController.signal),
          getRecommendations(selectedDatasetId, abortController.signal),
          getInsights(selectedDatasetId, abortController.signal)
        ])
        setAnalytics(anData)
        setScores(scoreData)
        setInsights(insData)
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return // Quietly catch cancellations on tab switch
        }
        console.error("Failed to load analytics metrics:", err)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()

    return () => {
      abortController.abort()
    }
  }, [selectedDatasetId, getAnalytics, getRecommendations, getInsights])

  // Drag and Drop Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    setUploadSummary(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await api.post<UploadSummary>("/datasets/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          )
          setUploadProgress(percentCompleted)
        }
      })
      
      setUploadSummary(response.data)
      clearCache()
      await fetchDatasets()
    } catch (err: any) {
      console.error(err)
      setUploadError(err.response?.data?.detail || "Upload failed. Please verify format.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this dataset? All associated customers, products, and order data will be purged.")) {
      return
    }
    try {
      await api.delete(`/datasets/${id}`)
      if (selectedDatasetId === id) {
        setSelectedDatasetId(null)
      }
      clearCache()
      await fetchDatasets()
    } catch (err) {
      console.error("Failed to delete dataset:", err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400 mt-1">Upload business transaction logs to dynamically map metrics and advisor insights.</p>
      </div>

      {/* File Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`glass-panel border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center text-center space-y-4 relative ${
          dragActive ? "border-cyan-400 bg-cyan-950/20" : "border-slate-700/60 hover:border-slate-600"
        }`}
      >
        <input 
          id="file-upload-input"
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
        />
        
        {uploading ? (
          <div className="space-y-3 w-full max-w-xs">
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-white">Uploading & Mapping Records...</p>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-mono">{uploadProgress}% complete</p>
          </div>
        ) : (
          <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center space-y-3">
            <div className="p-3 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
              <CloudUpload className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your file here, or <span className="text-cyan-400 hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, and XLS formats (Max 100k+ rows)</p>
            </div>
          </label>
        )}

        {/* Upload Success Summary */}
        {uploadSummary && (
          <div className="w-full max-w-lg bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 text-left text-sm text-slate-300 space-y-2 mt-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <CheckCircle className="h-4.5 w-4.5" />
              Dataset Mapped Successfully
            </div>
            <p><b>Name:</b> {uploadSummary.dataset_name}</p>
            <p><b>Total Rows:</b> {uploadSummary.rows_imported.toLocaleString()}</p>
            <p><b>Detected Fields:</b> {uploadSummary.columns_detected.join(", ")}</p>
            {uploadSummary.warnings.length > 0 && (
              <div className="text-amber-400 text-xs bg-amber-950/20 p-2 rounded border border-amber-500/20 mt-2">
                <b>Warnings:</b>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {uploadSummary.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 text-left text-sm text-red-400 flex gap-2.5 items-start mt-4 max-w-lg">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{uploadError}</p>
          </div>
        )}
      </div>

      {/* Main Grid: KPIs and Datasets List */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* KPI Panel */}
        <div className="lg:col-span-2 space-y-6">
          {loadingData ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (CLV)</p>
                    <h3 className="text-xl font-bold text-white mt-1">${analytics.customer.clv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-[10px] text-emerald-400 mt-1">
                      {analytics.sales.monthly_growth >= 0 ? "+" : ""}
                      {analytics.sales.monthly_growth.toFixed(1)}% MoM
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
                    <h3 className="text-xl font-bold text-white mt-1">{analytics.customer.total_customers.toLocaleString()}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {analytics.customer.returning_rate.toFixed(1)}% Returning
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Transaction Size</p>
                    <h3 className="text-xl font-bold text-white mt-1">${analytics.customer.average_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Average spent per ticket</p>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                    <Percent className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity Score</p>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {scores ? `${scores.opportunity_scores.overall_score}/100` : "--"}
                    </h3>
                    <p className="text-[10px] text-cyan-400 mt-1">AI growth optimization index</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Insights Feed as Key Cards */}
              <div className="glass-panel p-6 rounded-xl space-y-4 border border-slate-700/40 shadow-lg">
                <h3 className="text-md font-semibold text-white border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">⚡</span>
                  Key Business Insights
                </h3>
                {insights.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {insights.map((ins, idx) => {
                      const isHigh = ins.priority.toLowerCase() === "high"
                      const badgeColor = isHigh 
                        ? "text-red-400 border-red-950 bg-red-950/20" 
                        : "text-amber-400 border-amber-950 bg-amber-950/20"
                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all hover:bg-slate-800/10 hover:border-slate-600 ${
                            isHigh ? "border-red-900/35 bg-red-950/5" : "border-slate-800 bg-slate-900/20"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="text-sm font-bold text-white leading-snug">{ins.title}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 uppercase tracking-wider ${badgeColor}`}>
                                {ins.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed pt-1">{ins.description}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-cyan-400 italic font-semibold">
                            Impact: {ins.impact}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No automated insights triggered.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-xl text-center text-slate-500 italic text-sm">
              Please select or upload a dataset to view diagnostic KPIs and insights.
            </div>
          )}
        </div>

        {/* Datasets Sidebar */}
        <div className="glass-panel p-6 rounded-xl space-y-4 h-fit">
          <h3 className="text-md font-semibold text-white border-b border-slate-700/50 pb-2">Uploaded Datasets</h3>
          {datasets.length > 0 ? (
            <div className="space-y-3">
              {datasets.map((d) => (
                <div 
                  key={d.id} 
                  onClick={() => d.upload_status === "completed" && setSelectedDatasetId(d.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
                    selectedDatasetId === d.id 
                      ? "border-cyan-500 bg-cyan-950/15" 
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/20"
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <p className="text-xs font-semibold text-white truncate">{d.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {d.row_count ? `${d.row_count.toLocaleString()} rows` : "0 rows"} | <span className="uppercase text-[9px] font-mono">{d.dataset_type}</span>
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(d.id, e)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No files imported yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Overview
