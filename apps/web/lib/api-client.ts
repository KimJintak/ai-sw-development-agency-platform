import axios from 'axios'
import { resolveDemoData } from '@/lib/demo/demo-router'

const DEMO_STORAGE_KEY = 'demo-mode'

function isDemoModeOn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_STORAGE_KEY) === 'true'
}

const apiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'),
  headers: { 'Content-Type': 'application/json' },
})

// Demo mode interceptor — must be added first so it runs first (axios LIFO for request)
apiClient.interceptors.request.use((config) => {
  if (!isDemoModeOn()) return config

  const url = config.url ?? ''
  const method = config.method?.toUpperCase() ?? 'GET'

  const params: Record<string, string> = {}
  if (config.params) {
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) params[k] = String(v)
    }
  }
  const qIdx = url.indexOf('?')
  if (qIdx >= 0) {
    const sp = new URLSearchParams(url.slice(qIdx + 1))
    sp.forEach((v, k) => { params[k] = v })
  }

  const cleanUrl = qIdx >= 0 ? url.slice(0, qIdx) : url

  try {
    const data = resolveDemoData(cleanUrl, method, params)

    if (data !== null) {
      config.adapter = () =>
        Promise.resolve({
          data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        })
    }
  } catch (e) {
    console.error('[Demo Mode] Error resolving data for', cleanUrl, e)
  }

  return config
})

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Skip auth error handling in demo mode
    if (isDemoModeOn()) return Promise.reject(err)

    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            '/api/auth/refresh',
            { refreshToken },
          )
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          err.config.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(err.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  },
)

export default apiClient
