import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/main.css'

// Import toast notifications
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)

// Global properties
app.config.globalProperties.$toast = toast

// Use plugins
app.use(router)
app.use(store)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  toast.error('An error occurred. Please try again.')
}

// Mount the app
app.mount('#app') 