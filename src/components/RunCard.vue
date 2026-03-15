<script setup lang="ts">
type Run = {
  id: string
  name: string
  distance: number
  movingTime: number
  startDate: string
}

const props = defineProps<{ run: Run }>()

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
</script>

<template>
  <article class="run-card">
    <div>
      <h4>{{ props.run.name }}</h4>
      <p>{{ new Date(props.run.startDate).toLocaleDateString() }}</p>
    </div>
    <div class="metrics">
      <small>{{ (props.run.distance / 1000).toFixed(2) }} km</small>
      <small>{{ formatDuration(props.run.movingTime) }}</small>
    </div>
  </article>
</template>

<style scoped>
.run-card { border: 1px solid #ddd; border-radius: 8px; padding: 0.7rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
.metrics { text-align: right; }
</style>