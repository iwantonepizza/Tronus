import { useQuery } from '@tanstack/react-query'
import { listDecks, listFactions, listModes } from '@/api/reference'
import { toDomainDeck, toDomainFaction, toDomainMode } from '@/api/mappers'
import type {
  DomainDeck,
  DomainFaction,
  DomainGameMode,
} from '@/types/domain'

const USE_MOCKS = __USE_MOCKS__

interface ReferenceData {
  decks: DomainDeck[]
  factions: DomainFaction[]
  modes: DomainGameMode[]
}

async function fetchReferenceData(): Promise<ReferenceData> {
  if (USE_MOCKS) {
    const { mockDecks, mockFactions, mockModes } = await import('@/mocks/data')

    return {
      decks: mockDecks,
      factions: mockFactions.map((faction) => toDomainFaction({
        slug: faction.slug,
        name: faction.name,
        color: faction.color,
        on_primary: '#FFFFFF',
        sigil: faction.sigilUrl,
      })),
      modes: mockModes.map((mode) => ({
        slug: mode.slug,
        name: mode.name,
        minPlayers: mode.minPlayers,
        maxPlayers: mode.maxPlayers,
      })),
    }
  }

  const [factions, modes, decks] = await Promise.all([
    listFactions(),
    listModes(),
    listDecks(),
  ])

  return {
    decks: decks.map(toDomainDeck),
    factions: factions.map(toDomainFaction),
    modes: modes.map(toDomainMode),
  }
}

export function useReferenceData() {
  return useQuery({
    queryKey: ['reference-data'],
    queryFn: fetchReferenceData,
    staleTime: 5 * 60 * 1000,
  })
}
