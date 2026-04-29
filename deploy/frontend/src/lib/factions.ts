import type { FactionSlug } from '@/types/domain'

const factionColors: Record<FactionSlug, string> = {
  stark: '#6B7B8C',
  lannister: '#9B2226',
  baratheon: '#F0B323',
  greyjoy: '#1C3B47',
  tyrell: '#4B6B3A',
  martell: '#C94E2A',
  arryn: '#8AAFC8',
  targaryen: '#5B2D8A',
  tully: '#4C7AA3',
}

export function getFactionColor(faction: FactionSlug | null | undefined): string {
  if (!faction) {
    return '#C9A44C'
  }

  return factionColors[faction] ?? '#C9A44C'
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const safeHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized

  const red = Number.parseInt(safeHex.slice(0, 2), 16)
  const green = Number.parseInt(safeHex.slice(2, 4), 16)
  const blue = Number.parseInt(safeHex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
