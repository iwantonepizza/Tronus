import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Castle,
  ChevronDown,
  ChevronUp,
  Crown,
  Flame,
  Loader2,
  Plus,
  Shuffle,
  Sword,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import {
  useCompleteRound,
  useDiscardLastRound,
  useRecordClashOfKings,
  useRecordEventCard,
  useRecordWildlingsRaid,
  useReplaceParticipant,
  useRounds,
  useSessionDetail,
} from '@/hooks/useSessions'
import { useUsers } from '@/hooks/useUsers'
import type {
  ClashOfKingsPayload,
  EventCardPlayedPayload,
  ReplaceParticipantPayload,
  WildlingsRaidPayload,
} from '@/api/types'
import type { DomainParticipation, DomainPublicUser } from '@/types/domain'
import type { ApiRoundSnapshot } from '@/api/types'

const FACTION_COLORS: Record<string, string> = {
  stark: '#4A7FA5',
  lannister: '#C9A84C',
  baratheon: '#F5C842',
  greyjoy: '#7B7B8D',
  tyrell: '#5D9B4F',
  martell: '#C96B36',
  arryn: '#5B8DC9',
  tully: '#8E3A3A',
  targaryen: '#B5352D',
}

const WILDLINGS_POSITIONS = [0, 2, 4, 6, 8, 10, 12] as const
const WILDLINGS_OUTCOME_OPTIONS = [
  { label: 'Без карты (заглушка)', value: '' },
  { label: 'Raven', value: 'raven' },
  { label: 'Horn', value: 'horn' },
  { label: 'Feast', value: 'feast' },
  { label: 'Frost', value: 'frost' },
] as const
const EVENT_DECKS: Record<string, Record<number, string[]>> = {
  classic: {
    1: [
      'supply',
      'supply',
      'supply',
      'muster',
      'muster',
      'muster',
      'throne_of_blades',
      'throne_of_blades',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    2: [
      'clash_of_kings',
      'clash_of_kings',
      'clash_of_kings',
      'game_of_thrones',
      'game_of_thrones',
      'game_of_thrones',
      'dark_wings_dark_words',
      'dark_wings_dark_words',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    3: [
      'wildlings_attack',
      'wildlings_attack',
      'wildlings_attack',
      'sea_of_storms',
      'rains_of_autumn',
      'a_feast_for_crows',
      'web_of_lies',
      'storm_of_swords',
      'put_to_the_sword',
      'put_to_the_sword',
    ],
  },
  feast_for_crows: {
    1: [
      'famine',
      'muster_ffc',
      'ironborn_raid',
      'new_information',
      'rally_the_men',
      'rally_the_men',
      'shifting_ambitions',
      'shifting_ambitions',
      'the_burden_of_power',
      'the_burden_of_power',
    ],
    2: [
      'clash_of_kings',
      'clash_of_kings',
      'clash_of_kings',
      'game_of_thrones',
      'game_of_thrones',
      'game_of_thrones',
      'dark_wings_dark_words',
      'dark_wings_dark_words',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    3: [
      'wildlings_attack',
      'wildlings_attack',
      'wildlings_attack',
      'sea_of_storms',
      'rains_of_autumn',
      'a_feast_for_crows',
      'web_of_lies',
      'storm_of_swords',
      'put_to_the_sword',
      'put_to_the_sword',
    ],
  },
  dance_with_dragons: {
    1: [
      'supply',
      'supply',
      'supply',
      'muster',
      'muster',
      'muster',
      'throne_of_blades',
      'throne_of_blades',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    2: [
      'clash_of_kings',
      'clash_of_kings',
      'clash_of_kings',
      'game_of_thrones',
      'game_of_thrones',
      'game_of_thrones',
      'dark_wings_dark_words',
      'dark_wings_dark_words',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    3: [
      'wildlings_attack',
      'wildlings_attack',
      'wildlings_attack',
      'sea_of_storms',
      'rains_of_autumn',
      'a_feast_for_crows',
      'web_of_lies',
      'storm_of_swords',
      'put_to_the_sword',
      'put_to_the_sword',
    ],
  },
  mother_of_dragons: {
    1: [
      'supply',
      'supply',
      'supply',
      'muster',
      'muster',
      'muster',
      'throne_of_blades',
      'throne_of_blades',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    2: [
      'clash_of_kings',
      'clash_of_kings',
      'clash_of_kings',
      'game_of_thrones',
      'game_of_thrones',
      'game_of_thrones',
      'dark_wings_dark_words',
      'dark_wings_dark_words',
      'winter_is_coming',
      'the_last_days_of_summer',
    ],
    3: [
      'wildlings_attack',
      'wildlings_attack',
      'wildlings_attack',
      'sea_of_storms',
      'rains_of_autumn',
      'a_feast_for_crows',
      'web_of_lies',
      'storm_of_swords',
      'put_to_the_sword',
      'put_to_the_sword',
    ],
    4: [
      'domestic_disputes',
      'empty_promises',
      'fire_made_flesh',
      'playing_with_fire',
      'scattering_dissent',
      'southron_ambitions',
      'strongholds_of_resistance',
      'the_long_plan',
      'watering_the_seed',
      'word_spreads_quickly',
    ],
  },
}

type WildlingsOutcome = 'win' | 'loss'
type WildlingsThreatValue = (typeof WILDLINGS_POSITIONS)[number]
type ClashTrackName =
  | 'influence_throne'
  | 'influence_sword'
  | 'influence_court'

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

function getEventDecksForMode(modeSlug: string) {
  return EVENT_DECKS[modeSlug] ?? EVENT_DECKS.classic
}

function WildlingsStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const idx = WILDLINGS_POSITIONS.indexOf(
    value as (typeof WILDLINGS_POSITIONS)[number],
  )

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={idx <= 0}
        onClick={() => onChange(WILDLINGS_POSITIONS[idx - 1])}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-elev2 text-text-secondary transition hover:text-text-primary disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="flex justify-center gap-1">
          {WILDLINGS_POSITIONS.map((pos) => (
            <div
              key={pos}
              className={`h-2.5 flex-1 rounded-full transition-all ${
                pos <= value
                  ? pos >= 10
                    ? 'bg-red-500'
                    : pos >= 6
                      ? 'bg-amber-400'
                      : 'bg-text-secondary/50'
                  : 'border border-border-subtle bg-bg-elev2'
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-center text-xs text-text-secondary">{value}</p>
      </div>
      <button
        type="button"
        disabled={idx >= WILDLINGS_POSITIONS.length - 1}
        onClick={() => onChange(WILDLINGS_POSITIONS[idx + 1])}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-elev2 text-text-secondary transition hover:text-text-primary disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  )
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle bg-bg-elev2 text-xs text-text-secondary transition hover:text-text-primary disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-mono text-text-primary">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle bg-bg-elev2 text-xs text-text-secondary transition hover:text-text-primary disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

function InfluenceTrack({
  label,
  icon,
  participations,
  order,
  onReorder,
}: {
  label: string
  icon: ReactNode
  participations: DomainParticipation[]
  order: number[]
  onReorder: (newOrder: number[]) => void
}) {
  const ordered = order
    .map((pid) => participations.find((p) => p.id === pid))
    .filter(Boolean) as DomainParticipation[]

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order]
    const target = idx + dir
    if (target < 0 || target >= next.length) {
      return
    }
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onReorder(next)
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        {ordered.map((participation, index) => {
          const color = FACTION_COLORS[participation.faction] ?? '#888'
          return (
            <div
              key={participation.id}
              className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elev1 px-3 py-1.5"
            >
              <span className="w-4 text-center text-xs font-mono text-text-secondary">
                {index + 1}
              </span>
              <div
                className="h-4 w-1 rounded-full"
                style={{ background: color }}
              />
              <span className="flex-1 truncate text-xs text-text-primary">
                {participation.user.nickname}
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="flex h-5 w-5 items-center justify-center rounded text-text-secondary transition hover:text-text-primary disabled:opacity-20"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={index === ordered.length - 1}
                  onClick={() => move(index, 1)}
                  className="flex h-5 w-5 items-center justify-center rounded text-text-secondary transition hover:text-text-primary disabled:opacity-20"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoundHistoryCard({
  snapshot,
  participations,
}: {
  snapshot: ApiRoundSnapshot
  participations: DomainParticipation[]
}) {
  const [open, setOpen] = useState(false)
  const leader = snapshot.influence_throne[0]
  const leaderParticipation = participations.find((p) => p.id === leader)
  const maxCastles = Math.max(...Object.values(snapshot.castles), 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elev1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bg-elev2/50"
      >
        <span className="w-16 text-xs font-mono text-text-secondary">
          Раунд {snapshot.round_number}
        </span>
        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="flex-1 truncate text-xs text-text-primary">
          {leaderParticipation?.user.nickname ?? '—'}
        </span>
        <span className="text-xs text-text-secondary">
          макс. {maxCastles}🏰
        </span>
        <span className="ml-1 text-xs text-text-secondary">
          Угроза: {snapshot.wildlings_threat}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-text-secondary" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
        )}
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border-subtle px-4 py-3">
          {participations.map((participation) => {
            const castles = snapshot.castles[String(participation.id)] ?? 0
            const supply = snapshot.supply[String(participation.id)] ?? 0
            const color = FACTION_COLORS[participation.faction] ?? '#888'
            return (
              <div
                key={participation.id}
                className="flex items-center gap-3"
              >
                <div
                  className="h-3 w-1 rounded-full"
                  style={{ background: color }}
                />
                <span className="w-24 truncate text-xs text-text-secondary">
                  {participation.user.nickname}
                </span>
                <span className="text-xs text-text-secondary">
                  🏰 {castles}
                </span>
                <span className="text-xs text-text-secondary">
                  ⚓ {supply}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function WildlingsRaidWizard({
  currentThreat,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  participations,
}: {
  currentThreat: number
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: WildlingsRaidPayload) => Promise<void> | void
  participations: DomainParticipation[]
}) {
  const [step, setStep] = useState(1)
  const [outcome, setOutcome] = useState<WildlingsOutcome>('win')
  const [outcomeCardSlug, setOutcomeCardSlug] = useState<string>('')
  const [threatAfter, setThreatAfter] = useState(currentThreat)
  const [bids, setBids] = useState<Record<string, number>>(
    Object.fromEntries(
      participations.map((participation) => [String(participation.id), 0]),
    ),
  )

  const handleSubmit = async () => {
    await onSubmit({
      bids: participations.map((participation) => ({
        participation_id: participation.id,
        amount: bids[String(participation.id)] ?? 0,
      })),
      outcome,
      outcome_card_slug: outcomeCardSlug || null,
      wildlings_threat_after: threatAfter,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Атака одичалых">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
              Шаг {step} из 3
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {step === 1
                ? 'Укажите ставки каждого участника.'
                : step === 2
                  ? 'Зафиксируйте исход атаки.'
                  : 'Выберите карту исхода и новую угрозу.'}
            </p>
          </div>
          <div className="w-24">
            <WildlingsStepper value={threatAfter} onChange={setThreatAfter} />
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            {participations.map((participation) => {
              const color = FACTION_COLORS[participation.faction] ?? '#888'
              return (
                <div
                  key={participation.id}
                  className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3"
                >
                  <div
                    className="h-6 w-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {participation.user.nickname}
                    </p>
                    <p className="text-xs capitalize text-text-secondary">
                      {participation.faction}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[11px] uppercase tracking-widest text-text-secondary">
                      Ставка
                    </p>
                    <NumberStepper
                      value={bids[String(participation.id)] ?? 0}
                      min={0}
                      max={20}
                      onChange={(value) =>
                        setBids((current) => ({
                          ...current,
                          [String(participation.id)]: value,
                        }))
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setOutcome('win')}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                outcome === 'win'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary'
              }`}
            >
              <p className="text-sm font-semibold">Одичалые отбиты</p>
              <p className="mt-2 text-xs leading-6 opacity-80">
                Все ставки считаются успешной обороной стола.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setOutcome('loss')}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                outcome === 'loss'
                  ? 'border-red-500/40 bg-red-500/10 text-red-100'
                  : 'border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary'
              }`}
            >
              <p className="text-sm font-semibold">Одичалые прорвались</p>
              <p className="mt-2 text-xs leading-6 opacity-80">
                Зафиксируем поражение и карту последствий.
              </p>
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="wildlings-card"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-text-secondary"
              >
                Карта исхода
              </label>
              <select
                id="wildlings-card"
                value={outcomeCardSlug}
                onChange={(event) => setOutcomeCardSlug(event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-elev2 px-4 py-3 text-sm text-text-primary transition focus:border-text-secondary/40 focus:outline-none"
              >
                {WILDLINGS_OUTCOME_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-6 text-text-secondary">
                Карты исхода пока остаются техническими slug-ами до отдельного списка владельца.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-secondary">
                Угроза после атаки
              </p>
              <WildlingsStepper
                value={threatAfter}
                onChange={setThreatAfter}
              />
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          {step > 1 ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setStep((current) => current - 1)}
            >
              Назад
            </Button>
          ) : (
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Отмена
            </Button>
          )}
          {step < 3 ? (
            <Button
              className="flex-1"
              onClick={() => setStep((current) => current + 1)}
            >
              Дальше
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? 'Сохраняем…' : 'Зафиксировать атаку'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ClashTrackEditor({
  bids,
  label,
  onBidChange,
  onReorder,
  order,
  participations,
}: {
  bids: Record<string, number>
  label: string
  onBidChange: (participationId: number, bid: number) => void
  onReorder: (nextOrder: number[]) => void
  order: number[]
  participations: DomainParticipation[]
}) {
  const ordered = order
    .map((participationId) =>
      participations.find((participation) => participation.id === participationId),
    )
    .filter(Boolean) as DomainParticipation[]

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order]
    const target = idx + dir
    if (target < 0 || target >= next.length) {
      return
    }
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onReorder(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {label}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Задайте порядок на треке и ставки участников.
        </p>
      </div>

      {ordered.map((participation, index) => {
        const color = FACTION_COLORS[participation.faction] ?? '#888'
        return (
          <div
            key={participation.id}
            className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3"
          >
            <span className="w-5 text-center text-xs font-mono text-text-secondary">
              {index + 1}
            </span>
            <div className="flex gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="flex h-5 w-5 items-center justify-center rounded text-text-secondary transition hover:text-text-primary disabled:opacity-20"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === ordered.length - 1}
                onClick={() => move(index, 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-text-secondary transition hover:text-text-primary disabled:opacity-20"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div
              className="h-6 w-1.5 rounded-full"
              style={{ background: color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {participation.user.nickname}
              </p>
              <p className="text-xs capitalize text-text-secondary">
                {participation.faction}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] uppercase tracking-widest text-text-secondary">
                Ставка
              </p>
              <NumberStepper
                value={bids[String(participation.id)] ?? 0}
                min={0}
                max={20}
                onChange={(value) => onBidChange(participation.id, value)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ClashOfKingsWizard({
  initialTracks,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  participations,
}: {
  initialTracks: Record<ClashTrackName, number[]>
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: ClashOfKingsPayload) => Promise<void> | void
  participations: DomainParticipation[]
}) {
  const [step, setStep] = useState(1)
  const [tracks, setTracks] = useState<Record<ClashTrackName, number[]>>(
    initialTracks,
  )
  const [bids, setBids] = useState<
    Record<ClashTrackName, Record<string, number>>
  >({
    influence_throne: Object.fromEntries(
      initialTracks.influence_throne.map((id) => [String(id), 0]),
    ),
    influence_sword: Object.fromEntries(
      initialTracks.influence_sword.map((id) => [String(id), 0]),
    ),
    influence_court: Object.fromEntries(
      initialTracks.influence_court.map((id) => [String(id), 0]),
    ),
  })

  const trackMeta: Array<{
    key: ClashTrackName
    label: string
  }> = [
    { key: 'influence_throne', label: 'Железный Трон' },
    { key: 'influence_sword', label: 'Валирийский меч' },
    { key: 'influence_court', label: 'Королевский двор' },
  ]

  const currentTrack = trackMeta[step - 1]

  const toTrackPayload = (trackName: ClashTrackName) =>
    tracks[trackName].map((participationId, index) => ({
      participation_id: participationId,
      bid: bids[trackName][String(participationId)] ?? 0,
      place: index + 1,
    }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Битва королей">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            Шаг {step} из 3
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            По очереди выставьте треки влияния после аукциона.
          </p>
        </div>

        <ClashTrackEditor
          bids={bids[currentTrack.key]}
          label={currentTrack.label}
          onBidChange={(participationId, bid) =>
            setBids((current) => ({
              ...current,
              [currentTrack.key]: {
                ...current[currentTrack.key],
                [String(participationId)]: bid,
              },
            }))
          }
          onReorder={(nextOrder) =>
            setTracks((current) => ({
              ...current,
              [currentTrack.key]: nextOrder,
            }))
          }
          order={tracks[currentTrack.key]}
          participations={participations}
        />

        <div className="flex gap-3">
          {step > 1 ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setStep((current) => current - 1)}
            >
              Назад
            </Button>
          ) : (
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Отмена
            </Button>
          )}
          {step < 3 ? (
            <Button
              className="flex-1"
              onClick={() => setStep((current) => current + 1)}
            >
              Дальше
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={isSubmitting}
              onClick={() =>
                void onSubmit({
                  influence_throne: toTrackPayload('influence_throne'),
                  influence_sword: toTrackPayload('influence_sword'),
                  influence_court: toTrackPayload('influence_court'),
                })
              }
            >
              {isSubmitting ? 'Сохраняем…' : 'Зафиксировать аукцион'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function EventCardsWizard({
  decks,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  decks: Record<number, string[]>
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payloads: EventCardPlayedPayload[]) => Promise<void> | void
}) {
  const deckEntries = Object.entries(decks)
    .map(([deckNumber, cards]) => ({
      deckNumber: Number(deckNumber),
      cards,
    }))
    .sort((left, right) => left.deckNumber - right.deckNumber)

  const [selectedCards, setSelectedCards] = useState<Record<number, string>>(
    Object.fromEntries(deckEntries.map(({ deckNumber }) => [deckNumber, ''])),
  )

  const selectedCount = Object.values(selectedCards).filter(Boolean).length

  const handleSubmit = async () => {
    const payloads = deckEntries
      .map(({ deckNumber }) => ({
        deck_number: deckNumber,
        card_slug: selectedCards[deckNumber],
      }))
      .filter((entry) => entry.card_slug)

    await onSubmit(payloads)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Карты Вестероса">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            Активные колоды
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Выберите сыгранные карты по каждой колоде. Пустые поля можно оставить
            без отправки.
          </p>
        </div>

        <div className="space-y-4">
          {deckEntries.map(({ deckNumber, cards }) => (
            <div
              key={deckNumber}
              className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-4"
            >
              <label
                htmlFor={`event-deck-${deckNumber}`}
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-text-secondary"
              >
                Колода {deckNumber}
              </label>
              <select
                id={`event-deck-${deckNumber}`}
                value={selectedCards[deckNumber] ?? ''}
                onChange={(event) =>
                  setSelectedCards((current) => ({
                    ...current,
                    [deckNumber]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-border-subtle bg-bg-elev2 px-4 py-3 text-sm text-text-primary transition focus:border-text-secondary/40 focus:outline-none"
              >
                <option value="">Не разыгрывалась</option>
                {cards.map((cardSlug) => (
                  <option key={cardSlug} value={cardSlug}>
                    {formatEventCardLabel(cardSlug)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
          <p className="text-sm text-text-secondary">
            Выбрано карт: <span className="font-mono text-text-primary">{selectedCount}</span>
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button
              disabled={isSubmitting || selectedCount === 0}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? 'Сохраняем…' : 'Зафиксировать карты'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function RoundTrackerPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null

  const sessionQuery = useSessionDetail(sessionId)
  const roundsQuery = useRounds(sessionId)
  const completeRoundMutation = useCompleteRound(sessionId!)
  const discardMutation = useDiscardLastRound(sessionId!)
  const wildlingsRaidMutation = useRecordWildlingsRaid(sessionId!)
  const clashOfKingsMutation = useRecordClashOfKings(sessionId!)
  const eventCardMutation = useRecordEventCard(sessionId!)
  const replaceMutation = useReplaceParticipant(sessionId!)
  const usersQuery = useUsers()

  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWildlingsOpen, setIsWildlingsOpen] = useState(false)
  const [isClashOpen, setIsClashOpen] = useState(false)
  const [isEventCardsOpen, setIsEventCardsOpen] = useState(false)
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [toastState, setToastState] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const initForm = (
    participations: DomainParticipation[],
    lastSnapshot?: ApiRoundSnapshot,
  ) => ({
    influenceThrone:
      lastSnapshot?.influence_throne ?? participations.map((p) => p.id),
    influenceSword:
      lastSnapshot?.influence_sword ?? participations.map((p) => p.id),
    influenceCourt:
      lastSnapshot?.influence_court ?? participations.map((p) => p.id),
    supply: Object.fromEntries(
      participations.map((p) => [
        String(p.id),
        lastSnapshot?.supply[String(p.id)] ?? 1,
      ]),
    ),
    castles: Object.fromEntries(
      participations.map((p) => [
        String(p.id),
        lastSnapshot?.castles[String(p.id)] ?? 0,
      ]),
    ),
    wildlingsThreat: lastSnapshot?.wildlings_threat ?? 4,
    note: '',
  })

  const session = sessionQuery.data
  const rounds = roundsQuery.data ?? []
  const lastSnapshot = rounds.length > 0 ? rounds[rounds.length - 1] : undefined
  const participations = session?.participations ?? []

  const [form, setForm] = useState(() =>
    initForm(participations, lastSnapshot),
  )

  if (sessionId === null) {
    return <Navigate replace to="/404" />
  }

  if (sessionQuery.isLoading || roundsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="flex items-center gap-4 rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем трекер…</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return <Navigate replace to="/404" />
  }

  if (session.status !== 'in_progress') {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8">
          <p className="text-sm text-text-secondary">
            Трекер доступен только для партий в процессе.
          </p>
        </section>
      </main>
    )
  }

  const handleOpenForm = () => {
    setForm(initForm(participations, lastSnapshot))
    setShowForm(true)
    setError(null)
  }

  const handleCompleteRound = async () => {
    setError(null)
    try {
      await completeRoundMutation.mutateAsync({
        influence_throne: form.influenceThrone,
        influence_sword: form.influenceSword,
        influence_court: form.influenceCourt,
        supply: form.supply,
        castles: form.castles,
        wildlings_threat: form.wildlingsThreat,
        note: form.note,
      })
      setShowForm(false)
    } catch {
      setError('Ошибка сохранения раунда. Проверьте данные.')
    }
  }

  const handleDiscard = async () => {
    if (!lastSnapshot || lastSnapshot.round_number === 0) {
      return
    }
    if (!confirm(`Удалить раунд ${lastSnapshot.round_number}?`)) {
      return
    }
    await discardMutation.mutateAsync(lastSnapshot.id)
  }

  const handleWildlingsRaid = async (payload: WildlingsRaidPayload) => {
    try {
      await wildlingsRaidMutation.mutateAsync(payload)
      setIsWildlingsOpen(false)
      setToastState({
        message: 'Атака одичалых зафиксирована в хронологии партии.',
        type: 'success',
      })
    } catch {
      setToastState({
        message: 'Не удалось сохранить атаку одичалых. Проверьте форму.',
        type: 'error',
      })
    }
  }

  const handleClashOfKings = async (payload: ClashOfKingsPayload) => {
    try {
      await clashOfKingsMutation.mutateAsync(payload)
      setIsClashOpen(false)
      setToastState({
        message: 'Битва королей зафиксирована в хронологии партии.',
        type: 'success',
      })
    } catch {
      setToastState({
        message: 'Не удалось сохранить битву королей. Проверьте форму.',
        type: 'error',
      })
    }
  }

  const handleEventCards = async (payloads: EventCardPlayedPayload[]) => {
    if (payloads.length === 0) {
      setToastState({
        message: 'Выберите хотя бы одну карту, чтобы сохранить событие.',
        type: 'error',
      })
      return
    }

    try {
      for (const payload of payloads) {
        await eventCardMutation.mutateAsync(payload)
      }
      setIsEventCardsOpen(false)
      setToastState({
        message: 'Карты Вестероса зафиксированы в хронологии партии.',
        type: 'success',
      })
    } catch {
      setToastState({
        message: 'Не удалось сохранить карты Вестероса. Проверьте выбранные значения.',
        type: 'error',
      })
    }
  }

  const handleReplaceParticipant = async (payload: ReplaceParticipantPayload) => {
    try {
      await replaceMutation.mutateAsync(payload)
      setIsReplaceOpen(false)
      setToastState({
        message: 'Замена игрока зафиксирована.',
        type: 'success',
      })
    } catch {
      setToastState({
        message: 'Не удалось заменить игрока. Проверьте выбранного пользователя.',
        type: 'error',
      })
    }
  }

  const currentCastles = lastSnapshot
    ? participations.map((participation) => ({
        castles: lastSnapshot.castles[String(participation.id)] ?? 0,
        participation,
      }))
    : participations.map((participation) => ({
        castles: 0,
        participation,
      }))

  const leader = [...currentCastles].sort(
    (left, right) => right.castles - left.castles,
  )[0]
  const hasWinner = (leader?.castles ?? 0) >= 7
  const currentThreat = lastSnapshot?.wildlings_threat ?? 4
  const clashTracks: Record<ClashTrackName, number[]> = {
    influence_throne:
      lastSnapshot?.influence_throne ?? participations.map((p) => p.id),
    influence_sword:
      lastSnapshot?.influence_sword ?? participations.map((p) => p.id),
    influence_court:
      lastSnapshot?.influence_court ?? participations.map((p) => p.id),
  }
  const eventDecks = getEventDecksForMode(session.mode.slug)

  return (
    <>
      <main className="mx-auto max-w-2xl space-y-6 px-4">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Castle className="h-5 w-5 text-text-secondary" />
              <span className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                В процессе · {session.mode.name}
              </span>
            </div>
            <span className="font-mono text-sm text-text-secondary">
              Раунд {lastSnapshot?.round_number ?? 0}
            </span>
          </div>
          <h1 className="font-display text-2xl text-text-primary">
            Трекер раундов
          </h1>

          {lastSnapshot ? (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Угроза одичалых
                </span>
                <span className="text-xs font-mono text-text-secondary">
                  {lastSnapshot.wildlings_threat}
                </span>
              </div>
              <div className="flex gap-1">
                {WILDLINGS_POSITIONS.map((pos) => (
                  <div
                    key={pos}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      pos <= lastSnapshot.wildlings_threat
                        ? pos >= 10
                          ? 'bg-red-500'
                          : pos >= 6
                            ? 'bg-amber-400'
                            : 'bg-text-secondary/50'
                        : 'border border-border-subtle bg-bg-elev2'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl text-text-primary">
                Боевые действия
              </h2>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Отдельные мастеры для специальных событий партии.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setIsWildlingsOpen(true)}
                className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 text-left transition hover:border-amber-400/40"
              >
                <div className="flex items-center gap-2 text-amber-300">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-semibold text-text-primary">
                    Атака одичалых
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Ставки, исход и карта последствий в 3 шага.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setIsClashOpen(true)}
                className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 text-left transition hover:border-gold/40"
              >
                <div className="flex items-center gap-2 text-gold">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-semibold text-text-primary">
                    Битва королей
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Три этапа по каждому треку влияния с порядком и ставками.
                </p>
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="open-event-cards"
            onClick={() => setIsEventCardsOpen(true)}
            className="mt-4 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 text-left transition hover:border-text-secondary/40"
          >
            <div className="flex items-center gap-2 text-text-secondary">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold text-text-primary">
                Карты Вестероса
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Выбор карт из активных колод с последовательной отправкой в хронологию.
            </p>
          </button>
          <button
            type="button"
            aria-label="open-replace-participant"
            onClick={() => setIsReplaceOpen(true)}
            className="mt-2 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 text-left transition hover:border-red-400/30"
          >
            <div className="flex items-center gap-2 text-red-300">
              <Shuffle className="h-4 w-4" />
              <span className="text-sm font-semibold text-text-primary">
                Заменить игрока
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Вывести участника из партии и добавить другого пользователя на его место.
            </p>
          </button>
          <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
              Текущее давление
            </p>
            <p className="mt-2 text-sm text-text-primary">
              Маркер угрозы сейчас на отметке{' '}
              <span className="font-mono">{currentThreat}</span>.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-widest text-text-secondary">
            Текущие позиции
          </h2>
          {[...currentCastles]
            .sort((left, right) => right.castles - left.castles)
            .map(({ castles, participation }, index) => {
              const color = FACTION_COLORS[participation.faction] ?? '#888'
              const isLeader = index === 0
              return (
                <div
                  key={participation.id}
                  className={`flex items-center gap-4 rounded-2xl border px-5 py-3 transition-all ${
                    hasWinner && isLeader
                      ? 'border-amber-400/30 bg-amber-950/30'
                      : 'border-border-subtle bg-bg-elev1'
                  }`}
                >
                  <span className="w-5 text-xs font-mono text-text-secondary">
                    {index + 1}
                  </span>
                  <div
                    className="h-7 w-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {participation.user.nickname}
                    </p>
                    <p className="text-xs capitalize text-text-secondary">
                      {participation.faction}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`h-2.5 w-4 rounded-sm ${
                            itemIndex < castles
                              ? castles >= 7
                                ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                                : 'bg-text-secondary/70'
                              : 'border border-border-subtle bg-bg-elev2'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {castles}/7
                    </span>
                  </div>
                </div>
              )
            })}
        </section>

        {hasWinner ? (
          <section className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-950/20 px-5 py-4">
            <Trophy className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-200">
                Есть победитель!
              </p>
              <p className="mt-0.5 text-xs text-amber-300/70">
                {leader.participation.user.nickname} набрал 7 замков. Можно
                финализировать.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/matches/${sessionId}/finalize`)}
            >
              Завершить
            </Button>
          </section>
        ) : null}

        {showForm ? (
          <section className="space-y-6 rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6">
            <h2 className="font-display text-xl text-text-primary">
              Раунд {(lastSnapshot?.round_number ?? 0) + 1}
            </h2>

            <div className="space-y-4">
              <InfluenceTrack
                label="Железный Трон"
                icon={<Trophy className="h-3.5 w-3.5" />}
                participations={participations}
                order={form.influenceThrone}
                onReorder={(order) =>
                  setForm((current) => ({ ...current, influenceThrone: order }))
                }
              />
              <InfluenceTrack
                label="Меч"
                icon={<Sword className="h-3.5 w-3.5" />}
                participations={participations}
                order={form.influenceSword}
                onReorder={(order) =>
                  setForm((current) => ({ ...current, influenceSword: order }))
                }
              />
              <InfluenceTrack
                label="Двор"
                icon={<Zap className="h-3.5 w-3.5" />}
                participations={participations}
                order={form.influenceCourt}
                onReorder={(order) =>
                  setForm((current) => ({ ...current, influenceCourt: order }))
                }
              />
            </div>

            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-secondary">
                Снабжение и замки
              </h3>
              <div className="space-y-2">
                {participations.map((participation) => {
                  const color = FACTION_COLORS[participation.faction] ?? '#888'
                  const castles =
                    form.castles[String(participation.id)] ?? 0
                  const supply = form.supply[String(participation.id)] ?? 1
                  return (
                    <div
                      key={participation.id}
                      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elev2 px-4 py-2.5"
                    >
                      <div
                        className="h-5 w-1 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="flex-1 truncate text-xs text-text-primary">
                        {participation.user.nickname}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-text-secondary">
                            🏰
                          </span>
                          <NumberStepper
                            value={castles}
                            min={0}
                            max={7}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                castles: {
                                  ...current.castles,
                                  [String(participation.id)]: value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-text-secondary">
                            ⚓
                          </span>
                          <NumberStepper
                            value={supply}
                            min={0}
                            max={6}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                supply: {
                                  ...current.supply,
                                  [String(participation.id)]: value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-secondary">
                Угроза одичалых
              </h3>
              <WildlingsStepper
                value={form.wildlingsThreat}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    wildlingsThreat: value as WildlingsThreatValue,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-text-secondary">
                Заметка (необязательно)
              </label>
              <input
                type="text"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Что произошло в этом раунде…"
                className="w-full rounded-xl border border-border-subtle bg-bg-elev2 px-4 py-2.5 text-sm text-text-primary transition placeholder:text-text-secondary/50 focus:border-text-secondary/40 focus:outline-none"
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary"
              >
                Отмена
              </button>
              <Button
                variant="primary"
                onClick={() => void handleCompleteRound()}
                disabled={completeRoundMutation.isPending}
              >
                {completeRoundMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохраняем…
                  </span>
                ) : (
                  'Завершить раунд'
                )}
              </Button>
            </div>
          </section>
        ) : (
          <section className="flex gap-3">
            <Button variant="primary" fullWidth onClick={handleOpenForm}>
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Завершить раунд {(lastSnapshot?.round_number ?? 0) + 1}
              </span>
            </Button>
            {lastSnapshot && lastSnapshot.round_number > 0 ? (
              <button
                type="button"
                onClick={() => void handleDiscard()}
                disabled={discardMutation.isPending}
                className="rounded-xl border border-border-subtle px-4 py-2.5 text-text-secondary transition hover:border-red-400/40 hover:text-red-400 disabled:opacity-40"
                title="Удалить последний раунд"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </section>
        )}

        {rounds.filter((round) => round.round_number > 0).length > 0 ? (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-medium uppercase tracking-widest text-text-secondary">
              История раундов
            </h2>
            {[...rounds]
              .reverse()
              .filter((round) => round.round_number > 0)
              .map((snapshot) => (
                <RoundHistoryCard
                  key={snapshot.id}
                  snapshot={snapshot}
                  participations={participations}
                />
              ))}
          </section>
        ) : null}
      </main>

      {isWildlingsOpen ? (
        <WildlingsRaidWizard
          key={`${sessionId}-${currentThreat}-${participations.length}`}
          currentThreat={currentThreat}
          isOpen={isWildlingsOpen}
          isSubmitting={wildlingsRaidMutation.isPending}
          onClose={() => setIsWildlingsOpen(false)}
          onSubmit={handleWildlingsRaid}
          participations={participations}
        />
      ) : null}

      {isClashOpen ? (
        <ClashOfKingsWizard
          key={`${sessionId}-${lastSnapshot?.id ?? 0}-clash`}
          initialTracks={clashTracks}
          isOpen={isClashOpen}
          isSubmitting={clashOfKingsMutation.isPending}
          onClose={() => setIsClashOpen(false)}
          onSubmit={handleClashOfKings}
          participations={participations}
        />
      ) : null}

      {isEventCardsOpen ? (
        <EventCardsWizard
          key={`${session.mode.slug}-event-cards`}
          decks={eventDecks}
          isOpen={isEventCardsOpen}
          isSubmitting={eventCardMutation.isPending}
          onClose={() => setIsEventCardsOpen(false)}
          onSubmit={handleEventCards}
        />
      ) : null}

      {isReplaceOpen ? (
        <ReplaceParticipantModal
          isOpen={isReplaceOpen}
          isSubmitting={replaceMutation.isPending}
          onClose={() => setIsReplaceOpen(false)}
          onSubmit={handleReplaceParticipant}
          participations={participations}
          availableUsers={usersQuery.data ?? []}
        />
      ) : null}

      <Toast
        message={toastState?.message ?? ''}
        onClose={() => setToastState(null)}
        type={toastState?.type ?? 'success'}
        visible={toastState !== null}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReplaceParticipantModal
// ─────────────────────────────────────────────────────────────────────────────

interface ReplaceParticipantModalProps {
  availableUsers: DomainPublicUser[]
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: ReplaceParticipantPayload) => Promise<void>
  participations: DomainParticipation[]
}

function ReplaceParticipantModal({
  availableUsers,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  participations,
}: ReplaceParticipantModalProps) {
  const currentUserIds = new Set(participations.map((p) => p.user.id))
  const eligibleUsers = availableUsers.filter((u) => !currentUserIds.has(u.id))

  const [outId, setOutId] = useState<string>(
    participations[0] ? String(participations[0].user.id) : '',
  )
  const [inId, setInId] = useState<string>(
    eligibleUsers[0] ? String(eligibleUsers[0].id) : '',
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Заменить игрока">
      <div className="space-y-4 p-1">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-text-secondary">
            Кого выводим
          </label>
          <select
            value={outId}
            onChange={(e) => setOutId(e.target.value)}
            className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
          >
            {participations.map((p) => (
              <option key={p.user.id} value={String(p.user.id)}>
                {p.user.nickname} ({p.faction})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-text-secondary">
            Кто заходит
          </label>
          {eligibleUsers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-3 text-sm text-text-tertiary">
              Нет доступных пользователей для замены.
            </p>
          ) : (
            <select
              value={inId}
              onChange={(e) => setInId(e.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            >
              {eligibleUsers.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.nickname}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            disabled={isSubmitting || !outId || !inId || eligibleUsers.length === 0}
            onClick={async () => {
              await onSubmit({
                out_user_id: Number(outId),
                in_user_id: Number(inId),
              })
            }}
          >
            {isSubmitting ? 'Сохраняем…' : 'Заменить'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
