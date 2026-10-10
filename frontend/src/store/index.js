import { createStore } from 'vuex'
import auth from './modules/auth'
import platform from './modules/platform'

export default createStore({
  modules: {
    auth,
    platform
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
      state.notifications = state.notifications.filter((item) => item.id !== id)
    }
  },
  getters: {
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    notifications: (state) => state.notifications
  }
})
