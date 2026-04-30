import { mockDecks, mockModes, mockPlayers } from '@/mocks/data'
import type {
  MatchSession,
  Outcome,
  Participation,
} from '@/mocks/types'
import type { SessionPlannerDraft } from '@/types/domain'

export type PlannerDraft = SessionPlannerDraft

function modeBySlug(slug: string) {
  return mockModes.find((mode) => mode.slug === slug) ?? mockModes[0]
}

function deckBySlug(slug: string) {
  return mockDecks.find((deck) => deck.slug === slug) ?? mockDecks[0]
}

function userById(id: number) {
  return mockPlayers.find((player) => player.id === id) ?? mockPlayers[0]
}

export function buildMatchFromPlannerDraft(
  draft: PlannerDraft,
  options?: {
    commentsCount?: number
    createdById?: number
    outcome?: Outcome | null
    participations?: Participation[]
    status?: MatchSession['status']
    votes?: MatchSession['votes']
  },
): MatchSession {
  return {
    id: draft.id ?? Date.now(),
    scheduledAt: draft.scheduledAt,
    mode: modeBySlug(draft.modeSlug),
    deck: deckBySlug(draft.deckSlug),
    createdBy: userById(options?.createdById ?? 1),
    status: options?.status ?? 'planned',
    planningNote: draft.planningNote,
    participations:
      options?.participations ??
      draft.participantSeeds.map((participant) => ({
        id: participant.id,
        user: userById(participant.userId),
        faction: participant.faction,
        place: null,
        castles: null,
        isWinner: false,
        notes: '',
      })),
    outcome: options?.outcome ?? null,
    commentsCount: options?.commentsCount ?? 0,
    votes: options?.votes ?? [],
  }
}
