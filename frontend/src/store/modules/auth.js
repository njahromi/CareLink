import api from '@/services/api'

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token')
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
  },
  SET_TOKEN(state, token) {
    state.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },
  SET_AUTHENTICATED(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated
  }
}

const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      const { user, token } = response.data.data
      
      commit('SET_USER', user)
      commit('SET_TOKEN', token)
      commit('SET_AUTHENTICATED', true)
      
      return { success: true }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  async register({ commit }, userData) {
    try {
      const response = await api.post('/auth/register', userData)
      const { user, token } = response.data.data
      
      commit('SET_USER', user)
      commit('SET_TOKEN', token)
      commit('SET_AUTHENTICATED', true)
      
      return { success: true }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  },

  async smartAuth({ commit }, { iss, launch }) {
    try {
      const response = await api.get('/auth/smart/launch', {
        params: { iss, launch }
      })
      
      // Redirect to SMART launch URL
      window.location.href = response.data.data.launchUrl
    } catch (error) {
      throw new Error(error.response?.data?.error || 'SMART authentication failed')
    }
  },

  async checkAuth({ commit }) {
    try {
      const response = await api.get('/auth/me')
      const { user } = response.data.data
      
      commit('SET_USER', user)
      commit('SET_AUTHENTICATED', true)
      
      return { success: true }
    } catch (error) {
      commit('SET_USER', null)
      commit('SET_TOKEN', null)
      commit('SET_AUTHENTICATED', false)
      throw error
    }
  },

  async logout({ commit }) {
    commit('SET_USER', null)
    commit('SET_TOKEN', null)
    commit('SET_AUTHENTICATED', false)
  },

  async refreshToken({ commit }) {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const response = await api.post('/auth/refresh', { refreshToken })
      const { token } = response.data.data
      
      commit('SET_TOKEN', token)
      return { success: true }
    } catch (error) {
      commit('SET_USER', null)
      commit('SET_TOKEN', null)
      commit('SET_AUTHENTICATED', false)
      throw error
    }
  }
}

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  user: state => state.user,
  token: state => state.token,
  userRole: state => state.user?.role || 'patient',
  isProvider: state => state.user?.role === 'provider',
  isAdmin: state => state.user?.role === 'admin'
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 