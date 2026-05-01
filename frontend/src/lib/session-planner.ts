export const LAST_CREATE_STORAGE_KEY = 'tronus.lastCreate'

export interface LastCreateSelection {
  deckSlug: string
  modeSlug: string
}

export function roundDateUpToFiveMinutes(date: Date) {
  const rounded = new Date(date)

  rounded.setSeconds(0, 0)

  const minutes = rounded.getMinutes()
  const remainder = minutes % 5

  if (remainder !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    rounded.setMinutes(minutes + (5 - remainder))
  }

  return rounded
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function readLastCreateSelection(): LastCreateSelection | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(LAST_CREATE_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LastCreateSelection>

    if (
      typeof parsed.modeSlug === 'string' &&
      parsed.modeSlug &&
      typeof parsed.deckSlug === 'string' &&
      parsed.deckSlug
    ) {
      return {
        modeSlug: parsed.modeSlug,
        deckSlug: parsed.deckSlug,
      }
    }
  } catch {
    return null
  }

  return null
}

export function writeLastCreateSelection(selection: LastCreateSelection) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    LAST_CREATE_STORAGE_KEY,
    JSON.stringify(selection),
  )
}
