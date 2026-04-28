export type FactionSlug =
  | 'stark'
  | 'lannister'
  | 'baratheon'
  | 'greyjoy'
  | 'tyrell'
  | 'martell'
  | 'tully'
  | 'arryn'
  | 'targaryen'

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface Faction {
  slug: FactionSlug
  name: string
  color: string
  on_primary?: string
  sigil?: string | null
}

export interface GameMode {
  slug: string
  name: string
  min_players: number
  max_players: number
  description?: string
}

export interface Deck {
  slug: string
  name: string
  description?: string
}

export interface PublicUser {
  id: number
  nickname: string
  favorite_faction: FactionSlug | null
  current_avatar: string | null
  date_joined: string
}

export interface PrivateUser extends PublicUser {
  username: string
  email: string
  is_active: boolean
  bio: string
}

export interface UpdateProfilePayload {
  nickname?: string
  favorite_faction?: FactionSlug | null
  bio?: string
}

export interface RegisterPayload {
  email: string
  password: string
  nickname: string
}

export interface RegisterResponse {
  id: number
  status: 'pending_approval'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface CsrfResponse {
  detail: string
}

export type SessionStatus = 'planned' | 'completed' | 'cancelled'

export type EndReason =
  | 'castles_7'
  | 'timer'
  | 'rounds_end'
  | 'early'
  | 'other'

export interface PaginatedResponse<T> {
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiUserSummary {
  id: number
  nickname: string
}

export interface ApiSessionListItem {
  id: number
  scheduled_at: string
  status: SessionStatus
  mode: string
  deck: string
  created_by: ApiUserSummary
  planning_note: string
}

export interface ApiParticipation {
  id: number
  user: ApiUserSummary
  faction: FactionSlug
  place: number | null
  castles: number | null
  is_winner: boolean
  notes: string
}

export interface ApiOutcome {
  rounds_played: number
  end_reason: EndReason
  mvp: ApiUserSummary | null
  final_note: string
}

export interface ApiSessionDetail extends ApiSessionListItem {
  participations: ApiParticipation[]
  outcome: ApiOutcome | null
}

export interface SessionListFilters {
  status?: SessionStatus
  userId?: number
  from?: string
  to?: string
  limit?: number
}

export interface SessionWritePayload {
  scheduled_at?: string
  mode?: string
  deck?: string
  planning_note?: string
}

export interface CreateSessionPayload {
  scheduled_at: string
  mode: string
  deck: string
  planning_note: string
}

export interface AddParticipantPayload {
  user: number
  faction: FactionSlug
}

export interface UpdateParticipantPayload {
  faction?: FactionSlug
  notes?: string
}

export interface FinalizeParticipationPayload {
  id: number
  place: number
  castles: number
}

export interface FinalizeSessionPayload {
  rounds_played: number
  end_reason: EndReason
  mvp?: number | null
  final_note?: string
  participations: FinalizeParticipationPayload[]
}

export interface ApiComment {
  id: number
  author: PublicUser
  body: string
  created_at: string
  edited_at: string | null
}

export interface CommentListParams {
  before?: number
  limit?: number
}

export interface CommentWritePayload {
  body: string
}

export type VoteType = 'positive' | 'negative'

export interface ApiVote {
  id: number
  from_user: PublicUser
  to_user: PublicUser
  vote_type: VoteType
  created_at: string
}

export interface VoteWritePayload {
  to_user: number
  vote_type: VoteType
}

export interface VoteUpdatePayload {
  vote_type: VoteType
}

export interface ApiStatsParticipation {
  id: number
  user: PublicUser
  faction: FactionSlug
  place: number | null
  castles: number | null
  is_winner: boolean
  notes: string
}

export interface ApiStatsOutcome {
  rounds_played: number
  end_reason: EndReason
  mvp: PublicUser | null
  final_note: string
}

export interface ApiStatsSession {
  id: number
  scheduled_at: string
  status: SessionStatus
  mode: GameMode
  deck: Deck
  created_by: PublicUser
  planning_note: string
  participations: ApiStatsParticipation[]
  outcome: ApiStatsOutcome | null
  comments_count: number
}

export interface ApiPlayerStats {
  user: PublicUser
  total_games: number
  wins: number
  winrate: number | null
  avg_place: number | null
  avg_castles: number | null
  favorite_faction: FactionSlug | null
  best_faction: { faction: FactionSlug; winrate: number | null } | null
  worst_faction: { faction: FactionSlug; winrate: number | null } | null
  current_streak: { type: 'win' | 'loss' | null; count: number }
  last10: Array<{ match_id: number; place: number | null; faction: FactionSlug }>
  crowns_received: number
  shits_received: number
}

export interface ApiFactionStats {
  faction: Faction
  total_games: number
  wins: number
  winrate: number | null
  avg_place: number | null
  avg_castles: number | null
  by_mode: Array<{ mode: string; winrate: number | null; games: number }>
  top_players: Array<{ user: PublicUser; winrate: number | null; games: number }>
}

export interface ApiOverviewStats {
  next_match: ApiStatsSession | null
  recent_matches: ApiStatsSession[]
  total_matches: number
  active_players: number
  most_popular_faction: { faction: Faction; games: number } | null
  current_leader: { user: PublicUser; wins: number } | null
  faction_winrates: Array<{ faction: Faction; winrate: number | null }>
  top_winrate: Array<{ user: PublicUser; winrate: number | null }>
  fun_facts: Array<{ icon: string; title: string; description: string }>
}

export type LeaderboardMetric =
  | 'wins'
  | 'winrate'
  | 'games'
  | 'crowns'
  | 'shits'
  | 'avg_place'

export interface ApiLeaderboardStats {
  metric: LeaderboardMetric
  label: string
  results: Array<{
    rank: number
    user: PublicUser
    games: number
    metric_value: number | null
  }>
}

export interface ApiHeadToHeadSide {
  faction: FactionSlug
  place: number | null
  castles: number | null
  is_winner: boolean
}

export interface ApiHeadToHeadMatch {
  id: number
  scheduled_at: string
  mode: GameMode
  deck: Deck
  user_a: ApiHeadToHeadSide
  user_b: ApiHeadToHeadSide
}

export interface ApiHeadToHeadStats {
  user_a: PublicUser
  user_b: PublicUser
  games_together: number
  wins: {
    user_a: number
    user_b: number
  }
  higher_place: {
    user_a: number
    user_b: number
  }
  favorite_factions: {
    user_a: FactionSlug | null
    user_b: FactionSlug | null
  }
  matches: ApiHeadToHeadMatch[]
}

export interface ApiAvatarAsset {
  id: number
  faction: FactionSlug
  style: string
  source_photo: string | null
  generated_image: string
  is_current: boolean
  created_at: string
}
