import { api } from '@/api/client'
import type {
  ApiFactionStats,
  ApiHeadToHeadSuggested,
  ApiHeadToHeadStats,
  ApiLeaderboardStats,
  ApiOverviewStats,
  ApiPlayerStats,
  LeaderboardMetric,
} from '@/api/types'

export function getOverviewStats() {
  return api<ApiOverviewStats>('/stats/overview/')
}

export function getPlayerStats(userId: number) {
  return api<ApiPlayerStats>(`/stats/players/${userId}/`)
}

export function listFactionStats() {
  return api<ApiFactionStats[]>('/stats/factions/')
}

export function getFactionStats(slug: string) {
  return api<ApiFactionStats>(`/stats/factions/${slug}/`)
}

export function getLeaderboardStats(params: {
  limit?: number
  metric?: LeaderboardMetric
}) {
  const query = new URLSearchParams()

  if (params.metric) {
    query.set('metric', params.metric)
  }

  if (params.limit) {
    query.set('limit', String(params.limit))
  }

  const suffix = query.toString()
  return api<ApiLeaderboardStats>(
    suffix ? `/stats/leaderboard/?${suffix}` : '/stats/leaderboard/',
  )
}

export function getHeadToHeadStats(params: { userA: number; userB: number }) {
  const query = new URLSearchParams({
    user_a: String(params.userA),
    user_b: String(params.userB),
  })

  return api<ApiHeadToHeadStats>(`/stats/head-to-head/?${query.toString()}`)
}

export function getSuggestedHeadToHeadOpponent(forUser: number) {
  const query = new URLSearchParams({
    for_user: String(forUser),
  })

  return api<ApiHeadToHeadSuggested>(
    `/stats/head-to-head/suggested/?${query.toString()}`,
  )
}
