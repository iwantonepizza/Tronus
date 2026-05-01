import {
  Castle,
  Crown,
  ScrollText,
  Shuffle,
  Swords,
  TimerReset,
  Trophy,
} from 'lucide-react'
import type { ApiTimelineEvent, TimelineEventKind } from '@/api/types'
import { formatDateTimeCompact } from '@/lib/dates'

const timelineKindMeta: Record<
  TimelineEventKind,
  {
    icon: typeof ScrollText
    title: string
  }
> = {
  session_started: {
    icon: Castle,
    title: 'Партия началась',
  },
  round_completed: {
    icon: TimerReset,
    title: 'Раунд завершён',
  },
  wildlings_raid: {
    icon: Swords,
    title: 'Атака одичалых',
  },
  clash_of_kings: {
    icon: Crown,
    title: 'Битва королей',
  },
  event_card_played: {
    icon: ScrollText,
    title: 'Карта Вестероса',
  },
  participant_removed: {
    icon: Shuffle,
    title: 'Удаление игрока',
  },
  participant_replaced: {
    icon: Shuffle,
    title: 'Замена игрока',
  },
  session_finalized: {
    icon: Trophy,
    title: 'Партия финализирована',
  },
}

function formatEventCardLabel(slug: string) {
  return slug
    .split('_')
    .map((part) => {
      if (!part) {
        return part
      }

      return part[0].toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function buildTimelineDescription(event: ApiTimelineEvent) {
  switch (event.kind) {
    case 'wildlings_raid': {
      const outcome = event.payload?.outcome === 'win' ? 'отбиты' : 'прорвались'
      const threatAfter = event.payload?.wildlings_threat_after
      return `Одичалые ${outcome}. Угроза после атаки: ${threatAfter ?? '—'}.`
    }
    case 'clash_of_kings': {
      const tracks = event.payload?.tracks as
        | Record<string, Array<{ participation_id: number; bid: number; place: number }>>
        | undefined
      const throneLeader = tracks?.influence_throne?.find((entry) => entry.place === 1)
      const swordLeader = tracks?.influence_sword?.find((entry) => entry.place === 1)
      const courtLeader = tracks?.influence_court?.find((entry) => entry.place === 1)

      return `Лидеры треков: трон ${throneLeader?.participation_id ?? '—'}, меч ${swordLeader?.participation_id ?? '—'}, двор ${courtLeader?.participation_id ?? '—'}.`
    }
    case 'event_card_played': {
      const deckNumber = event.payload?.deck_number
      const cardSlug = event.payload?.card_slug
      return `Колода ${deckNumber ?? '—'}: ${typeof cardSlug === 'string' ? formatEventCardLabel(cardSlug) : '—'}.`
    }
    case 'participant_removed': {
      const roundNumber = event.payload?.round_number
      const nickname = event.payload?.nickname
      return `Игрок ${typeof nickname === 'string' ? nickname : '—'} удалён из партии на раунде ${roundNumber ?? '—'}.`
    }
    case 'participant_replaced': {
      const roundNumber = event.payload?.round_number
      const factionSlug = event.payload?.faction_slug
      return `Замена на раунде ${roundNumber ?? '—'} (${typeof factionSlug === 'string' ? factionSlug : 'неизвестная фракция'}).`
    }
    case 'session_started':
      return 'Старт партии и создание нулевого snapshot состояния.'
    case 'session_finalized':
      return 'Итоги подтверждены и партия переведена в завершённые.'
    case 'round_completed':
      return 'Раунд сохранён в immutable snapshot.'
    default:
      return 'Событие партии зафиксировано в журнале.'
  }
}

interface MatchTimelineProps {
  events: ApiTimelineEvent[]
  isLoading: boolean
  isError: boolean
}

export function MatchTimeline({
  events,
  isLoading,
  isError,
}: MatchTimelineProps) {
  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
        <h2 className="font-display text-3xl text-text-primary">Хронология партии</h2>
        <p className="mt-4 text-sm text-text-secondary">Загружаем события партии…</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
        <h2 className="font-display text-3xl text-text-primary">Хронология партии</h2>
        <p className="mt-4 text-sm text-text-secondary">
          Не удалось загрузить timeline. Остальная карточка партии доступна.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-text-primary">Хронология партии</h2>
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border-subtle px-4 py-5 text-sm text-text-tertiary">
          Пока нет зафиксированных событий партии.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {events
            .slice()
            .sort(
              (left, right) =>
                new Date(right.happened_at).getTime() -
                new Date(left.happened_at).getTime(),
            )
            .map((event) => {
              const meta = timelineKindMeta[event.kind]
              const Icon = meta.icon

              return (
                <article
                  key={event.id}
                  className="rounded-[1.5rem] border border-border-subtle bg-bg-base p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-elev1 text-text-secondary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">
                          {meta.title}
                        </h3>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {event.actor?.nickname ?? 'Летописец'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {formatDateTimeCompact(event.happened_at)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    {buildTimelineDescription(event)}
                  </p>
                </article>
              )
            })}
        </div>
      )}
    </section>
  )
}
