import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { resolveDemoData } from './demo-router'

let interceptorId: number | null = null

export function setupDemoInterceptor(client: AxiosInstance) {
  if (interceptorId !== null) return

  interceptorId = client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = config.url ?? ''
    const method = config.method?.toUpperCase() ?? 'GET'

    // Extract query params from config.params
    const params: Record<string, string> = {}
    if (config.params) {
      for (const [k, v] of Object.entries(config.params)) {
        if (v !== undefined && v !== null) params[k] = String(v)
      }
    }

    // Also parse query params from URL string
    const qIdx = url.indexOf('?')
    if (qIdx >= 0) {
      const searchParams = new URLSearchParams(url.slice(qIdx + 1))
      searchParams.forEach((v, k) => { params[k] = v })
    }

    const cleanUrl = qIdx >= 0 ? url.slice(0, qIdx) : url
    const data = resolveDemoData(cleanUrl, method, params)

    if (data !== null) {
      // Override the adapter to return mock data directly
      config.adapter = () =>
        Promise.resolve({
          data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        })
    }

    return config
  })
}

export function removeDemoInterceptor(client: AxiosInstance) {
  if (interceptorId !== null) {
    client.interceptors.request.eject(interceptorId)
    interceptorId = null
  }
}
