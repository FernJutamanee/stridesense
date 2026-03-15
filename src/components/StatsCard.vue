<script setup lang="ts">
const props = defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="stats-card">
    <p class="label">{{ props.label }}</p>
    <strong>{{ props.value }}</strong>
  </div>
</template>

<style scoped>
.stats-card { background-color: #fff; border: 1px solid #e1e1e1; border-radius: 10px; padding: 0.7rem; box-shadow: 0 2px 6px rgba(0,0,0,.02); }
.label { font-size: 0.75rem; color: #666; margin: 0 0 0.2rem; }
</style>