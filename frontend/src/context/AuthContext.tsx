/**
 * CustomerIQ - Authentication Context
 * Manages global user authentication state, token persistence, and sign-in/sign-out logic.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { api } from "../lib/api"

export interface User {
  id: number
  email: string
  role: string
  created_at: string
}

export interface Dataset {
  id: number
  name: string
  row_count: number | null
  dataset_type: string | null
  upload_status: string
  processed_at: string | null
  columns_detected: Record<string, string> | null
  schema_metadata: Record<string, any> | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  datasets: Dataset[]
  selectedDatasetId: number | null
  setSelectedDatasetId: (id: number | null) => void
  fetchDatasets: () => Promise<void>
  getAnalytics: (datasetId: number, signal?: AbortSignal) => Promise<any>
  getRankings: (datasetId: number, signal?: AbortSignal) => Promise<any>
  getRecommendations: (datasetId: number, signal?: AbortSignal) => Promise<any>
  getInsights: (datasetId: number, signal?: AbortSignal) => Promise<any>
  clearCache: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [loading, setLoading] = useState<boolean>(true)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDatasetId, setSelectedDatasetId_state] = useState<number | null>(
    localStorage.getItem("selectedDatasetId") ? Number(localStorage.getItem("selectedDatasetId")) : null
  )

  // Caching states as refs to prevent context re-renders and stabilize function references
  const analyticsCache = useRef<Record<number, any>>({})
  const rankingsCache = useRef<Record<number, any>>({})
  const recommendationsCache = useRef<Record<number, any>>({})
  const insightsCache = useRef<Record<number, any>>({})

  const inFlightAnalytics = useRef<Record<number, Promise<any> | undefined>>({})
  const inFlightRankings = useRef<Record<number, Promise<any> | undefined>>({})
  const inFlightRecommendations = useRef<Record<number, Promise<any> | undefined>>({})
  const inFlightInsights = useRef<Record<number, Promise<any> | undefined>>({})


  const setSelectedDatasetId = (id: number | null) => {
    if (id) {
      localStorage.setItem("selectedDatasetId", String(id))
    } else {
      localStorage.removeItem("selectedDatasetId")
    }
    setSelectedDatasetId_state(id)
  }

  const clearCache = useCallback(() => {
    analyticsCache.current = {}
    rankingsCache.current = {}
    recommendationsCache.current = {}
    insightsCache.current = {}
    inFlightAnalytics.current = {}
    inFlightRankings.current = {}
    inFlightRecommendations.current = {}
    inFlightInsights.current = {}
  }, [])

  const getAnalytics = useCallback(async (datasetId: number, signal?: AbortSignal) => {
    if (analyticsCache.current[datasetId]) return analyticsCache.current[datasetId]
    if (inFlightAnalytics.current[datasetId]) return inFlightAnalytics.current[datasetId]

    const promise = api.get(`/analytics/${datasetId}`, { signal })
      .then(response => {
        analyticsCache.current[datasetId] = response.data
        delete inFlightAnalytics.current[datasetId]
        return response.data
      })
      .catch(err => {
        delete inFlightAnalytics.current[datasetId]
        throw err
      })

    inFlightAnalytics.current[datasetId] = promise
    return promise
  }, [])

  const getRankings = useCallback(async (datasetId: number, signal?: AbortSignal) => {
    if (rankingsCache.current[datasetId]) return rankingsCache.current[datasetId]
    if (inFlightRankings.current[datasetId]) return inFlightRankings.current[datasetId]

    const promise = api.get(`/analytics/${datasetId}/rankings`, { signal })
      .then(response => {
        rankingsCache.current[datasetId] = response.data
        delete inFlightRankings.current[datasetId]
        return response.data
      })
      .catch(err => {
        delete inFlightRankings.current[datasetId]
        throw err
      })

    inFlightRankings.current[datasetId] = promise
    return promise
  }, [])

  const getRecommendations = useCallback(async (datasetId: number, signal?: AbortSignal) => {
    if (recommendationsCache.current[datasetId]) return recommendationsCache.current[datasetId]
    if (inFlightRecommendations.current[datasetId]) return inFlightRecommendations.current[datasetId]

    const promise = api.get(`/analytics/${datasetId}/recommendations`, { signal })
      .then(response => {
        recommendationsCache.current[datasetId] = response.data
        delete inFlightRecommendations.current[datasetId]
        return response.data
      })
      .catch(err => {
        delete inFlightRecommendations.current[datasetId]
        throw err
      })

    inFlightRecommendations.current[datasetId] = promise
    return promise
  }, [])

  const getInsights = useCallback(async (datasetId: number, signal?: AbortSignal) => {
    if (insightsCache.current[datasetId]) return insightsCache.current[datasetId]
    if (inFlightInsights.current[datasetId]) return inFlightInsights.current[datasetId]

    const promise = api.get(`/analytics/${datasetId}/insights`, { signal })
      .then(response => {
        insightsCache.current[datasetId] = response.data
        delete inFlightInsights.current[datasetId]
        return response.data
      })
      .catch(err => {
        delete inFlightInsights.current[datasetId]
        throw err
      })

    inFlightInsights.current[datasetId] = promise
    return promise
  }, [])

  const fetchDatasets = async () => {
    if (!token) return
    try {
      const response = await api.get<Dataset[]>("/datasets")
      setDatasets(response.data)
      // Auto-select first dataset if none selected
      if (response.data.length > 0 && !selectedDatasetId) {
        // Find first completed one
        const completed = response.data.find(d => d.upload_status === "completed")
        if (completed) {
          setSelectedDatasetId(completed.id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch datasets:", error)
    }
  }

  // Fetch profile when token changes or on initial mount
  useEffect(() => {
    const fetchProfile = async () => {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        try {
          const response = await api.get<User>("/auth/me")
          setUser(response.data)
          setToken(storedToken)
          // Fetch datasets after profile load
          await fetchDatasets()
        } catch (error) {
          console.error("Failed to restore auth session:", error)
          logout()
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [token])

  const login = async (email: string, password: string) => {
    // OAuth2 standard uses urlencoded form-data
    const params = new URLSearchParams()
    params.append("username", email)
    params.append("password", password)

    try {
      const response = await api.post<{ access_token: string, token_type: string }>("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      })
      const accessToken = response.data.access_token
      localStorage.setItem("token", accessToken)
      setToken(accessToken)

      // Fetch user details immediately after login
      const userProfile = await api.get<User>("/auth/me")
      setUser(userProfile.data)
    } catch (error) {
      console.error("Login failed:", error)
      throw error;
    }
  }

  const register = async (email: string, password: string, role: string = "user") => {
    try {
      await api.post("/auth/register", { email, password, role })
    } catch (error) {
      console.error("Registration failed:", error)
      throw error;
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("selectedDatasetId")
    setToken(null)
    setUser(null)
    setDatasets([])
    setSelectedDatasetId_state(null)
    clearCache()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout,
      datasets,
      selectedDatasetId,
      setSelectedDatasetId,
      fetchDatasets,
      getAnalytics,
      getRankings,
      getRecommendations,
      getInsights,
      clearCache
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
