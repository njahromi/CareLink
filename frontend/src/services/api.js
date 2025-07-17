import axios from 'axios'
import store from '@/store'
import router from '@/router'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = store.getters['auth/token']
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        await store.dispatch('auth/refreshToken')
        const newToken = store.getters['auth/token']
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, logout and redirect to login
        await store.dispatch('auth/logout')
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      console.error('API Error:', error.response.data.error)
    }

    return Promise.reject(error)
  }
)

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  smartLaunch: (params) => api.get('/auth/smart/launch', { params })
}

export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  getVitals: (id, period) => api.get(`/patients/${id}/vitals`, { params: { period } }),
  getAppointments: (id) => api.get(`/patients/${id}/appointments`)
}

export const vitalsAPI = {
  getVitals: (patientId, period) => api.get(`/fhir/patients/${patientId}/observations`, { params: { category: 'vital-signs', period } }),
  createVital: (data) => api.post('/fhir/observations', data)
}

export const appointmentsAPI = {
  getAll: () => api.get('/appointments'),
  create: (appointment) => api.post('/appointments', appointment),
  update: (id, appointment) => api.put(`/appointments/${id}`, appointment),
  delete: (id) => api.delete(`/appointments/${id}`)
}

export const carePlansAPI = {
  getAll: () => api.get('/care-plans'),
  getById: (id) => api.get(`/care-plans/${id}`),
  create: (carePlan) => api.post('/care-plans', carePlan),
  update: (id, carePlan) => api.put(`/care-plans/${id}`, carePlan)
}

export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getRoom: (roomId) => api.get(`/chat/rooms/${roomId}`),
  getMessages: (roomId, limit) => api.get('/chat/messages', { params: { roomId, limit } }),
  sendMessage: (message) => api.post('/chat/messages', message)
}

export const fhirAPI = {
  getPatient: (patientId) => api.get(`/fhir/patients/${patientId}`),
  getObservations: (patientId, category) => api.get(`/fhir/patients/${patientId}/observations`, { params: { category } }),
  getCarePlans: (patientId) => api.get(`/fhir/patients/${patientId}/care-plans`),
  getAppointments: (patientId) => api.get(`/fhir/patients/${patientId}/appointments`),
  getMedications: (patientId) => api.get(`/fhir/patients/${patientId}/medications`),
  getConditions: (patientId) => api.get(`/fhir/patients/${patientId}/conditions`),
  searchPatients: (params) => api.get('/fhir/patients/search', { params }),
  createObservation: (data) => api.post('/fhir/observations', data),
  updateCarePlan: (carePlanId, data) => api.put(`/fhir/care-plans/${carePlanId}`, data),
  getCapabilities: () => api.get('/fhir/capabilities')
}

export const healthAPI = {
  getHealth: () => api.get('/health'),
  getDetailedHealth: () => api.get('/health/detailed')
}

export default api 