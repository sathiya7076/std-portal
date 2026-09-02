import axios from 'axios'

// Central Axios instance. All service files import this instead of
// calling axios directly, and the base URL comes from the environment
// so nothing has to change when the real backend is ready.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stms_token')
      localStorage.removeItem('stms_user')
    }
    return Promise.reject(error)
  }
)

// Kept for backward compatibility: other service files (studentService.js,
// courseService.js, etc.) may still be in USE_MOCK mode and import this to
// simulate network latency. authService.js no longer uses it since it now
// always calls the real backend, but removing it here would break every
// other still-mocked service file that imports it.
export const mockDelay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

export default api