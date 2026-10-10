<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs uppercase tracking-wide text-blue-600 font-semibold">CMS Patient Access</p>
          <h1 class="text-2xl font-bold text-gray-900 mt-1">{{ patientName }}</h1>
          <p class="text-gray-600 mt-1">US Core clinicals and CARIN-lite claims from the local FHIR R4 repository.</p>
        </div>
        <div class="text-right text-sm text-gray-500">
          <p>Member {{ user?.fhirPatientId || '—' }}</p>
          <p>Partition {{ user?.partition || 'patient-access' }}</p>
        </div>
      </div>
      <p v-if="loadError" class="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{{ loadError }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card">
        <p class="text-sm text-gray-500">Heart rate</p>
        <p class="text-2xl font-bold">{{ vital('8867-4') }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Blood pressure</p>
        <p class="text-2xl font-bold">{{ bloodPressure }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Temperature</p>
        <p class="text-2xl font-bold">{{ vital('8310-5') }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Next appointment</p>
        <p class="text-lg font-bold">{{ nextAppointment }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="card-title mb-3">Vital signs</h3>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500"><th class="pb-2">Observation</th><th>Value</th><th>Date</th></tr></thead>
          <tbody>
            <tr v-for="item in summary.vitals" :key="item.id" class="border-t">
              <td class="py-2">{{ item.display }}</td>
              <td>{{ item.value }} {{ item.unit }}</td>
              <td>{{ formatDate(item.date) }}</td>
            </tr>
            <tr v-if="!summary.vitals?.length"><td colspan="3" class="py-4 text-gray-500">No observations in the repository yet. Seed FHIR data first.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3 class="card-title mb-3">Conditions and medications</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="item in summary.conditions" :key="item.id">
            <span class="font-medium">{{ displayCode(item.code) }}</span>
            <span class="text-gray-500"> · {{ item.clinicalStatus?.coding?.[0]?.code }}</span>
          </li>
          <li v-for="item in summary.medications" :key="item.id" class="text-gray-700">
            {{ item.medicationCodeableConcept?.text || displayCode(item.medicationCodeableConcept) }}
          </li>
        </ul>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="card-title mb-3">Coverage (CARIN)</h3>
        <div v-for="item in summary.coverage" :key="item.id" class="text-sm">
          <p class="font-medium">{{ item.class?.[0]?.name || item.subscriberId }}</p>
          <p class="text-gray-500">Subscriber {{ item.subscriberId }} · {{ item.status }}</p>
        </div>
        <p v-if="!summary.coverage?.length" class="text-gray-500 text-sm">No coverage on file.</p>
      </div>
      <div class="card">
        <h3 class="card-title mb-3">Claims / EOB</h3>
        <div v-for="item in summary.eob" :key="item.id" class="text-sm border-b last:border-0 py-2">
          <p class="font-medium">{{ item.type?.coding?.[0]?.code }} claim</p>
          <p class="text-gray-500">{{ item.created }} · benefit {{ item.total?.[0]?.amount?.value }} {{ item.total?.[0]?.amount?.currency }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title mb-3">Care plans</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div v-for="plan in summary.carePlans" :key="plan.id" class="border rounded-lg p-4">
          <p class="font-medium">{{ plan.title }}</p>
          <p class="text-sm text-gray-600 mt-1">{{ plan.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { fhirAPI } from '@/services/api'

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    const user = computed(() => store.getters['auth/user'])
    const summary = ref({
      vitals: [],
      conditions: [],
      medications: [],
      carePlans: [],
      appointments: [],
      coverage: [],
      eob: []
    })
    const loadError = ref('')

    const patientName = computed(() => {
      const name = summary.value.patient?.name?.[0]
      if (name) {
        return `${(name.given || []).join(' ')} ${name.family || ''}`.trim()
      }
      return user.value?.name || 'Member'
    })

    const vital = (code) => {
      const found = summary.value.vitals?.find((item) => item.code === code)
      return found ? `${found.value} ${found.unit || ''}` : '—'
    }

    const bloodPressure = computed(() => {
      const sys = summary.value.vitals?.find((item) => item.code === '8480-6')
      const dia = summary.value.vitals?.find((item) => item.code === '8462-4')
      if (sys && dia) return `${sys.value}/${dia.value}`
      return sys ? String(sys.value) : '—'
    })

    const nextAppointment = computed(() => {
      const next = summary.value.appointments?.[0]
      return next?.date ? formatDate(next.date) : 'None'
    })

    const formatDate = (value) => {
      if (!value) return '—'
      return new Date(value).toLocaleString()
    }

    const displayCode = (codeable) => codeable?.text || codeable?.coding?.[0]?.display || '—'

    const load = async () => {
      const patientId = user.value?.fhirPatientId
      if (!patientId) {
        loadError.value = 'No patient context on this session. Sign in as demo or jordan, or complete a SMART launch.'
        return
      }
      try {
        const { data } = await fhirAPI.getSummary(patientId)
        summary.value = data.data
      } catch (error) {
        loadError.value = error.response?.data?.error || 'Unable to load Patient Access data. Is the FHIR repository seeded?'
      }
    }

    onMounted(load)

    return {
      user,
      summary,
      loadError,
      patientName,
      vital,
      bloodPressure,
      nextAppointment,
      formatDate,
      displayCode
    }
  }
}
</script>
