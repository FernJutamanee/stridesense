<script setup lang="ts">
import Dashboard from './Dashboard.vue'
</script>

<template>
  <div class="home-page">
    <header>
      <p class="eyebrow">StrideSense</p>
      <h1>Strava Running Analytics</h1>
      <p>Track your runs, metrics, and progress in one dashboard.</p>
    </header>

    <Dashboard />
  </div>
</template>

<style scoped>
.home-page { padding: 1.2rem; font-family: Arial, sans-serif; }
.eyebrow { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; color: #999; margin-bottom: 0.25rem; }
h1 { margin-top: 0; }
</style>