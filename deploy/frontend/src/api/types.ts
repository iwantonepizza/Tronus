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
  max_rounds: number
  westeros_deck_count: number
  allowed_factions: FactionSlug[]
  required_factions: FactionSlug[]
  factions_by_player_count: Record<string, FactionSlug[]>
  description?: string
}

export interface HouseDeck {
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
  password_repeat: string
  nickname: string
  secret_word?: string
}

export interface RegisterResponse {
  id: number
  status: 'pending_approval' | 'active'
  auto_activated: boolean
}

export interface LoginPayload {
  login: string
  password: string
}

export interface PasswordResetPayload {
  login: string
  secret_word: string
  new_password: string
  new_password_repeat: string
}

export interface PasswordResetResponse {
  status: 'password_reset'
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_repeat: string
}

export interface ChangePasswordResponse {
  status: 'password_changed'
}

export interface CsrfResponse {
  detail: string
}

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'invited'

export type TimelineEventKind =
  | 'session_started'
  | 'round_completed'
  | 'wildlings_raid'
  | 'clash_of_kings'
  | 'event_card_played'
  | 'participant_replaced'
  | 'session_finalized'

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

// Wave 6 types
export interface ApiSessionInvite {
  id: number
  user: ApiUserSummary
  rsvp_status: RsvpStatus
  desired_faction: string | null
  invited_by: ApiUserSummary | null
  created_at: string
}

export interface ApiRoundSnapshot {
  id: number
  round_number: number
  influence_throne: number[]
  influence_sword: number[]
  influence_court: number[]
  supply: Record<string, number>
  castles: Record<string, number>
  wildlings_threat: 0 | 2 | 4 | 6 | 8 | 10 | 12
  note: string
  created_at: string
}

export interface ApiTimelineEvent {
  id: number
  kind: TimelineEventKind
  happened_at: string
  actor: ApiUserSummary | null
  payload: Record<string, unknown>
  created_at: string
}

export interface StartSessionPayload {
  factions_assignment: { user_id: number; faction_slug: string }[]
}

export interface FinalizeSessionPayload {
  mvp?: number | null
  final_note?: string
}

export interface InviteUserPayload {
  user_id: number
}

export interface UpdateRsvpPayload {
  rsvp_status?: RsvpStatus
  desired_faction?: string | null
}

export interface ReplaceParticipantPayload {
  out_user_id: number
  in_user_id: number
}

export interface CompleteRoundPayload {
  influence_throne: number[]
  influence_sword: number[]
  influence_court: number[]
  supply: Record<string, number>
  castles: Record<string, number>
  wildlings_threat: number
  note?: string
}

export interface WildlingsRaidPayload {
  bids: { participation_id: number; amount: number }[]
  outcome: 'win' | 'loss'
  outcome_card_slug: string | null
  wildlings_threat_after: number
}

export interface ClashOfKingsPayload {
  influence_throne: { participation_id: number; bid: number; place: number }[]
  influence_sword: { participation_id: number; bid: number; place: number }[]
  influence_court: { participation_id: number; bid: number; place: number }[]
}

export interface EventCardPlayedPayload {
  deck_number: number
  card_slug: string
}


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

// Legacy payload kept for backward compat with old code paths
export interface FinalizeParticipationPayload {
  id: number
  place: number
  castles: number
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
  deck: HouseDeck
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
  deck: HouseDeck
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
