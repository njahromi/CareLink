<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <HeartIcon class="h-12 w-12 text-blue-600 mx-auto" />
        <h2 class="mt-4 text-3xl font-extrabold text-gray-900">CareLink</h2>
        <p class="mt-2 text-sm text-gray-600">SMART on FHIR Patient Access and interoperability platform</p>
      </div>

      <form class="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm" @submit.prevent="handleLogin">
        <input v-model="form.username" class="form-input border px-3 py-2" placeholder="Username" required />
        <input v-model="form.password" type="password" class="form-input border px-3 py-2" placeholder="Password" required />
        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
        <button type="button" class="btn-secondary w-full" :disabled="loading" @click="handleSmartLogin">
          Sign in with SMART on FHIR
        </button>
        <div class="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
          <p><strong>demo / demo123</strong> — Patient Access (Alex Rivera)</p>
          <p><strong>jordan / jordan123</strong> — Patient Access (Jordan Lee)</p>
          <p><strong>admin / admin123</strong> — Platform Admin</p>
          <p><strong>provider / provider123</strong> — Provider</p>
        </div>
      </form>

      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { HeartIcon } from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'

function base64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function createPkce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = base64Url(bytes)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64Url(digest) }
}

export default {
  name: 'Login',
  components: { HeartIcon },
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const form = reactive({ username: 'demo', password: 'demo123' })

    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      try {
        const { user } = await store.dispatch('auth/login', form)
        toast.success('Signed in')
        router.push(user.role === 'admin' ? '/admin' : '/dashboard')
      } catch (err) {
        error.value = err.response?.data?.error || err.message
        toast.error('Login failed')
      } finally {
        loading.value = false
      }
    }

    const handleSmartLogin = async () => {
      loading.value = true
      try {
        const { verifier, challenge } = await createPkce()
        const state = crypto.randomUUID()
        sessionStorage.setItem('smart_verifier', verifier)
        sessionStorage.setItem('smart_state', state)
        const authorize = import.meta.env.VITE_OAUTH_AUTHORIZE_URL || 'http://localhost:3000/oauth/authorize'
        const redirect = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/smart/callback`
        const clientId = import.meta.env.VITE_SMART_CLIENT_ID || 'carelink-patient-access'
        const aud = import.meta.env.VITE_FHIR_SERVER_URL || 'http://localhost:8080/fhir'
        const scope = 'openid fhirUser launch/patient patient/*.read'
        window.location.href = `${authorize}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256&aud=${encodeURIComponent(aud)}`
      } catch (err) {
        error.value = err.message
        loading.value = false
      }
    }

    return { form, loading, error, handleLogin, handleSmartLogin }
  }
}
</script>
