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

function formatPace(movingTime: number, distance: number) {
  if (!distance) return '0:00 /km'
  const paceSec = movingTime / (distance / 1000)
  const m = Math.floor(paceSec / 60)
  const s = Math.round(paceSec % 60)
  return `${m}:${s.toString().padStart(2, '0')} /km`
}
</script>

<template>
  <article v-motion="{ initial: { opacity: 0, y: 6 }, enter: { opacity: 1, y: 0, transition: { duration: 0.2 } } }" class="bg-white border border-slate-100 rounded-lg p-4 hover:shadow-sm transition flex justify-between items-start gap-4">
    <div class="flex-1">
      <h4 class="text-sm font-medium text-slate-900">{{ props.run.name }}</h4>
      <p class="text-xs text-slate-500 mt-1">{{ new Date(props.run.startDate).toLocaleDateString() }}</p>
    </div>
    <div class="text-right space-y-1">
      <div class="text-sm font-light text-slate-900">{{ (props.run.distance / 1000).toFixed(2) }}</div>
      <div class="text-xs text-slate-600">{{ formatDuration(props.run.movingTime) }}</div>
      <div class="text-xs text-slate-500">{{ formatPace(props.run.movingTime, props.run.distance) }}</div>
    </div>
  </article>
</template>

<style scoped>
/* no custom styles needed */
</style>