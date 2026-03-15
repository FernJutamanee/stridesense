<script setup lang="ts">
const props = defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="stats-card bg-slate-50 border border-slate-100 rounded-lg p-4 hover:border-slate-200 transition">
    <p class="text-xs uppercase tracking-wider text-slate-500">{{ props.label }}</p>
    <p class="text-2xl font-light text-slate-900 mt-2">{{ props.value }}</p>
  </div>
</template>

<style scoped>
/* minimal styles */
</style>