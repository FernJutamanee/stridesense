import type { Activity, ActivitySummary } from '../types/activity'

export function computeActivitySummary(activities: Activity[]): ActivitySummary {
  const totalDistance = activities.reduce((acc, activity) => acc + (activity.distance ?? 0), 0)
  const totalTime = activities.reduce((acc, activity) => acc + (activity.moving_time ?? 0), 0)
  const runCount = activities.length

  const runsWithPace = activities
    .filter((a) => a.distance > 0)
    .map((a) => ({
      pace: a.moving_time / (a.distance / 1000),
      date: a.start_date,
    }))

  const bestRun = runsWithPace.reduce<{ pace: number; date: string } | null>((best, current) => {
    if (!best) return current
    return current.pace < best.pace ? current : best
  }, null)

  return {
    runCount,
    totalDistance,
    totalTime,
    avgPace: runCount > 0 ? totalTime / (totalDistance / 1000) : 0,
    bestPace: bestRun ? bestRun.pace : 0,
    bestPaceDate: bestRun ? bestRun.date : null,
  }
}

export function mapToRunCardData(activities: Activity[]) {
  return activities.map((activity) => ({
    id: String(activity.id),
    name: activity.name,
    distance: activity.distance,
    movingTime: activity.moving_time,
    startDate: activity.start_date,
  }))
}
