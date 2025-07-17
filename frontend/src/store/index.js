import { createStore } from 'vuex'
import auth from './modules/auth'
import patients from './modules/patients'
import vitals from './modules/vitals'
import appointments from './modules/appointments'
import carePlans from './modules/carePlans'
import chat from './modules/chat'
import fhir from './modules/fhir'

export default createStore({
  modules: {
    auth,
    patients,
    vitals,
    appointments,
    carePlans,
    chat,
    fhir
  },
  state: {
    loading: false,
    error: null,
    notifications: []
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push(notification)
    },
    REMOVE_NOTIFICATION(state, id) {
      state.notifications = state.notifications.filter(n => n.id !== id)
    }
  },
  actions: {
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    },
    setError({ commit }, error) {
      commit('SET_ERROR', error)
    },
    addNotification({ commit }, notification) {
      const id = Date.now()
      commit('ADD_NOTIFICATION', { id, ...notification })
      setTimeout(() => {
        commit('REMOVE_NOTIFICATION', id)
      }, 5000)
    }
  },
  getters: {
    isLoading: state => state.loading,
    error: state => state.error,
    notifications: state => state.notifications
  }
}) 