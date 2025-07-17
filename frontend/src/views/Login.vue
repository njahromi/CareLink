<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="flex justify-center">
          <HeartIcon class="h-12 w-12 text-blue-600" />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to CareLink
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to access your patient dashboard
        </p>
      </div>

      <!-- Login Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Username"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">or</p>
        </div>

        <!-- SMART on FHIR Login -->
        <div>
          <button
            type="button"
            @click="handleSmartLogin"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <ShieldCheckIcon class="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            </span>
            Sign in with SMART on FHIR
          </button>
        </div>

        <!-- Demo Credentials -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 class="text-sm font-medium text-blue-800">Demo Credentials</h3>
          <p class="text-sm text-blue-700 mt-1">
            Username: <strong>demo</strong><br>
            Password: <strong>any password</strong>
          </p>
        </div>
      </form>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { HeartIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'

export default {
  name: 'Login',
  components: {
    HeartIcon,
    ShieldCheckIcon
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const loading = ref(false)
    const error = ref('')

    const form = reactive({
      username: '',
      password: ''
    })

    const handleLogin = async () => {
      loading.value = true
      error.value = ''

      try {
        await store.dispatch('auth/login', form)
        toast.success('Login successful!')
        router.push('/dashboard')
      } catch (err) {
        error.value = err.message
        toast.error('Login failed. Please check your credentials.')
      } finally {
        loading.value = false
      }
    }

    const handleSmartLogin = async () => {
      loading.value = true
      error.value = ''

      try {
        // For demo purposes, we'll use a mock SMART launch
        // In a real application, this would integrate with an actual FHIR server
        const mockParams = {
          iss: 'https://hapi.fhir.org/baseR4',
          launch: 'mock-launch-token'
        }
        
        await store.dispatch('auth/smartAuth', mockParams)
        toast.info('Redirecting to SMART authentication...')
      } catch (err) {
        error.value = err.message
        toast.error('SMART authentication failed.')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      handleLogin,
      handleSmartLogin
    }
  }
}
</script> 