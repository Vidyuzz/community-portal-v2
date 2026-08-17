import axios, { type AxiosError } from 'axios'

const api = axios.create({
  // In production (Vercel), point to Render backend via env var.
  // In local dev, Vite proxy keeps `/api` working.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

/** HTTP status of a failed request, or undefined if it never reached the server. */
export function getApiStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as AxiosError).response?.status
  }
  return undefined
}

/** Reads `{ error }` from FastAPI/Next-style JSON or `detail` fallback. */
export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as AxiosError<{ error?: string; detail?: string | string[] }>
    const data = ax.response?.data
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') return data.error
      if (typeof data.detail === 'string') return data.detail
    }
  }
  return fallback
}
