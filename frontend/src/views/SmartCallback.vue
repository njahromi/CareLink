<template>
  <div class="min-h-[50vh] flex items-center justify-center">
    <div class="card max-w-lg w-full text-center">
      <h1 class="text-xl font-semibold">Completing SMART on FHIR login</h1>
      <p class="text-gray-600 mt-2">{{ message }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { toast } from 'vue3-toastify'

export default {
  name: 'SmartCallback',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const message = ref('Exchanging authorization code...')

    onMounted(async () => {
      try {
        const code = route.query.code
        const storedState = sessionStorage.getItem('smart_state')
        if (route.query.state && storedState && route.query.state !== storedState) {
          throw new Error('OAuth state mismatch')
        }
        const codeVerifier = sessionStorage.getItem('smart_verifier')
        const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/smart/callback`
        const { user } = await store.dispatch('auth/completeSmart', { code, codeVerifier, redirectUri })
        toast.success('SMART authorization complete')
        router.push(user?.role === 'admin' ? '/admin' : '/dashboard')
      } catch (error) {
        message.value = error.message
        toast.error(error.message)
        setTimeout(() => router.push('/login'), 2500)
      }
    })

    return { message }
  }
}
</script>
