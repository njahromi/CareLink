import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

// Views
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Vitals from '@/views/Vitals.vue'
import Appointments from '@/views/Appointments.vue'
import CarePlans from '@/views/CarePlans.vue'
import Chat from '@/views/Chat.vue'
import PatientProfile from '@/views/PatientProfile.vue'
import NotFound from '@/views/NotFound.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/vitals',
    name: 'Vitals',
    component: Vitals,
    meta: { requiresAuth: true }
  },
  {
    path: '/appointments',
    name: 'Appointments',
    component: Appointments,
    meta: { requiresAuth: true }
  },
  {
    path: '/care-plans',
    name: 'CarePlans',
    component: CarePlans,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'PatientProfile',
    component: PatientProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (requiresAuth && !isAuthenticated) {
    // Check if we have a token and try to authenticate
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await store.dispatch('auth/checkAuth')
        next()
      } catch (error) {
        next('/login')
      }
    } else {
      next('/login')
    }
  } else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router 