import { api } from '@/api/client'
import type { Faction, GameMode, HouseDeck } from '@/api/types'

export function listFactions(): Promise<Faction[]> {
  return api<Faction[]>('/reference/factions/')
}

export function listModes(): Promise<GameMode[]> {
  return api<GameMode[]>('/reference/modes/')
}

export function listDecks(): Promise<HouseDeck[]> {
  return api<HouseDeck[]>('/reference/decks/')
}
