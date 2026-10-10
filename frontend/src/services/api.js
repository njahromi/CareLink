import axios from 'axios'
import store from '@/store'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = store.getters['auth/token']
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await store.dispatch('auth/refreshToken')
        const newToken = store.getters['auth/token']
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        await store.dispatch('auth/logout')
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export const fhirAPI = {
  getSummary: (patientId) => api.get(`/fhir/patients/${patientId}/summary`),
  getPatient: (patientId) => api.get(`/fhir/patients/${patientId}`),
  getObservations: (patientId, category) => api.get(`/fhir/patients/${patientId}/observations`, { params: { category } }),
  getCarePlans: (patientId) => api.get(`/fhir/patients/${patientId}/care-plans`),
  getAppointments: (patientId) => api.get(`/fhir/patients/${patientId}/appointments`),
  getMedications: (patientId) => api.get(`/fhir/patients/${patientId}/medications`),
  getConditions: (patientId) => api.get(`/fhir/patients/${patientId}/conditions`),
  getCoverage: (patientId) => api.get(`/fhir/patients/${patientId}/coverage`),
  getEob: (patientId) => api.get(`/fhir/patients/${patientId}/eob`),
  getCapabilities: () => api.get('/fhir/capabilities'),
  startExport: (params) => api.post('/fhir/export', {}, { params }),
  listExportJobs: () => api.get('/fhir/export/jobs'),
  getExportJob: (id) => api.get(`/fhir/export/jobs/${id}`)
}

export const adminAPI = {
  overview: () => api.get('/admin/overview'),
  modules: () => api.get('/admin/modules'),
  updateModule: (id, enabled) => api.put(`/admin/modules/${id}`, { enabled }),
  repositories: () => api.get('/admin/repositories'),
  partitions: () => api.get('/admin/partitions'),
  createPartition: (payload) => api.post('/admin/partitions', payload),
  channels: () => api.get('/admin/channels'),
  ingest: (bundle, partition) => api.post('/admin/channels/ingest', { bundle, partition }),
  security: () => api.get('/admin/security'),
  audit: () => api.get('/admin/audit'),
  apis: () => api.get('/admin/apis')
}

export const healthAPI = {
  getHealth: () => api.get('/health'),
  getDetailedHealth: () => api.get('/health/detailed')
}

export default api
