<script setup lang="ts">
const props = defineProps<{ run: any }>()

function getRunEmoji(date: string) {
  const hour = new Date(date).getHours()

  if (hour >= 5 && hour < 12) return "🌅"
  if (hour >= 12 && hour < 17) return "☀️"
  if (hour >= 17 && hour < 20) return "🌇"
  return "🌙"
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

function formatPace(totalSeconds: number, totalDistance: number) {
  if (totalDistance <= 0) return "0:00 /km"

  const paceSeconds = totalSeconds / (totalDistance / 1000)
  const m = Math.floor(paceSeconds / 60)
  const s = Math.round(paceSeconds % 60)

  return `${m}:${s.toString().padStart(2, "0")} /km`
}
</script>

<template>
  <article
    v-motion="{ initial: { opacity: 0, y: 6 }, enter: { opacity: 1, y: 0, transition: { duration: 0.2 } } }"
    class="bg-white border border-slate-200 rounded-xl px-5 py-4 flex justify-between items-center hover:shadow-md hover:border-slate-300 transition"
  >

    <!-- LEFT -->
    <div>
      <h4 class="text-sm font-semibold text-slate-900">
        {{ getRunEmoji(props.run.startDate) }} {{ props.run.name }}
      </h4>

      <p class="text-xs text-slate-500 mt-1">
        {{ new Date(props.run.startDate).toLocaleDateString() }}
      </p>
    </div>

    <!-- RIGHT STATS -->
    <div class="flex items-center gap-6 text-right">

      <div>
        <p class="text-lg font-semibold text-slate-900">
          {{ (props.run.distance / 1000).toFixed(2) }}
        </p>
        <p class="text-[11px] text-slate-500 uppercase">km</p>
      </div>

      <div>
        <p class="text-sm text-slate-800">
          {{ formatDuration(props.run.movingTime) }}
        </p>
        <p class="text-[11px] text-slate-500 uppercase">time</p>
      </div>

      <div>
        <p class="text-sm text-slate-800">
          {{ formatPace(props.run.movingTime, props.run.distance) }}
        </p>
        <p class="text-[11px] text-slate-500 uppercase">pace</p>
      </div>

    </div>
  </article>
</template>