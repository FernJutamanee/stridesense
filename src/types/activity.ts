export interface Activity {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time?: number
  total_elevation_gain?: number
  type: string
  start_date: string
  average_speed?: number
  max_speed?: number
}

export interface ActivitySummary {
  runCount: number
  totalDistance: number
  totalTime: number
  avgPace: number
  bestPace: number
  bestPaceDate: string | null
}
