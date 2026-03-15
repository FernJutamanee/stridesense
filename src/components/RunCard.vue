<script setup lang="ts">
type Run = {
  id: string
  name: string
  distance: number
  movingTime: number
  startDate: string
}

const props = defineProps<{ run: Run }>()
</script>

<template>
  <article class="run-card">
    <div>
      <h4>{{ props.run.name }}</h4>
      <p>{{ new Date(props.run.startDate).toLocaleDateString() }}</p>
    </div>
    <div class="metrics">
      <small>{{ props.run.distance }} m</small>
      <small>{{ props.run.movingTime }} s</small>
    </div>
  </article>
</template>

<style scoped>
.run-card { border: 1px solid #ddd; border-radius: 8px; padding: 0.7rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
.metrics { text-align: right; }
</style>