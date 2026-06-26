/**
 * CustomerIQ - API Client
 * Configures Axios with the backend base URL and an interceptor to inject the JWT token.
 */

import axios from "axios"

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
})

// Automatically attach JWT token to headers if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
