<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import RunCard from '../components/RunCard.vue'
import StatsCard from '../components/StatsCard.vue'
import { computeActivitySummary, mapToRunCardData } from '../services/activityService'
import { fetchStravaActivities, fetchAthlete, getStravaAuthUrl, exchangeCodeForToken } from '../api/strava'
import type { Activity } from '../types/activity'

const activities = ref<Activity[]>([])
const athleteName = ref('')
const loading = ref(false)
const error = ref('')
const tokenInput = ref('')
const summary = computed(() => computeActivitySummary(activities.value))
const runCardData = computed(() => mapToRunCardData(activities.value))

const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || ''
const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET || ''
const redirectUri = window.location.origin

function getAuthorizeUrl() {
  if (!clientId) {
    throw new Error('VITE_STRAVA_CLIENT_ID ต้องถูกตั้งค่าใน .env')
  }
  return getStravaAuthUrl(clientId, redirectUri)
}

async function fetchRuns(accessToken: string) {
  loading.value = true
  error.value = ''
  try {
    const athlete = await fetchAthlete(accessToken)
    athleteName.value = athlete?.firstname ? `${athlete.firstname} ${athlete.lastname ?? ''}`.trim() : 'Strava User'

    const result = await fetchStravaActivities(accessToken)
    activities.value = result.filter((act) => act.type === 'Run')
    localStorage.setItem('strava_token', accessToken)
    tokenInput.value = accessToken
  } catch (err) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดขณะดึงข้อมูลจาก Strava'
  } finally {
    loading.value = false
  }
}

async function loginWithStrava() {
  if (!clientId) {
    error.value = 'กรุณากำหนด VITE_STRAVA_CLIENT_ID ใน .env'
    return
  }
  if (!clientSecret) {
    error.value = 'กรุณากำหนด VITE_STRAVA_CLIENT_SECRET ใน .env'
    return
  }
  window.location.href = getAuthorizeUrl()
}

async function exchangeAuthorizationCode(code: string) {
  if (!clientId || !clientSecret) {
    error.value = 'VITE_STRAVA_CLIENT_ID และ VITE_STRAVA_CLIENT_SECRET ต้องตั้งค่าใน .env'
    return
  }
  try {
    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri)
    await fetchRuns(tokenData.access_token)
  } catch (err) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'ไม่สามารถแลกโค้ดเป็น token ได้'
  }
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (code) {
    window.history.replaceState({}, document.title, window.location.pathname)
    await exchangeAuthorizationCode(code)
    return
  }

  const storedToken = localStorage.getItem('strava_token')
  if (storedToken) {
    await fetchRuns(storedToken)
  }
})
</script>

<template>
  <section class="dashboard">
    <h2>Running Analytics Dashboard</h2>
    <p>เชื่อมต่อกับ Strava ด้วย OAuth code flow แล้วดึงกิจกรรมอัตโนมัติ</p>

    <button class="login-btn" @click="loginWithStrava" :disabled="loading">{{ loading ? 'Loading...' : 'Login with Strava' }}</button>
    <p class="help">Login auto ใช้ OAuth code flow (scope=read,activity:read_all) แล้วโหลดกิจกรรม</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="activities.length > 0">
      <p class="user">Logged in as {{ athleteName }}</p>
      <div class="stats-grid">
        <StatsCard label="Total Runs" :value="summary.runCount" />
        <StatsCard label="Total Distance (m)" :value="summary.totalDistance.toFixed(0)" />
        <StatsCard label="Total Time (s)" :value="summary.totalTime.toFixed(0)" />
        <StatsCard label="Avg Pace (s/km)" :value="summary.avgPace.toFixed(1)" />
      </div>

      <div class="run-list">
        <h3>Recent Runs</h3>
        <RunCard v-for="run in runCardData" :key="run.id" :run="run" />
      </div>
    </div>

    <div v-else class="empty-state">
      <p>ยังไม่มีข้อมูลกิจกรรม ให้กด Login with Strava แล้วอนุญาต</p>
    </div>
  </section>
</template>

<style scoped>
.dashboard { padding: 1rem 0; }
.token-box { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.token-box input { flex: 1; min-width: 200px; padding: 0.45rem; border: 1px solid #ccc; border-radius: 6px; }
.token-box button { padding: 0.45rem 0.8rem; border: none; border-radius: 6px; background: #1d4ed8; color: #fff; cursor: pointer; }
.token-box button:disabled { background: #94a3b8; cursor: not-allowed; }
.help { margin: 0.35rem 0; color: #333; font-size: 0.9rem; }
.error { color: #b91c1c; margin: 0.5rem 0; }
.user { font-size: 0.95rem; margin-bottom: 0.6rem; color: #1f2937; }
.stats-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 1rem; }
.run-list { margin-top: 1rem; }
.empty-state { margin-top: 1rem; color: #555; }
</style>