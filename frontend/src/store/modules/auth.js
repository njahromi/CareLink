import api from '@/services/api'

const state = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('token')
}

const persist = (user, token, refreshToken) => {
  if (user) localStorage.setItem('user', JSON.stringify(user))
  else localStorage.removeItem('user')
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
  else localStorage.removeItem('refreshToken')
}

const mutations = {
  SET_SESSION(state, { user, token, refreshToken }) {
    state.user = user
    state.token = token
    state.refreshToken = refreshToken || state.refreshToken
    state.isAuthenticated = !!token
    persist(user, token, refreshToken || state.refreshToken)
  },
  CLEAR_SESSION(state) {
    state.user = null
    state.token = null
    state.refreshToken = null
    state.isAuthenticated = false
    persist(null, null, null)
  }
}

const actions = {
  async login({ commit }, credentials) {
    const response = await api.post('/auth/login', credentials)
    const { user, token, accessToken, refreshToken } = response.data.data
    commit('SET_SESSION', {
      user,
      token: accessToken || token,
      refreshToken
    })
    return { success: true, user }
  },

  async completeSmart({ commit }, { code, codeVerifier, redirectUri }) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: import.meta.env.VITE_SMART_CLIENT_ID || 'carelink-patient-access',
      code_verifier: codeVerifier
    })
    const tokenUrl = import.meta.env.VITE_OAUTH_TOKEN_URL || 'http://localhost:3000/oauth/token'
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    const tokens = await response.json()
    if (!response.ok) {
      throw new Error(tokens.error_description || tokens.error || 'SMART token exchange failed')
    }
    const user = {
      id: tokens.patient || 'smart-user',
      name: tokens.patient ? `Member ${tokens.patient}` : 'SMART user',
      role: tokens.patient ? 'patient' : 'user',
      fhirPatientId: tokens.patient,
      scopes: (tokens.scope || '').split(' ')
    }
    commit('SET_SESSION', {
      user,
      token: tokens.access_token,
      refreshToken: tokens.refresh_token
    })
    return { success: true, user }
  },

  async checkAuth({ commit, state }) {
    try {
      const response = await api.get('/auth/me')
      commit('SET_SESSION', {
        user: response.data.data.user,
        token: state.token,
        refreshToken: state.refreshToken
      })
      return { success: true }
    } catch (error) {
      commit('CLEAR_SESSION')
      throw error
    }
  },

  async logout({ commit }) {
    commit('CLEAR_SESSION')
  },

  async refreshToken({ commit }) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token')
    }
    const response = await api.post('/auth/refresh', { refreshToken })
    const { token, accessToken, refreshToken: nextRefresh } = response.data.data
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    commit('SET_SESSION', {
      user,
      token: accessToken || token,
      refreshToken: nextRefresh
    })
    return { success: true }
  }
}

const getters = {
  isAuthenticated: (state) => state.isAuthenticated,
  user: (state) => state.user,
  token: (state) => state.token,
  userRole: (state) => state.user?.role || 'patient',
  isProvider: (state) => state.user?.role === 'provider',
  isAdmin: (state) => state.user?.role === 'admin',
  fhirPatientId: (state) => state.user?.fhirPatientId
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
