import { useMemo, useState } from 'react'
import { CalendarDays, Check, ScrollText, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { formatPlayerRange } from '@/lib/format'
import { toDateTimeLocalValue } from '@/lib/session-planner'
import type {
  DomainDeck,
  DomainFaction,
  DomainGameMode,
  DomainPublicUser,
  PlannerParticipantSeed,
  SessionPlannerDraft,
} from '@/types/domain'

export type SessionEntryMode = 'planned' | 'played'

interface SessionPlannerFormProps {
  allowEntryModeToggle?: boolean
  decks: DomainDeck[]
  description: string
  eyebrow: string
  factions: DomainFaction[]
  initialDraft: SessionPlannerDraft
  initialEntryMode?: SessionEntryMode
  isSubmitting?: boolean
  modes: DomainGameMode[]
  players: DomainPublicUser[]
  submitError?: string | null
  submitLabel: string
  title: string
  onSubmit: (payload: {
    draft: SessionPlannerDraft
    entryMode: SessionEntryMode
  }) => void
}

const entryModes: Array<{
  description: string
  label: string
  value: SessionEntryMode
}> = [
  {
    value: 'planned',
    label: 'Запланировать',
    description:
      'Сохраняем будущую игру и идём в карточку запланированной партии.',
  },
  {
    value: 'played',
    label: 'Только что сыграли',
    description:
      'Собираем состав и сразу переходим в мастер финализации.',
  },
]

export function SessionPlannerForm({
  allowEntryModeToggle = true,
  decks,
  description,
  eyebrow,
  factions,
  initialDraft,
  initialEntryMode = 'planned',
  isSubmitting = false,
  modes,
  onSubmit,
  players,
  submitError = null,
  submitLabel,
  title,
}: SessionPlannerFormProps) {
  const [entryMode, setEntryMode] = useState<SessionEntryMode>(initialEntryMode)
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocalValue(initialDraft.scheduledAt),
  )
  const [modeSlug, setModeSlug] = useState(initialDraft.modeSlug)
  const [deckSlug, setDeckSlug] = useState(initialDraft.deckSlug)
  const [planningNote, setPlanningNote] = useState(initialDraft.planningNote)
  const [participantSeeds, setParticipantSeeds] = useState(
    initialDraft.participantSeeds,
  )
  const [playerSearch, setPlayerSearch] = useState('')

  const filteredPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase()

    return players.filter((player) => {
      if (
        participantSeeds.some((participant) => participant.userId === player.id)
      ) {
        return false
      }

      if (!query) {
        return true
      }

      return player.nickname.toLowerCase().includes(query)
    })
  }, [participantSeeds, playerSearch, players])

  const addParticipant = (userId: number) => {
    const fallbackFaction = players.find((player) => player.id === userId)
      ?.favoriteFaction

    const firstAvailableFaction =
      factions.find(
        (faction) =>
          !participantSeeds.some((item) => item.faction === faction.slug),
      )?.slug ?? factions[0]?.slug

    const nextFaction = fallbackFaction ?? firstAvailableFaction

    if (!nextFaction) {
      return
    }

    setParticipantSeeds((currentParticipants) => [
      ...currentParticipants,
      {
        id:
          currentParticipants.reduce(
            (maxId, participant) => Math.max(maxId, participant.id),
            0,
          ) + 1,
        userId,
        faction: nextFaction,
      },
    ])
    setPlayerSearch('')
  }

  const updateParticipantFaction = (
    participantId: number,
    faction: PlannerParticipantSeed['faction'],
  ) => {
    setParticipantSeeds((currentParticipants) =>
      currentParticipants.map((participant) =>
        participant.id === participantId ? { ...participant, faction } : participant,
      ),
    )
  }

  const removeParticipant = (participantId: number) => {
    setParticipantSeeds((currentParticipants) =>
      currentParticipants.filter(
        (participant) => participant.id !== participantId,
      ),
    )
  }

  const draft: SessionPlannerDraft = {
    id: initialDraft.id,
    scheduledAt: `${scheduledAt}:00`,
    modeSlug,
    deckSlug,
    planningNote,
    participantSeeds,
  }

  const selectedMode = modes.find((mode) => mode.slug === modeSlug)
  const selectedDeck = decks.find((deck) => deck.slug === deckSlug)

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          {description}
        </p>

        {allowEntryModeToggle ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {entryModes.map((mode) => {
              const active = entryMode === mode.value

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setEntryMode(mode.value)}
                  className={cn(
                    'rounded-[1.5rem] border p-4 text-left transition',
                    active
                      ? 'border-gold bg-gold/10'
                      : 'border-border-subtle bg-bg-base hover:border-gold/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl text-text-primary">
                        {mode.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        {mode.description}
                      </p>
                    </div>
                    {active ? <Check className="h-5 w-5 text-gold" /> : null}
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <article className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-gold">
              <CalendarDays className="h-5 w-5" />
              <h2 className="font-display text-3xl text-text-primary">
                База партии
              </h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
                  Дата и время
                </span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 text-sm text-text-primary outline-none transition focus:border-gold/60"
                />
              </label>
              <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  Режим flow
                </p>
                <p className="mt-2 font-display text-2xl text-text-primary">
                  {entryMode === 'planned'
                    ? 'Планируем заранее'
                    : 'Сразу к финализации'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {modes.map((mode) => {
                const selected = modeSlug === mode.slug

                return (
                  <button
                    key={mode.slug}
                    type="button"
                    onClick={() => setModeSlug(mode.slug)}
                    className={cn(
                      'rounded-[1.5rem] border p-4 text-left transition',
                      selected
                        ? 'border-gold bg-gold/10 shadow-[0_10px_30px_rgba(201,164,76,0.12)]'
                        : 'border-border-subtle bg-bg-base hover:border-gold/60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl text-text-primary">
                          {mode.name}
                        </h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {formatPlayerRange(mode.minPlayers, mode.maxPlayers)} игроков
                        </p>
                      </div>
                      {selected ? <Check className="h-5 w-5 text-gold" /> : null}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
                Колода
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {decks.map((deck) => {
                  const selected = deck.slug === deckSlug

                  return (
                    <button
                      key={deck.slug}
                      type="button"
                      onClick={() => setDeckSlug(deck.slug)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition',
                        selected
                          ? 'border-gold bg-gold text-black'
                          : 'border-border-subtle bg-bg-base text-text-secondary hover:border-gold hover:text-gold',
                      )}
                    >
                      {deck.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <label className="space-y-2">
                <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
                  Примечание к партии
                </span>
                <textarea
                  aria-label="Примечание к партии"
                  value={planningNote}
                  onChange={(event) => setPlanningNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold/60"
                  placeholder="Что важно для этой партии: стол, таймер, состав, настроение."
                />
              </label>
            </div>
          </article>

          <article className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-gold">
              <Users className="h-5 w-5" />
              <h2 className="font-display text-3xl text-text-primary">
                Пригласить игроков
              </h2>
            </div>

            <div className="mt-5">
              <Input
                label="Поиск по нику"
                placeholder="Кого позвать за стол"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filteredPlayers.slice(0, 6).map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => addParticipant(player.id)}
                  className="rounded-full border border-border-subtle bg-bg-base px-4 py-2 text-sm text-text-secondary transition hover:border-gold hover:text-gold"
                >
                  + {player.nickname}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {participantSeeds.map((participant) => {
                const player = players.find((item) => item.id === participant.userId)

                if (!player) {
                  return null
                }

                const takenFactions = participantSeeds
                  .filter((item) => item.id !== participant.id)
                  .map((item) => item.faction)

                return (
                  <div
                    key={participant.id}
                    className="grid gap-3 rounded-[1.5rem] border border-border-subtle bg-bg-base p-4 md:grid-cols-[1fr_220px_auto]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-elev1 font-semibold text-gold">
                        {player.nickname.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">
                          {player.nickname}
                        </p>
                        <p className="text-sm text-text-tertiary">
                          любит: {player.favoriteFaction ?? '—'}
                        </p>
                      </div>
                    </div>
                    <Select
                      label="Фракция"
                      value={participant.faction}
                      onChange={(event) =>
                        updateParticipantFaction(
                          participant.id,
                          event.target.value as PlannerParticipantSeed['faction'],
                        )
                      }
                      options={factions.map((faction) => ({
                        label: `${takenFactions.includes(faction.slug) ? '• ' : ''}${faction.name}`,
                        value: faction.slug,
                      }))}
                    />
                    <Button
                      className="self-end"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParticipant(participant.id)}
                    >
                      Убрать
                    </Button>
                  </div>
                )
              })}
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-gold">
              <ScrollText className="h-5 w-5" />
              <h2 className="font-display text-3xl text-text-primary">
                Предпросмотр
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewRow
                label="Статус"
                value={entryMode === 'planned' ? 'запланирована' : 'сыграна'}
              />
              <PreviewRow
                label="Режим"
                value={selectedMode?.name ?? modeSlug}
              />
              <PreviewRow
                label="Колода"
                value={selectedDeck?.name ?? deckSlug}
              />
              <PreviewRow
                label="Игроков"
                value={String(participantSeeds.length)}
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-gold">
              <Swords className="h-5 w-5" />
              <h2 className="font-display text-3xl text-text-primary">
                Что произойдёт дальше
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-text-secondary">
              {entryMode === 'planned'
                ? 'После сохранения откроется карточка запланированной партии, где можно будет править состав и следить за обсуждением.'
                : 'После сохранения откроется мастер финализации: места, замки, детали игры и подтверждение.'}
            </p>

            {submitError ? (
              <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </p>
            ) : null}

            <Button
              className="mt-6 w-full"
              disabled={
                isSubmitting ||
                participantSeeds.length < 2 ||
                !scheduledAt ||
                !modeSlug ||
                !deckSlug
              }
              onClick={() =>
                onSubmit({
                  draft,
                  entryMode,
                })
              }
            >
              {isSubmitting ? 'Сохраняем…' : submitLabel}
            </Button>
          </article>
        </aside>
      </section>
    </main>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="font-display text-xl text-text-primary">{value}</span>
    </div>
  )
}
