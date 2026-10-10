<template>
  <div class="flex gap-6">
    <aside class="w-56 shrink-0 bg-white border border-gray-200 rounded-lg p-3 h-fit">
      <p class="text-xs font-semibold uppercase text-gray-500 px-2 mb-2">Platform Admin</p>
      <button
        v-for="item in tabs"
        :key="item.id"
        class="w-full text-left px-3 py-2 rounded-md text-sm mb-1"
        :class="tab === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </aside>

    <section class="flex-1 space-y-4">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{{ error }}</div>

      <div v-if="tab === 'overview'" class="space-y-4">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="card">
            <p class="text-sm text-gray-500">FHIR repository</p>
            <p class="text-xl font-semibold">{{ overview?.fhir?.status || 'unknown' }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ overview?.fhir?.software }} · {{ overview?.fhir?.responseTimeMs }}ms</p>
          </div>
          <div class="card">
            <p class="text-sm text-gray-500">Postgres</p>
            <p class="text-xl font-semibold">{{ overview?.postgres?.status || 'unknown' }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ overview?.postgres?.resourceCount ?? '—' }} resources</p>
          </div>
          <div class="card">
            <p class="text-sm text-gray-500">Export queue</p>
            <p class="text-xl font-semibold">{{ overview?.exportQueue ?? 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ overview?.metrics?.fhirReads || 0 }} reads · {{ overview?.metrics?.ingestAttempts || 0 }} ingest</p>
          </div>
        </div>
        <div class="card text-sm text-gray-600">
          Smile analog: cluster / node health. CareLink probes HAPI <code>/metadata</code> and the HFJ_* Postgres store.
        </div>
      </div>

      <div v-if="tab === 'modules'" class="card">
        <h2 class="card-title mb-4">Modules</h2>
        <div v-for="item in modules" :key="item.id" class="flex items-center justify-between border-b py-3">
          <div>
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-xs text-gray-500">Smile: {{ item.smileAnalog }} — {{ item.description }}</p>
          </div>
          <button class="text-sm px-3 py-1 rounded" :class="item.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'" @click="toggleModule(item)">
            {{ item.enabled ? 'Enabled' : 'Disabled' }}
          </button>
        </div>
      </div>

      <div v-if="tab === 'repositories'" class="card">
        <h2 class="card-title">FHIR R4 repository</h2>
        <p class="text-sm text-gray-600 mt-2">{{ repository?.engine }} · {{ repository?.url }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ repository?.smileAnalog }}</p>
        <table class="w-full text-sm mt-4">
          <tr v-for="(count, type) in repository?.resourceCounts || {}" :key="type" class="border-t">
            <td class="py-2">{{ type }}</td>
            <td>{{ count }}</td>
          </tr>
        </table>
      </div>

      <div v-if="tab === 'partitions'" class="card space-y-4">
        <h2 class="card-title">Partitions</h2>
        <div v-for="item in partitions" :key="item.id" class="border rounded p-3">
          <p class="font-medium">{{ item.name }} <span class="text-xs text-gray-500">({{ item.id }})</span></p>
          <p class="text-sm text-gray-600">{{ item.program }} — {{ item.description }}</p>
        </div>
        <form class="grid md:grid-cols-4 gap-2" @submit.prevent="createPartition">
          <input v-model="newPartition.id" class="form-input border px-2 py-1" placeholder="id" />
          <input v-model="newPartition.name" class="form-input border px-2 py-1" placeholder="name" />
          <input v-model="newPartition.program" class="form-input border px-2 py-1" placeholder="program" />
          <button class="btn-primary">Add partition</button>
        </form>
      </div>

      <div v-if="tab === 'channels'" class="space-y-4">
        <div class="card">
          <h2 class="card-title">JSON Bundle ingest channel</h2>
          <p class="text-sm text-gray-600 mt-1">Smile analog: Apache Camel channel. POST a transaction Bundle into a partition.</p>
          <select v-model="ingestPartition" class="form-input border px-2 py-1 mt-3">
            <option v-for="item in partitions" :key="item.id" :value="item.id">{{ item.id }}</option>
          </select>
          <textarea v-model="ingestJson" rows="10" class="w-full border rounded mt-3 font-mono text-xs p-2" />
          <button class="btn-primary mt-3" @click="runIngest">Ingest bundle</button>
        </div>
        <div class="card">
          <h3 class="font-medium mb-2">Channel history</h3>
          <div v-for="item in channels.history" :key="item.id" class="text-sm border-b py-2">
            {{ item.at }} · {{ item.success ? 'OK' : 'FAIL' }} · {{ item.message || item.error }} · {{ item.partition }}
          </div>
        </div>
      </div>

      <div v-if="tab === 'security'" class="card">
        <h2 class="card-title mb-3">SMART clients and users</h2>
        <h3 class="text-sm font-semibold mt-4">Clients</h3>
        <div v-for="client in security.clients" :key="client.client_id" class="text-sm border-b py-2">
          <p class="font-medium">{{ client.name }} ({{ client.client_id }})</p>
          <p class="text-gray-500">{{ client.type }} · PKCE {{ client.pkce_required ? 'required' : 'optional' }} · {{ client.grant_types.join(', ') }}</p>
        </div>
        <h3 class="text-sm font-semibold mt-4">Users</h3>
        <div v-for="person in security.users" :key="person.username" class="text-sm border-b py-2">
          {{ person.username }} · {{ person.role }} · {{ person.fhirPatientId || 'no patient context' }} · {{ person.partition }}
        </div>
      </div>

      <div v-if="tab === 'audit'" class="card">
        <h2 class="card-title mb-3">Audit events</h2>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500"><th class="pb-2">Time</th><th>Agent</th><th>Action</th><th>Entity</th><th>Outcome</th></tr></thead>
          <tbody>
            <tr v-for="item in audit.memory" :key="item.id" class="border-t">
              <td class="py-2">{{ item.recorded }}</td>
              <td>{{ item.agent }}</td>
              <td>{{ item.action }}</td>
              <td>{{ item.entity }}</td>
              <td>{{ item.outcome }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tab === 'apis'" class="space-y-4">
        <div class="card text-sm space-y-1">
          <p><strong>Patient Access:</strong> {{ apis?.patientAccess }}</p>
          <p><strong>SMART authorize:</strong> {{ apis?.smartLaunch }}</p>
          <p><strong>SMART config:</strong> {{ apis?.smartConfiguration }}</p>
          <p><strong>Bulk $export:</strong> {{ apis?.bulkExport }}</p>
        </div>
        <div class="card">
          <div class="flex justify-between items-center">
            <h2 class="card-title">Bulk Data $export</h2>
            <button class="btn-primary" @click="startExport">Start export</button>
          </div>
          <p class="text-sm text-gray-600 mt-2">Same job pattern used for Provider Access and Payer-to-Payer bulk exchange.</p>
          <div v-for="job in jobs" :key="job.id" class="border rounded p-3 mt-3 text-sm">
            <p class="font-medium">{{ job.id }} · {{ job.status }}</p>
            <p class="text-gray-500">{{ job.types.join(', ') }}</p>
            <ul class="mt-2">
              <li v-for="file in job.output" :key="file.type">
                {{ file.type }} ({{ file.count }}) —
                <a class="text-blue-600" :href="fileUrl(file.url)" target="_blank">NDJSON</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { adminAPI, fhirAPI } from '@/services/api'
import { toast } from 'vue3-toastify'

const sampleBundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [{
    resource: {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
      subject: { reference: 'Patient/alex-rivera' },
      valueQuantity: { value: 74, unit: 'beats/min', system: 'http://unitsofmeasure.org', code: '/min' }
    },
    request: { method: 'POST', url: 'Observation' }
  }]
}

export default {
  name: 'Admin',
  setup() {
    const store = useStore()
    const tab = ref('overview')
    const error = ref('')
    const jobs = ref([])
    const ingestPartition = ref('payer-internal')
    const ingestJson = ref(JSON.stringify(sampleBundle, null, 2))
    const newPartition = reactive({ id: '', name: '', program: '' })
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'modules', label: 'Modules' },
      { id: 'repositories', label: 'Repositories' },
      { id: 'partitions', label: 'Partitions' },
      { id: 'channels', label: 'Channels' },
      { id: 'security', label: 'Security' },
      { id: 'audit', label: 'Audit' },
      { id: 'apis', label: 'APIs / Export' }
    ]

    const overview = computed(() => store.state.platform.overview)
    const modules = computed(() => store.state.platform.modules)
    const repository = computed(() => store.state.platform.repository)
    const partitions = computed(() => store.state.platform.partitions)
    const channels = computed(() => store.state.platform.channels)
    const security = computed(() => store.state.platform.security)
    const audit = computed(() => store.state.platform.audit)
    const apis = computed(() => store.state.platform.apis)

    const refresh = async () => {
      try {
        await store.dispatch('platform/loadAll')
        const { data } = await fhirAPI.listExportJobs()
        jobs.value = data.data
      } catch (err) {
        error.value = err.response?.data?.error || err.message
      }
    }

    const toggleModule = async (item) => {
      await adminAPI.updateModule(item.id, !item.enabled)
      await store.dispatch('platform/loadModules')
    }

    const createPartition = async () => {
      await adminAPI.createPartition(newPartition)
      newPartition.id = ''
      newPartition.name = ''
      newPartition.program = ''
      await store.dispatch('platform/loadPartitions')
    }

    const runIngest = async () => {
      try {
        const bundle = JSON.parse(ingestJson.value)
        await adminAPI.ingest(bundle, ingestPartition.value)
        toast.success('Ingest submitted')
        await store.dispatch('platform/loadChannels')
        await store.dispatch('platform/loadAudit')
      } catch (err) {
        toast.error(err.response?.data?.error || err.message)
      }
    }

    const startExport = async () => {
      try {
        await fhirAPI.startExport({ _type: 'Patient,Observation,Coverage,ExplanationOfBenefit', partition: 'patient-access' })
        toast.success('Export accepted')
        const poll = async () => {
          const { data } = await fhirAPI.listExportJobs()
          jobs.value = data.data
          if (data.data.some((job) => job.status === 'accepted' || job.status === 'in-progress')) {
            setTimeout(poll, 1500)
          }
        }
        poll()
      } catch (err) {
        toast.error(err.response?.data?.error || err.message)
      }
    }

    const fileUrl = (path) => {
      const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '')
      return `${base}${path}`
    }

    onMounted(refresh)

    return {
      tab,
      tabs,
      error,
      overview,
      modules,
      repository,
      partitions,
      channels,
      security,
      audit,
      apis,
      jobs,
      ingestPartition,
      ingestJson,
      newPartition,
      toggleModule,
      createPartition,
      runIngest,
      startExport,
      fileUrl
    }
  }
}
</script>
