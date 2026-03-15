<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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

const dataMonths = computed(() => monthOptions.value.length > 0 ? monthOptions.value.length - 1 : 0)

const summary = computed(() => computeActivitySummary(filteredActivities.value))
const pageSize = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredActivities.value.length / pageSize)))
const pagedActivities = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredActivities.value.slice(start, start + pageSize)
})
const runCardData = computed(() => mapToRunCardData(pagedActivities.value))

watch(filteredActivities, () => {
  currentPage.value = 1
})

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
    const cached = !bypassCache ? loadCache() : null
    if (cached) {
      activities.value = cached
      const cachedName = localStorage.getItem('strava_athlete_name')
      athleteName.value = cachedName || 'Strava User'
      loading.value = false
      return
    }

    const athlete = await fetchAthlete(accessToken)
    athleteName.value = athlete?.firstname ? `${athlete.firstname} ${athlete.lastname ?? ''}`.trim() : 'Strava User'
    localStorage.setItem('strava_athlete_name', athleteName.value)

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

  const cachedRuns = loadCache()
  if (cachedRuns) {
    activities.value = cachedRuns
    const storedToken = localStorage.getItem('strava_token')
    const cachedName = localStorage.getItem('strava_athlete_name')
    if (storedToken) tokenInput.value = storedToken
    athleteName.value = cachedName || 'Strava User'
    return
  }

  const storedToken = localStorage.getItem('strava_token')
  if (storedToken) {
    await fetchRuns(storedToken)
  }
})
</script>

<template>
  <section class="dashboard max-w-4xl mx-auto px-4 py-6 sm:px-6">
    <div v-motion="{ initial: { opacity: 0, y: 20 }, enter: { opacity: 1, y: 0, transition: { duration: 0.35 } } }" class="bg-white rounded-lg border border-slate-100 p-6 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-light text-slate-900">Running Analytics Dashboard</h2>
          <p class="text-sm text-slate-500 mt-1">Connect with Strava to see your running metrics</p>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <button class="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-sm text-sm font-medium transition" @click="loginWithStrava" :disabled="loading">{{ loading ? 'Loading...' : 'Login with Strava' }}</button>
          <button class="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-sm text-sm font-medium transition" @click="fetchRuns(tokenInput, true)" :disabled="loading || !tokenInput">Refresh</button>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <select v-model="selectedMonth" class="rounded-sm border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300">
          <option v-for="month in monthOptions" :key="month" :value="month">{{ month === 'all' ? 'All months' : month }}</option>
        </select>
        <div class="text-xs text-slate-500 space-y-1">
          <p>Last fetched: <span class="font-medium text-slate-700">{{ lastFetchedAt ? (lastFetchedDays === 0 ? 'Today' : lastFetchedDays + ' days ago') : 'No data' }}</span></p>
          <p>Data spans: <span class="font-medium text-slate-700">{{ dataMonths }} months</span></p>
        </div>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="activities.length > 0" class="mt-8">
      <p class="text-sm text-slate-600 mb-4">Logged in as <span class="font-semibold text-slate-900">{{ athleteName }}</span></p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
    <p class="text-xs text-blue-600 uppercase tracking-wider">Total Runs</p>
    <p class="text-2xl font-semibold text-blue-900 mt-2">
      {{ summary.runCount }}
    </p>
  </div>

  <div class="bg-purple-50 border border-purple-100 rounded-xl p-4">
    <p class="text-xs text-purple-600 uppercase tracking-wider">Total Distance</p>
    <p class="text-2xl font-semibold text-purple-900 mt-2">
      {{ (summary.totalDistance / 1000).toFixed(2) }} km
    </p>
  </div>

  <div class="bg-green-50 border border-green-100 rounded-xl p-4">
    <p class="text-xs text-green-600 uppercase tracking-wider">Total Time</p>
    <p class="text-2xl font-semibold text-green-900 mt-2">
      {{ formatDuration(summary.totalTime) }}
    </p>
  </div>

  <div class="bg-orange-50 border border-orange-100 rounded-xl p-4">
    <p class="text-xs text-orange-600 uppercase tracking-wider">Fastest Pace</p>
    <p class="text-2xl font-semibold text-orange-900 mt-2">
      {{ formatPace(summary.bestPace, 1000) }}
    </p>
    <p class="text-xs text-orange-500 mt-1">
      {{ summary.bestPaceDate ? new Date(summary.bestPaceDate).toLocaleDateString() : 'No data' }}
    </p>
  </div>

</div>

      <div class="bg-white rounded-lg border border-slate-100 p-6 shadow-sm">
        <div class="mb-5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h3 class="text-lg font-light text-slate-900">Recent Runs</h3>
              <p class="text-xs text-slate-500 mt-1">{{ pagedActivities.length }} activity · showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredActivities.length) }} of {{ filteredActivities.length }}</p>
            </div>
            <div class="flex gap-1 items-center text-xs">
              <button class="px-2.5 py-1.5 rounded-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition" :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">← Prev</button>
              <span class="px-3 py-1.5 text-slate-600 font-medium">{{ currentPage }} / {{ totalPages }}</span>
              <button class="px-2.5 py-1.5 rounded-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition" :disabled="currentPage >= totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next →</button>
            </div>
          </div>
        </div>
        <div class="space-y-2.5">
          <RunCard v-for="run in runCardData" :key="run.id" :run="run" />
        </div>
      </div>
    </div>

    <div v-else class="mt-8 p-8 bg-slate-50 border border-slate-100 rounded-lg text-center">
      <p class="text-slate-600">No activity yet. Click "Login with Strava" to get started.</p>
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