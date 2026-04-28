import { api } from '@/api/client'
import type { Deck, Faction, GameMode } from '@/api/types'

export function listFactions(): Promise<Faction[]> {
  return api<Faction[]>('/reference/factions/')
}

export function listModes(): Promise<GameMode[]> {
  return api<GameMode[]>('/reference/modes/')
}

export function listDecks(): Promise<Deck[]> {
  return api<Deck[]>('/reference/decks/')
}
