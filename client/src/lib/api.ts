import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 8000,
})

// ✅ attach token if exists
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ✅ handle 401 logout
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ✅ API calls
export const fetchStats = async () => (await api.get('/stats')).data
export const waterNow = async () => (await api.post('/water-now')).data
export const toggleAutoMode = async () => (await api.post('/toggle-auto')).data

// auth
export const login = async (email: string, password: string) => {
  const { data } = await api.post('/login', { email, password })
  return data
}

export const register = async (name: string, email: string, password: string) => {
  const { data } = await api.post('/register', { name, email, password })
  return data
}

export default api
