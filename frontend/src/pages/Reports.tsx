/**
 * CustomerIQ - Reports Page (Real-time SaaS UI)
 * Handles client-side download triggers for backend compiled ReportLab PDF files,
 * featuring progress spinners and alerts for Business Health and Growth Strategy documents.
 */

import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Database 
} from "lucide-react"
import { motion } from "framer-motion"

interface ReportItem {
  id: "health" | "growth"
  title: string
  desc: string
  status: string
}

export const Reports: React.FC = () => {
  const { selectedDatasetId } = useAuth()
  
  // Loading and Error States
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const reportsList: ReportItem[] = [
    {
      id: "health",
      title: "Business Health Report",
      desc: "Comprehensive diagnostic audit detailing customer retention health, monthly revenue performance, and category performance rankings.",
      status: "Ready"
    },
    {
      id: "growth",
      title: "Business Growth Strategy Report",
      desc: "Forward-looking strategic playbook mapping high-potential regional expansions, behavioral bundling rules, and lifetime-value projections.",
      status: "Ready"
    }
  ]

  const handleDownload = async (type: "health" | "growth") => {
    if (!selectedDatasetId) return

    setDownloading(prev => ({ ...prev, [type]: true }))
    setError(null)

    try {
      const response = await api.get(`/analytics/${selectedDatasetId}/reports/download`, {
        params: { type },
        responseType: "blob"
      })

      // Create download trigger on client browser
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `CustomerIQ_${type}_Report_${selectedDatasetId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error("Failed to compile PDF report:", err)
      setError(`Failed to compile ${type} report. Please verify dataset records.`)
    } finally {
      setDownloading(prev => ({ ...prev, [type]: false }))
    }
  }

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

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Exportable PDF Reports</h1>
          <p className="text-slate-400 mt-1">Compile and stream standard PDF reports detailing transaction metrics and business advice.</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
          <FileText className="h-6 w-6" />
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 text-left text-sm text-red-400 flex gap-2.5 items-start max-w-lg mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportsList.map((rep) => {
          const isCompiling = downloading[rep.id]
          return (
            <div key={rep.id} className="glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between border border-slate-700/40 shadow-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">{rep.title}</h3>
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/65 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                    <CheckCircle className="h-3 w-3" />
                    {rep.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rep.desc}</p>
              </div>
              
              <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  ReportLab Compiler v2.0
                </span>
                
                <button 
                  onClick={() => handleDownload(rep.id)}
                  disabled={isCompiling}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-cyan-500/5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isCompiling ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Compiling PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Reports

