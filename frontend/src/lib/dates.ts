const APP_LOCALE = 'ru'
const APP_TIME_ZONE = 'Asia/Yekaterinburg'

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value)
}

function getDateFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    ...options,
  })
}

function getPartsMap(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  return getDateFormatter(options)
    .formatToParts(toDate(value))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = part.value
      }

      return parts
    }, {})
}

export function formatRelativeTime(iso: string) {
  const diffMs = toDate(iso).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  const relative = new Intl.RelativeTimeFormat(APP_LOCALE, {
    numeric: 'always',
    style: 'long',
  })

  if (Math.abs(diffMinutes) < 60) {
    return relative.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relative.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return relative.format(diffDays, 'day')
}

export function formatDateTimeShort(value: string | Date) {
  const parts = getPartsMap(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`
}

export function formatDateTimeCompact(value: string | Date) {
  const parts = getPartsMap(value, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${parts.day}.${parts.month} ${parts.hour}:${parts.minute}`
}

export function formatDateTimeLong(value: string | Date) {
  const parts = getPartsMap(value, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}`
}

export function formatDateTimeHero(value: string | Date) {
  const parts = getPartsMap(value, {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${parts.day} ${parts.month}, ${parts.hour}:${parts.minute}`
}

export function formatWeekday(value: string | Date) {
  return getDateFormatter({ weekday: 'long' }).format(toDate(value))
}
