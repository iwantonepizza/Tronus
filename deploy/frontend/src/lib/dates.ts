import { formatDistanceToNowStrict } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatRelativeTime(iso: string) {
  return `${formatDistanceToNowStrict(new Date(iso), {
    addSuffix: true,
    locale: ru,
  })}`
}
