import type { Activity, ActivitySummary } from '../types/activity'

export function computeActivitySummary(activities: Activity[]): ActivitySummary {
  const totalDistance = activities.reduce((acc, activity) => acc + (activity.distance ?? 0), 0)
  const totalTime = activities.reduce((acc, activity) => acc + (activity.moving_time ?? 0), 0)
  const runCount = activities.length

  return {
    runCount,
    totalDistance,
    totalTime,
    avgPace: runCount > 0 ? totalTime / (totalDistance / 1000) : 0,
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
