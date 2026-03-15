<script setup lang="ts">
import Dashboard from './Dashboard.vue'
</script>

<template>
  <div class="home-page min-h-screen bg-white text-slate-900">
    <div class="head-bar border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-white/50 backdrop-blur-sm">
      <div>
        <p class="text-xs uppercase tracking-widest text-slate-400 font-medium">StrideSense</p>
        <h1 class="text-2xl font-light text-slate-900 mt-1">Strava Running Analytics</h1>
      </div>
    </div>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <Dashboard />
    </main>

    <footer class="border-t border-slate-100 px-6 py-6 mt-12 text-center text-xs text-slate-400">
      <p>© 2026 StrideSense. Built with Vue 3 + Strava API by FernOnTheRun</p>
    </footer>
  </div>
</template>

<style scoped>
.home-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }
</style>