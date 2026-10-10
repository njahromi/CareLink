import { adminAPI } from '@/services/api'

const state = {
  overview: null,
  modules: [],
  repository: null,
  partitions: [],
  channels: { channels: [], history: [] },
  security: { clients: [], users: [] },
  audit: { memory: [], fhir: [] },
  apis: null
}

const mutations = {
  SET_OVERVIEW(state, value) { state.overview = value },
  SET_MODULES(state, value) { state.modules = value },
  SET_REPOSITORY(state, value) { state.repository = value },
  SET_PARTITIONS(state, value) { state.partitions = value },
  SET_CHANNELS(state, value) { state.channels = value },
  SET_SECURITY(state, value) { state.security = value },
  SET_AUDIT(state, value) { state.audit = value },
  SET_APIS(state, value) { state.apis = value }
}

const actions = {
  async loadAll({ dispatch }) {
    await Promise.all([
      dispatch('loadOverview'),
      dispatch('loadModules'),
      dispatch('loadRepository'),
      dispatch('loadPartitions'),
      dispatch('loadChannels'),
      dispatch('loadSecurity'),
      dispatch('loadAudit'),
      dispatch('loadApis')
    ])
  },
  async loadOverview({ commit }) {
    const { data } = await adminAPI.overview()
    commit('SET_OVERVIEW', data.data)
  },
  async loadModules({ commit }) {
    const { data } = await adminAPI.modules()
    commit('SET_MODULES', data.data)
  },
  async loadRepository({ commit }) {
    const { data } = await adminAPI.repositories()
    commit('SET_REPOSITORY', data.data)
  },
  async loadPartitions({ commit }) {
    const { data } = await adminAPI.partitions()
    commit('SET_PARTITIONS', data.data)
  },
  async loadChannels({ commit }) {
    const { data } = await adminAPI.channels()
    commit('SET_CHANNELS', data.data)
  },
  async loadSecurity({ commit }) {
    const { data } = await adminAPI.security()
    commit('SET_SECURITY', data.data)
  },
  async loadAudit({ commit }) {
    const { data } = await adminAPI.audit()
    commit('SET_AUDIT', data.data)
  },
  async loadApis({ commit }) {
    const { data } = await adminAPI.apis()
    commit('SET_APIS', data.data)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
