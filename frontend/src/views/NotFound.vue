<template>
  <div class="card text-center">
    <h1 class="text-2xl font-bold text-gray-900">Page not found</h1>
    <p class="mt-2 text-gray-600">The route you requested is not part of the CareLink platform.</p>
    <router-link to="/dashboard" class="btn-primary inline-block mt-4">Back to dashboard</router-link>
  </div>
</template>

<script>
export default { name: 'NotFound' }
</script>
