<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Welcome back, {{ user?.name || 'Patient' }}!
          </h1>
          <p class="text-gray-600 mt-1">
            Here's your health overview for today
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm text-gray-500">Last updated</p>
            <p class="text-sm font-medium text-gray-900">{{ lastUpdated }}</p>
          </div>
          <div class="pulse-dot"></div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <HeartIcon class="h-8 w-8 text-red-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Heart Rate</p>
            <p class="text-2xl font-bold text-gray-900">{{ latestVitals.heartRate || '--' }} bpm</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ScaleIcon class="h-8 w-8 text-blue-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Blood Pressure</p>
            <p class="text-2xl font-bold text-gray-900">{{ latestVitals.bloodPressure || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ThermometerIcon class="h-8 w-8 text-orange-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Temperature</p>
            <p class="text-2xl font-bold text-gray-900">{{ latestVitals.temperature || '--' }}°F</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CalendarIcon class="h-8 w-8 text-green-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Next Appointment</p>
            <p class="text-2xl font-bold text-gray-900">{{ nextAppointment || 'None' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Vitals Chart -->
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <h3 class="card-title">Recent Vital Signs</h3>
        </div>
        <div class="chart-container">
          <LineChart
            v-if="vitalsChartData"
            :data="vitalsChartData"
            :options="chartOptions"
          />
          <div v-else class="flex items-center justify-center h-64">
            <div class="text-center">
              <ChartBarIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500">No vital signs data available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Appointments -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Upcoming Appointments</h3>
        </div>
        <div class="space-y-4">
          <div v-if="upcomingAppointments.length === 0" class="text-center py-8">
            <CalendarIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500">No upcoming appointments</p>
          </div>
          <div
            v-for="appointment in upcomingAppointments"
            :key="appointment.id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium text-gray-900">{{ appointment.provider }}</p>
                <p class="text-sm text-gray-500">{{ appointment.type }}</p>
                <p class="text-sm text-gray-500">{{ formatDate(appointment.date) }}</p>
              </div>
              <span class="status-badge status-active">Scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Care Plan Summary -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Active Care Plans</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="carePlan in activeCarePlans"
          :key="carePlan.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">{{ carePlan.title }}</h4>
            <span class="status-badge status-active">Active</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">{{ carePlan.description }}</p>
          <div class="space-y-2">
            <div v-for="goal in carePlan.goals.slice(0, 2)" :key="goal" class="text-sm">
              <span class="text-gray-500">•</span>
              <span class="text-gray-700">{{ goal }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Quick Actions</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          @click="$router.push('/vitals')"
          class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <HeartIcon class="h-8 w-8 text-red-500 mb-2" />
          <span class="text-sm font-medium text-gray-900">View Vitals</span>
        </button>
        <button
          @click="$router.push('/appointments')"
          class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <CalendarIcon class="h-8 w-8 text-blue-500 mb-2" />
          <span class="text-sm font-medium text-gray-900">Schedule</span>
        </button>
        <button
          @click="$router.push('/chat')"
          class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChatBubbleLeftIcon class="h-8 w-8 text-green-500 mb-2" />
          <span class="text-sm font-medium text-gray-900">Message</span>
        </button>
        <button
          @click="$router.push('/care-plans')"
          class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ClipboardDocumentListIcon class="h-8 w-8 text-purple-500 mb-2" />
          <span class="text-sm font-medium text-gray-900">Care Plans</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import {
  HeartIcon,
  ScaleIcon,
  ThermometerIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'
import { LineChart } from 'vue-chartjs'
import { format } from 'date-fns'

export default {
  name: 'Dashboard',
  components: {
    HeartIcon,
    ScaleIcon,
    ThermometerIcon,
    CalendarIcon,
    ChartBarIcon,
    ChatBubbleLeftIcon,
    ClipboardDocumentListIcon,
    LineChart
  },
  setup() {
    const store = useStore()

    const loading = ref(false)
    const latestVitals = ref({})
    const upcomingAppointments = ref([])
    const activeCarePlans = ref([])

    const user = computed(() => store.getters['auth/user'])
    const lastUpdated = computed(() => format(new Date(), 'MMM dd, yyyy HH:mm'))

    const vitalsChartData = ref({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Heart Rate (bpm)',
          data: [72, 68, 75, 70, 73, 69, 71],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        },
        {
          label: 'Systolic BP',
          data: [120, 118, 125, 122, 119, 121, 123],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    })

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }

    const formatDate = (dateString) => {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    }

    const nextAppointment = computed(() => {
      if (upcomingAppointments.value.length > 0) {
        return formatDate(upcomingAppointments.value[0].date)
      }
      return 'None'
    })

    const loadDashboardData = async () => {
      loading.value = true
      try {
        // Load mock data for demo
        latestVitals.value = {
          heartRate: 72,
          bloodPressure: '120/80',
          temperature: 98.6
        }

        upcomingAppointments.value = [
          {
            id: '1',
            provider: 'Dr. Sarah Johnson',
            type: 'Follow-up',
            date: '2024-01-20T14:00:00Z'
          },
          {
            id: '2',
            provider: 'Dr. Michael Chen',
            type: 'Cardiology Consultation',
            date: '2024-01-25T10:00:00Z'
          }
        ]

        activeCarePlans.value = [
          {
            id: '1',
            title: 'Diabetes Management',
            description: 'Comprehensive plan for managing Type 2 Diabetes',
            goals: [
              'Maintain blood glucose levels between 80-130 mg/dL',
              'Achieve HbA1c < 7%',
              'Lose 10 pounds in 6 months'
            ]
          }
        ]
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadDashboardData()
    })

    return {
      loading,
      user,
      lastUpdated,
      latestVitals,
      upcomingAppointments,
      activeCarePlans,
      vitalsChartData,
      chartOptions,
      nextAppointment,
      formatDate
    }
  }
}
</script> 