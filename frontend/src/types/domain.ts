import type {
  EndReason,
  FactionSlug,
  SessionStatus,
  VoteType,
} from '@/api/types'

export type { EndReason, FactionSlug, SessionStatus, VoteType }

export interface DomainFaction {
  slug: FactionSlug
  name: string
  color: string
  onPrimary?: string
  sigil?: string | null
}

export interface DomainGameMode {
  slug: string
  name: string
  minPlayers: number
  maxPlayers: number
  description?: string
}

export interface DomainDeck {
  slug: string
  name: string
  description?: string
}

export interface DomainPublicUser {
  id: number
  nickname: string
  favoriteFaction: FactionSlug | null
  currentAvatarUrl: string | null
  dateJoined: string
}

export interface DomainAvatarAsset {
  id: number
  faction: FactionSlug
  style: string
  sourcePhotoUrl: string | null
  generatedImageUrl: string
  isCurrent: boolean
  createdAt: string
}

export interface DomainParticipation {
  id: number
  user: DomainPublicUser
  faction: FactionSlug
  place: number | null
  castles: number | null
  isWinner: boolean
  notes: string
}

export interface DomainOutcome {
  roundsPlayed: number
  endReason: EndReason
  mvp: DomainPublicUser | null
  finalNote: string
}

export interface DomainComment {
  id: number
  author: DomainPublicUser
  body: string
  createdAt: string
  editedAt: string | null
}

export interface DomainVote {
  id: number
  fromUser: DomainPublicUser
  toUser: DomainPublicUser
  voteType: VoteType
  createdAt: string
}

export interface DomainSession {
  id: number
  scheduledAt: string
  status: SessionStatus
  mode: DomainGameMode
  deck: DomainDeck
  createdBy: DomainPublicUser
  planningNote: string
  participations: DomainParticipation[]
  outcome: DomainOutcome | null
  commentsCount: number
  votes: DomainVote[]
}

export interface PlannerParticipantSeed {
  id: number
  userId: number
  faction: FactionSlug
}

export interface SessionPlannerDraft {
  id?: number
  scheduledAt: string
  modeSlug: string
  deckSlug: string
  planningNote: string
  participantSeeds: PlannerParticipantSeed[]
}

export interface DomainPlayerStats {
  user: DomainPublicUser
  totalGames: number
  wins: number
  winrate: number | null
  avgPlace: number | null
  avgCastles: number | null
  favoriteFaction: FactionSlug | null
  bestFaction: { faction: FactionSlug; winrate: number | null } | null
  worstFaction: { faction: FactionSlug; winrate: number | null } | null
  currentStreak: { type: 'win' | 'loss' | null; count: number }
  last10: Array<{ matchId: number; place: number | null; faction: FactionSlug }>
  crownsReceived: number
  shitsReceived: number
}

export interface DomainFactionStats {
  faction: DomainFaction
  totalGames: number
  wins: number
  winrate: number | null
  avgPlace: number | null
  avgCastles: number | null
  byMode: Array<{ mode: string; winrate: number | null; games: number }>
  topPlayers: Array<{
    user: DomainPublicUser
    winrate: number | null
    games: number
  }>
}

export interface DomainOverviewStats {
  nextMatch: DomainSession | null
  recentMatches: DomainSession[]
  totalMatches: number
  activePlayers: number
  mostPopularFaction: { faction: DomainFaction; games: number } | null
  currentLeader: { user: DomainPublicUser; wins: number } | null
  factionWinrates: Array<{ faction: DomainFaction; winrate: number | null }>
  topWinrate: Array<{ user: DomainPublicUser; winrate: number | null }>
  funFacts: Array<{ icon: string; title: string; description: string }>
}

export interface DomainLeaderboardStats {
  metric: string
  label: string
  results: Array<{
    rank: number
    user: DomainPublicUser
    games: number
    metricValue: number | null
  }>
}

export interface DomainHeadToHeadSide {
  faction: FactionSlug
  place: number | null
  castles: number | null
  isWinner: boolean
}

export interface DomainHeadToHeadMatch {
  id: number
  scheduledAt: string
  mode: DomainGameMode
  deck: DomainDeck
  userA: DomainHeadToHeadSide
  userB: DomainHeadToHeadSide
}

export interface DomainHeadToHeadStats {
  userA: DomainPublicUser
  userB: DomainPublicUser
  gamesTogether: number
  wins: {
    userA: number
    userB: number
  }
  higherPlace: {
    userA: number
    userB: number
  }
  favoriteFactions: {
    userA: FactionSlug | null
    userB: FactionSlug | null
  }
  matches: DomainHeadToHeadMatch[]
}
