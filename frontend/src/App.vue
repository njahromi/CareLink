<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav v-if="isAuthenticated" class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <router-link to="/" class="flex items-center">
              <HeartIcon class="h-8 w-8 text-blue-600" />
              <span class="ml-2 text-xl font-bold text-gray-900">CareLink</span>
            </router-link>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link to="/dashboard" class="nav-link" active-class="border-blue-500 text-gray-900">Patient Access</router-link>
              <router-link v-if="isAdmin" to="/admin" class="nav-link" active-class="border-blue-500 text-gray-900">Platform Admin</router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">{{ user?.name || 'User' }} · {{ user?.role }}</span>
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { HeartIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'App',
  components: { HeartIcon },
  setup() {
    const store = useStore()
    const router = useRouter()
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    const user = computed(() => store.getters['auth/user'])

    const logout = async () => {
      await store.dispatch('auth/logout')
      router.push('/login')
    }

    onMounted(() => {
      if (localStorage.getItem('token')) {
        store.dispatch('auth/checkAuth').catch(() => {})
      }
    })

    return { isAuthenticated, isAdmin, user, logout }
  }
}
</script>

