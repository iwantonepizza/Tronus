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

export interface Faction {
  slug: FactionSlug
  name: string
  color: string
  sigilUrl: string
}

export interface GameMode {
  slug:
    | 'classic'
    | 'feast_for_crows'
    | 'dance_with_dragons'
    | 'mother_of_dragons'
  name: string
  minPlayers: number
  maxPlayers: number
  maxRounds: number
  westerosDeckCount: number
  allowedFactions: FactionSlug[]
  requiredFactions: FactionSlug[]
  factionsByPlayerCount: Record<string, FactionSlug[]>
}

export interface HouseDeck {
  slug: 'original' | 'alternative'
  name: string
}

export interface PublicUser {
  id: number
  nickname: string
  favoriteFaction: FactionSlug | null
  currentAvatarUrl: string | null
  dateJoined: string
}

export interface Participation {
  id: number
  user: PublicUser
  faction: FactionSlug
  place: number | null
  castles: number | null
  isWinner: boolean
  notes: string
}

export interface Outcome {
  roundsPlayed: number
  endReason: 'castles_7' | 'timer' | 'rounds_end' | 'early' | 'other'
  mvp: PublicUser | null
  finalNote: string
}

export interface MatchComment {
  id: number
  author: PublicUser
  body: string
  createdAt: string
  editedAt: string | null
}

export interface MatchVote {
  id: number
  fromUser: PublicUser
  toUser: PublicUser
  voteType: 'positive' | 'negative'
  createdAt: string
}

export interface MatchSession {
  id: number
  scheduledAt: string
  mode: GameMode
  deck: HouseDeck
  createdBy: PublicUser
  status: 'planned' | 'completed' | 'cancelled'
  planningNote: string
  participations: Participation[]
  outcome: Outcome | null
  commentsCount: number
  votes: MatchVote[]
}

export interface PlayerStats {
  user: PublicUser
  totalGames: number
  wins: number
  winrate: number
  avgPlace: number
  avgCastles: number
  favoriteFaction: FactionSlug
  bestFaction: { faction: FactionSlug; winrate: number }
  worstFaction: { faction: FactionSlug; winrate: number }
  currentStreak: { type: 'win' | 'loss'; count: number }
  last10: Array<{ matchId: number; place: number; faction: FactionSlug }>
  crownsReceived: number
  shitsReceived: number
}

export interface FactionStats {
  faction: Faction
  totalGames: number
  wins: number
  winrate: number
  avgPlace: number
  avgCastles: number
  byMode: Array<{ mode: GameMode['slug']; winrate: number; games: number }>
  topPlayers: Array<{ user: PublicUser; winrate: number; games: number }>
}

export interface OverviewData {
  nextMatch: MatchSession | null
  recentMatches: MatchSession[]
  totalMatches: number
  activePlayers: number
  mostPopularFaction: { faction: Faction; games: number }
  currentLeader: { user: PublicUser; wins: number }
  factionWinrates: Array<{ faction: Faction; winrate: number }>
  topWinrate: Array<{ user: PublicUser; winrate: number }>
  funFacts: Array<{ icon: string; title: string; description: string }>
}
