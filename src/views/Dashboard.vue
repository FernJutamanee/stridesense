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
const selectedMonth = ref('all')
const lastFetchedAt = ref<number | null>(null)

const filteredActivities = computed(() => {
  if (selectedMonth.value === 'all') return activities.value
  return activities.value.filter((act) => {
    const month = new Date(act.start_date).toISOString().slice(0, 7)
    return month === selectedMonth.value
  })
})

const monthOptions = computed(() => {
  const months = new Set<string>()
  activities.value.forEach((act) => {
    months.add(new Date(act.start_date).toISOString().slice(0, 7))
  })
  return ['all', ...Array.from(months).sort((a, b) => b.localeCompare(a))]
})

const summary = computed(() => computeActivitySummary(filteredActivities.value))
const runCardData = computed(() => mapToRunCardData(filteredActivities.value))
const lastFetchedDays = computed(() => {
  if (!lastFetchedAt.value) return null
  const days = Math.floor((Date.now() - lastFetchedAt.value) / (1000 * 60 * 60 * 24))
  return days
})

const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || ''
const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET || ''
const redirectUri = window.location.origin
const cacheKey = 'strava_activity_cache_v1'
const cacheTtlMs = 1000 * 60 * 60 * 24 // 24 hr

function getAuthorizeUrl() {
  if (!clientId) {
    throw new Error('VITE_STRAVA_CLIENT_ID ต้องถูกตั้งค่าใน .env')
  }
  return getStravaAuthUrl(clientId, redirectUri)
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function formatPace(totalSeconds: number, totalDistance: number) {
  if (totalDistance <= 0) return '0:00 /km'
  const paceSeconds = totalSeconds / (totalDistance / 1000)
  const m = Math.floor(paceSeconds / 60)
  const s = Math.round(paceSeconds % 60)
  return `${m}:${s.toString().padStart(2, '0')} /km`
}

function saveCache(data: Activity[]) {
  const payload = { ts: Date.now(), runs: data }
  localStorage.setItem(cacheKey, JSON.stringify(payload))
  lastFetchedAt.value = payload.ts
}

function loadCache(): Activity[] | null {
  const raw = localStorage.getItem(cacheKey)
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as { ts: number; runs: Activity[] }
    if (Date.now() - obj.ts > cacheTtlMs) return null
    lastFetchedAt.value = obj.ts
    return obj.runs
  } catch {
    return null
  }
}

async function fetchRuns(accessToken: string, bypassCache = false) {
  loading.value = true
  error.value = ''
  try {
    const athlete = await fetchAthlete(accessToken)
    athleteName.value = athlete?.firstname ? `${athlete.firstname} ${athlete.lastname ?? ''}`.trim() : 'Strava User'

    const cached = !bypassCache ? loadCache() : null
    if (cached) {
      activities.value = cached
      loading.value = false
      return
    }

    const result = await fetchStravaActivities(accessToken)
    const runs = result.filter((act) => act.type === 'Run')
    activities.value = runs
    saveCache(runs)
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
    await fetchRuns(tokenData.access_token, true)
  } catch (err) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'ไม่สามารถแลกโค้ดเป็น token ได้'
  }
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const accessTokenFromUrl = params.get('access_token')

  if (code) {
    window.history.replaceState({}, document.title, window.location.pathname)
    await exchangeAuthorizationCode(code)
    return
  }

  if (accessTokenFromUrl) {
    window.history.replaceState({}, document.title, window.location.pathname)
    await fetchRuns(accessTokenFromUrl)
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

    <div class="actions">
      <button class="login-btn" @click="loginWithStrava" :disabled="loading">{{ loading ? 'Loading...' : 'Login with Strava' }}</button>
      <button class="refresh-btn" @click="fetchRuns(tokenInput, true)" :disabled="loading || !tokenInput">Refresh</button>
      <select v-model="selectedMonth" class="month-select">
        <option v-for="month in monthOptions" :key="month" :value="month">{{ month === 'all' ? 'ทุกเดือน' : month }}</option>
      </select>
    </div>
    <div class="meta">
      <p class="help">Login auto (code flow) และ refresh เท่าที่จำเป็น (เก็บข้อมูล 24 ชม.)</p>
      <p class="help">ข้อมูลล่าสุด: <span v-if="lastFetchedAt">{{ lastFetchedDays === 0 ? 'วันนี้' : lastFetchedDays + ' วันก่อน' }}</span><span v-else>ยังไม่มีข้อมูล</span></p>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="activities.length > 0">
      <p class="user">Logged in as {{ athleteName }}</p>
      <div class="stats-grid">
        <StatsCard label="Total Runs" :value="summary.runCount" />
        <StatsCard label="Total Distance" :value="(summary.totalDistance / 1000).toFixed(2) + ' km'" />
        <StatsCard label="Total Time" :value="formatDuration(summary.totalTime)" />
        <StatsCard label="Avg Pace" :value="formatPace(summary.totalTime, summary.totalDistance)" />
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
.actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
.login-btn, .refresh-btn { padding: 0.45rem 0.8rem; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
.login-btn { background: #1d4ed8; }
.refresh-btn { background: #10b981; }
.login-btn:disabled, .refresh-btn:disabled { background: #94a3b8; cursor: not-allowed; }
.help { margin: 0.35rem 0; color: #333; font-size: 0.9rem; }
.error { color: #b91c1c; margin: 0.5rem 0; }
.user { font-size: 0.95rem; margin-bottom: 0.6rem; color: #1f2937; }
.stats-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 1rem; }
.run-list { margin-top: 1rem; }
.empty-state { margin-top: 1rem; color: #555; }
</style>