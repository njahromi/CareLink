import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Admin from '@/views/admin/Admin.vue'
import SmartCallback from '@/views/SmartCallback.vue'
import Placeholder from '@/views/Placeholder.vue'
import NotFound from '@/views/NotFound.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  { path: '/smart/callback', name: 'SmartCallback', component: SmartCallback, meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/vitals', name: 'Vitals', component: Placeholder, meta: { requiresAuth: true, title: 'Vitals' } },
  { path: '/appointments', name: 'Appointments', component: Placeholder, meta: { requiresAuth: true, title: 'Appointments' } },
  { path: '/care-plans', name: 'CarePlans', component: Placeholder, meta: { requiresAuth: true, title: 'Care Plans' } },
  { path: '/chat', name: 'Chat', component: Placeholder, meta: { requiresAuth: true, title: 'Chat' } },
  { path: '/profile', name: 'PatientProfile', component: Placeholder, meta: { requiresAuth: true, title: 'Profile' } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (requiresAuth && !isAuthenticated) {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await store.dispatch('auth/checkAuth')
      } catch (error) {
        return next('/login')
      }
    } else {
      return next('/login')
    }
  }

  if (to.path === '/login' && store.getters['auth/isAuthenticated']) {
    return next(store.getters['auth/isAdmin'] ? '/admin' : '/dashboard')
  }

  if (requiresAdmin && !store.getters['auth/isAdmin']) {
    return next('/dashboard')
  }

  return next()
})

export default router
