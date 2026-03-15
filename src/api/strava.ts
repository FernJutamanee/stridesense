import type { Activity } from '../types/activity'

const BASE_URL = 'https://www.strava.com/api/v3'

export function getStravaAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const tokenResp = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
  })

  const json = await tokenResp.json()
  if (!tokenResp.ok) {
    throw new Error(`Strava token exchange failed: ${tokenResp.status} ${tokenResp.statusText} - ${JSON.stringify(json)}`)
  }
  return json as { access_token: string; refresh_token?: string; expires_at: number }
}

export async function fetchStravaActivities(accessToken: string): Promise<Activity[]> {
  const response = await fetch(`${BASE_URL}/athlete/activities`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Strava API fetch failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as Activity[]
}

export async function fetchAthlete(accessToken: string) {
  const response = await fetch(`${BASE_URL}/athlete`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Strava API fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
