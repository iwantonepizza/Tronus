import type {
  ApiAvatarAsset,
  ApiComment,
  ApiFactionStats,
  ApiHeadToHeadSide,
  ApiHeadToHeadStats,
  ApiLeaderboardStats,
  ApiOutcome,
  ApiParticipation,
  ApiOverviewStats,
  ApiPlayerStats,
  ApiSessionDetail,
  ApiSessionListItem,
  ApiStatsSession,
  ApiUserSummary,
  ApiVote,
  Faction,
  GameMode,
  HouseDeck,
  PublicUser,
} from '@/api/types'
import type {
  DomainAvatarAsset,
  DomainComment,
  DomainDeck,
  DomainFaction,
  DomainFactionStats,
  DomainGameMode,
  DomainHeadToHeadSide,
  DomainHeadToHeadStats,
  DomainLeaderboardStats,
  DomainOutcome,
  DomainOverviewStats,
  DomainParticipation,
  DomainPlayerStats,
  DomainPublicUser,
  DomainSession,
  DomainVote,
} from '@/types/domain'
import { resolveAssetUrl } from '@/api/client'

function fallbackMode(slug: string): DomainGameMode {
  return {
    slug,
    name: slug,
    minPlayers: 0,
    maxPlayers: 0,
  }
}

function fallbackDeck(slug: string): DomainDeck {
  return {
    slug,
    name: slug,
  }
}

export function toDomainUser(user: PublicUser): DomainPublicUser {
  return {
    id: user.id,
    nickname: user.nickname,
    favoriteFaction: user.favorite_faction,
    currentAvatarUrl: resolveAssetUrl(user.current_avatar),
    dateJoined: user.date_joined,
  }
}

export function toDomainUserSummary(user: ApiUserSummary): DomainPublicUser {
  return {
    id: user.id,
    nickname: user.nickname,
    favoriteFaction: null,
    currentAvatarUrl: null,
    dateJoined: '',
  }
}

export function toDomainMode(mode: GameMode): DomainGameMode {
  return {
    slug: mode.slug,
    name: mode.name,
    minPlayers: mode.min_players,
    maxPlayers: mode.max_players,
    description: mode.description,
  }
}

export function toDomainDeck(deck: HouseDeck): DomainDeck {
  return {
    slug: deck.slug,
    name: deck.name,
    description: deck.description,
  }
}

export function toDomainFaction(faction: Faction): DomainFaction {
  return {
    slug: faction.slug,
    name: faction.name,
    color: faction.color,
    onPrimary: faction.on_primary,
    sigil: faction.sigil ?? null,
  }
}

export function buildModeMap(modes: DomainGameMode[]): Map<string, DomainGameMode> {
  return new Map(modes.map((mode) => [mode.slug, mode]))
}

export function buildDeckMap(decks: DomainDeck[]): Map<string, DomainDeck> {
  return new Map(decks.map((deck) => [deck.slug, deck]))
}

export function toDomainParticipation(
  participation: ApiParticipation,
): DomainParticipation {
  return {
    id: participation.id,
    user: toDomainUserSummary(participation.user),
    faction: participation.faction,
    place: participation.place,
    castles: participation.castles,
    isWinner: participation.is_winner,
    notes: participation.notes,
  }
}

export function toDomainOutcome(outcome: ApiOutcome): DomainOutcome {
  return {
    roundsPlayed: outcome.rounds_played,
    endReason: outcome.end_reason,
    mvp: outcome.mvp ? toDomainUserSummary(outcome.mvp) : null,
    finalNote: outcome.final_note,
  }
}

export function toDomainComment(comment: ApiComment): DomainComment {
  return {
    id: comment.id,
    author: toDomainUser(comment.author),
    body: comment.body,
    createdAt: comment.created_at,
    editedAt: comment.edited_at,
  }
}

export function toDomainVote(vote: ApiVote): DomainVote {
  return {
    id: vote.id,
    fromUser: toDomainUser(vote.from_user),
    toUser: toDomainUser(vote.to_user),
    voteType: vote.vote_type,
    createdAt: vote.created_at,
  }
}

export function toDomainAvatarAsset(asset: ApiAvatarAsset): DomainAvatarAsset {
  return {
    id: asset.id,
    faction: asset.faction,
    style: asset.style,
    sourcePhotoUrl: resolveAssetUrl(asset.source_photo),
    generatedImageUrl: resolveAssetUrl(asset.generated_image) ?? '',
    isCurrent: asset.is_current,
    createdAt: asset.created_at,
  }
}

export function toDomainSession(
  session: ApiSessionListItem | ApiSessionDetail,
  maps: {
    decks: Map<string, DomainDeck>
    modes: Map<string, DomainGameMode>
  },
  extras?: {
    commentsCount?: number
    votes?: DomainVote[]
  },
): DomainSession {
  return {
    id: session.id,
    scheduledAt: session.scheduled_at,
    status: session.status,
    mode: maps.modes.get(session.mode) ?? fallbackMode(session.mode),
    deck: maps.decks.get(session.deck) ?? fallbackDeck(session.deck),
    createdBy: toDomainUserSummary(session.created_by),
    planningNote: session.planning_note,
    participations:
      'participations' in session
        ? session.participations.map(toDomainParticipation)
        : [],
    outcome:
      'outcome' in session && session.outcome
        ? toDomainOutcome(session.outcome)
        : null,
    commentsCount: extras?.commentsCount ?? 0,
    votes: extras?.votes ?? [],
  }
}

export function toDomainStatsSession(session: ApiStatsSession): DomainSession {
  return {
    id: session.id,
    scheduledAt: session.scheduled_at,
    status: session.status,
    mode: toDomainMode(session.mode),
    deck: toDomainDeck(session.deck),
    createdBy: toDomainUser(session.created_by),
    planningNote: session.planning_note,
    participations: session.participations.map((participation) => ({
      id: participation.id,
      user: toDomainUser(participation.user),
      faction: participation.faction,
      place: participation.place,
      castles: participation.castles,
      isWinner: participation.is_winner,
      notes: participation.notes,
    })),
    outcome: session.outcome
      ? {
          roundsPlayed: session.outcome.rounds_played,
          endReason: session.outcome.end_reason,
          mvp: session.outcome.mvp ? toDomainUser(session.outcome.mvp) : null,
          finalNote: session.outcome.final_note,
        }
      : null,
    commentsCount: session.comments_count,
    votes: [],
  }
}

export function toDomainPlayerStats(stats: ApiPlayerStats): DomainPlayerStats {
  return {
    user: toDomainUser(stats.user),
    totalGames: stats.total_games,
    wins: stats.wins,
    winrate: stats.winrate,
    avgPlace: stats.avg_place,
    avgCastles: stats.avg_castles,
    favoriteFaction: stats.favorite_faction,
    bestFaction: stats.best_faction,
    worstFaction: stats.worst_faction,
    currentStreak: stats.current_streak,
    last10: stats.last10.map((entry) => ({
      matchId: entry.match_id,
      place: entry.place,
      faction: entry.faction,
    })),
    crownsReceived: stats.crowns_received,
    shitsReceived: stats.shits_received,
  }
}

export function toDomainFactionStats(stats: ApiFactionStats): DomainFactionStats {
  return {
    faction: toDomainFaction(stats.faction),
    totalGames: stats.total_games,
    wins: stats.wins,
    winrate: stats.winrate,
    avgPlace: stats.avg_place,
    avgCastles: stats.avg_castles,
    byMode: stats.by_mode.map((entry) => ({
      mode: entry.mode,
      winrate: entry.winrate,
      games: entry.games,
    })),
    topPlayers: stats.top_players.map((entry) => ({
      user: toDomainUser(entry.user),
      winrate: entry.winrate,
      games: entry.games,
    })),
  }
}

export function toDomainOverviewStats(
  stats: ApiOverviewStats,
): DomainOverviewStats {
  return {
    nextMatch: stats.next_match
      ? toDomainStatsSession(stats.next_match)
      : null,
    recentMatches: stats.recent_matches.map(toDomainStatsSession),
    totalMatches: stats.total_matches,
    activePlayers: stats.active_players,
    mostPopularFaction: stats.most_popular_faction
      ? {
          faction: toDomainFaction(stats.most_popular_faction.faction),
          games: stats.most_popular_faction.games,
        }
      : null,
    currentLeader: stats.current_leader
      ? {
          user: toDomainUser(stats.current_leader.user),
          wins: stats.current_leader.wins,
        }
      : null,
    factionWinrates: stats.faction_winrates.map((entry) => ({
      faction: toDomainFaction(entry.faction),
      winrate: entry.winrate,
    })),
    topWinrate: stats.top_winrate.map((entry) => ({
      user: toDomainUser(entry.user),
      winrate: entry.winrate,
    })),
    funFacts: stats.fun_facts,
  }
}

export function toDomainLeaderboardStats(
  stats: ApiLeaderboardStats,
): DomainLeaderboardStats {
  return {
    metric: stats.metric,
    label: stats.label,
    results: stats.results.map((entry) => ({
      rank: entry.rank,
      user: toDomainUser(entry.user),
      games: entry.games,
      metricValue: entry.metric_value,
    })),
  }
}

function toDomainHeadToHeadSide(
  side: ApiHeadToHeadSide,
): DomainHeadToHeadSide {
  return {
    faction: side.faction,
    place: side.place,
    castles: side.castles,
    isWinner: side.is_winner,
  }
}

export function toDomainHeadToHeadStats(
  stats: ApiHeadToHeadStats,
): DomainHeadToHeadStats {
  return {
    userA: toDomainUser(stats.user_a),
    userB: toDomainUser(stats.user_b),
    gamesTogether: stats.games_together,
    wins: {
      userA: stats.wins.user_a,
      userB: stats.wins.user_b,
    },
    higherPlace: {
      userA: stats.higher_place.user_a,
      userB: stats.higher_place.user_b,
    },
    favoriteFactions: {
      userA: stats.favorite_factions.user_a,
      userB: stats.favorite_factions.user_b,
    },
    matches: stats.matches.map((match) => ({
      id: match.id,
      scheduledAt: match.scheduled_at,
      mode: toDomainMode(match.mode),
      deck: toDomainDeck(match.deck),
      userA: toDomainHeadToHeadSide(match.user_a),
      userB: toDomainHeadToHeadSide(match.user_b),
    })),
  }
}
