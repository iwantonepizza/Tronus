import { useQuery } from '@tanstack/react-query'
import {
  getFactionStats,
  getHeadToHeadStats,
  getLeaderboardStats,
  getOverviewStats,
  getPlayerStats,
  listFactionStats,
} from '@/api/stats'
import type { LeaderboardMetric } from '@/api/types'
import {
  toDomainFactionStats,
  toDomainHeadToHeadStats,
  toDomainLeaderboardStats,
  toDomainOverviewStats,
  toDomainPlayerStats,
} from '@/api/mappers'
import type { FactionSlug } from '@/types/domain'

export function useOverviewStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async () => toDomainOverviewStats(await getOverviewStats()),
    staleTime: 60 * 1000,
  })
}

export function usePlayerStats(userId?: number) {
  return useQuery({
    queryKey: ['stats', 'players', userId],
    queryFn: async () => {
      if (userId === undefined) {
        throw new Error('Missing user id.')
      }

      return toDomainPlayerStats(await getPlayerStats(userId))
    },
    enabled: userId !== undefined,
    staleTime: 60 * 1000,
  })
}

export function useFactionStatsList() {
  return useQuery({
    queryKey: ['stats', 'factions'],
    queryFn: async () => (await listFactionStats()).map(toDomainFactionStats),
    staleTime: 60 * 1000,
  })
}

export function useFactionStats(slug?: FactionSlug | string) {
  return useQuery({
    queryKey: ['stats', 'factions', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Missing faction slug.')
      }

      return toDomainFactionStats(await getFactionStats(slug))
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  })
}

export function useLeaderboardStats(metric: LeaderboardMetric, limit = 20) {
  return useQuery({
    queryKey: ['stats', 'leaderboard', metric, limit],
    queryFn: async () =>
      toDomainLeaderboardStats(await getLeaderboardStats({ limit, metric })),
    staleTime: 60 * 1000,
  })
}

export function useHeadToHeadStats(userA?: number, userB?: number) {
  return useQuery({
    queryKey: ['stats', 'head-to-head', userA, userB],
    queryFn: async () => {
      if (userA === undefined || userB === undefined) {
        throw new Error('Missing users for head-to-head query.')
      }

      return toDomainHeadToHeadStats(await getHeadToHeadStats({ userA, userB }))
    },
    enabled: userA !== undefined && userB !== undefined,
    staleTime: 60 * 1000,
  })
}
