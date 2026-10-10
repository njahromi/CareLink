<template>
  <div class="card">
    <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
    <p class="mt-2 text-gray-600">
      This screen is a placeholder. Clinical data for the interview MVP lives on the
      <router-link class="text-blue-600 underline" to="/dashboard">Patient Access dashboard</router-link>
      and is served from the local FHIR R4 repository.
    </p>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'Placeholder',
  setup() {
    const route = useRoute()
    const title = computed(() => route.meta.title || route.name)
    return { title }
  }
}
</script>
