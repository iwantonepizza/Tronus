import { api } from '@/api/client'

export interface SearchResults {
  users: Array<{ id: number; nickname: string }>
  sessions: Array<{ id: number; planning_note: string; status: string; scheduled_at: string }>
  factions: Array<{ slug: string; name: string }>
}

export function searchAll(q: string) {
  return api<SearchResults>(`/search/?q=${encodeURIComponent(q)}`)
}
