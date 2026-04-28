import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Crown,
  Flame,
  ScrollText,
  Sparkles,
  Swords,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FactionBadge } from '@/components/player/FactionBadge'
import { MatchCard } from '@/components/match/MatchCard'
import { LeaderboardRow } from '@/components/stats/LeaderboardRow'
import { StatTile } from '@/components/stats/StatTile'
import { WinrateBar } from '@/components/stats/WinrateBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useOverviewStats } from '@/hooks/useStats'
import { cn } from '@/lib/cn'
import type { DomainOverviewStats } from '@/types/domain'

type RsvpState = 'going' | 'maybe' | 'not-going'

const rsvpOptions: Array<{
  label: string
  value: RsvpState
  variant: 'primary' | 'secondary' | 'ghost'
}> = [
  { label: 'Я иду', value: 'going', variant: 'primary' },
  { label: 'Под вопросом', value: 'maybe', variant: 'secondary' },
  { label: 'Не иду', value: 'not-going', variant: 'ghost' },
]

export function HomePage() {
  const overviewQuery = useOverviewStats()
  const [rsvp, setRsvp] = useState<RsvpState>('going')

  if (overviewQuery.isLoading || !overviewQuery.data) {
    return (
      <main className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-display text-3xl text-text-primary">
          Загружаем пульс сезона...
        </p>
      </main>
    )
  }

  if (overviewQuery.isError) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="Overview is unavailable"
        description="The overview stats endpoint did not respond."
      />
    )
  }

  const overview = overviewQuery.data
  const nextMatch = overview.nextMatch

  return (
    <main className="relative overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(201,164,76,0.18),_transparent_52%),linear-gradient(180deg,_rgba(23,23,31,0.96),_rgba(14,14,18,0))]" />
      <div className="pointer-events-none absolute left-[-12%] top-28 h-72 w-72 rounded-full bg-faction-targaryen/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-36 h-80 w-80 rounded-full bg-faction-stark/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold">
              Season Pulse
            </p>
            <h1 className="mt-4 text-balance font-display text-5xl leading-none text-text-primary sm:text-6xl">
              Hello Tronus
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              Главная теперь строится от реальных stats endpoints: ближайшая
              партия, свежие результаты, текущий лидер и состояние метагейма.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/matches"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-elev1 px-4 text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
            >
              Архив партий
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-base px-4 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
            >
              Лидерборд сезона
            </Link>
          </div>
        </header>

        {nextMatch ? (
          <HeroSection
            nextMatch={nextMatch}
            rsvp={rsvp}
            onRsvpChange={setRsvp}
          />
        ) : (
          <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
            <EmptyState
              icon={<Swords className="h-5 w-5" />}
              title="Ближайшая партия ещё не запланирована"
              description="Как только кто-то создаст новую сессию, она появится здесь главным блоком."
              cta={
                <Link
                  to="/matches/new"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-hover"
                >
                  Запланировать новую игру
                </Link>
              }
            />
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            countUp
            icon={<ScrollText className="h-5 w-5" />}
            label="Всего партий"
            trend={12}
            value={overview.totalMatches}
          />
          <StatTile
            countUp
            icon={<Users className="h-5 w-5" />}
            label="Активных игроков"
            trend={4}
            value={overview.activePlayers}
          />
          <StatTile
            icon={<Sparkles className="h-5 w-5" />}
            label="Любимая фракция"
            value={overview.mostPopularFaction?.faction.name ?? '-'}
          />
          <StatTile
            icon={<Crown className="h-5 w-5" />}
            label="Текущий лидер"
            value={overview.currentLeader?.user.nickname ?? '-'}
          />
        </section>

        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <SectionHeader
            action={
              <Link
                to="/matches"
                className="text-sm font-semibold text-gold transition hover:text-gold-hover"
              >
                Все партии
              </Link>
            }
            description="Последние результаты, чтобы быстро вспомнить, чем закончились недавние вечера."
            title="Последние партии"
          />
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {overview.recentMatches.slice(0, 5).map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="block min-w-[310px] flex-shrink-0"
              >
                <MatchCard match={match} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
            <SectionHeader
              action={
                <Link
                  to="/leaderboard"
                  className="text-sm font-semibold text-gold transition hover:text-gold-hover"
                >
                  Все →
                </Link>
              }
              description="Кто тащит сезон прямо сейчас."
              title="Топ-5 по винрейту"
            />
            <div className="mt-5 space-y-3">
              {overview.topWinrate.map((entry, index) => (
                <LeaderboardRow
                  key={entry.user.id}
                  metricLabel="Winrate"
                  metricValue={`${Math.round((entry.winrate ?? 0) * 100)}%`}
                  rank={index + 1}
                  user={entry.user}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
            <SectionHeader
              action={
                <Link
                  to="/factions"
                  className="text-sm font-semibold text-gold transition hover:text-gold-hover"
                >
                  Карта домов
                </Link>
              }
              description="Публичная матрица winrate по домам."
              title="Фракции в метагейме"
            />
            <div className="mt-5 space-y-4">
              {overview.factionWinrates.map((entry) => (
                <WinrateBar
                  key={entry.faction.slug}
                  faction={entry.faction}
                  value={entry.winrate ?? 0}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {overview.funFacts.map((fact, index) => {
            const Icon = getFunFactIcon(fact.icon)

            return (
              <motion.article
                key={fact.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.32 }}
                className="rounded-[2rem] border border-border-subtle bg-[linear-gradient(145deg,_rgba(23,23,31,1),_rgba(31,31,42,0.92))] p-5 shadow-panel"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-2xl text-text-primary">
                  {fact.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {fact.description}
                </p>
              </motion.article>
            )
          })}
        </section>
      </div>
    </main>
  )
}

function getFunFactIcon(icon: string) {
  switch (icon) {
    case 'Crown':
      return Crown
    case 'Zap':
      return Zap
    case 'Flame':
      return Flame
    default:
      return Sparkles
  }
}

function HeroSection({
  nextMatch,
  onRsvpChange,
  rsvp,
}: {
  nextMatch: NonNullable<DomainOverviewStats['nextMatch']>
  onRsvpChange: (value: RsvpState) => void
  rsvp: RsvpState
}) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="grid gap-6 rounded-[2rem] border border-gold/20 bg-[linear-gradient(135deg,_rgba(23,23,31,0.98),_rgba(31,31,42,0.92))] p-6 shadow-panel lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
            Ближайшая партия
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
            Match #{nextMatch.id}
          </span>
        </div>

        <h2 className="mt-5 max-w-3xl text-balance font-display text-4xl text-text-primary sm:text-5xl">
          {format(new Date(nextMatch.scheduledAt), 'dd MMMM, HH:mm')}
        </h2>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-text-secondary">
          <HeroMeta
            icon={<CalendarDays className="h-4 w-4" />}
            label={format(new Date(nextMatch.scheduledAt), 'EEEE')}
          />
          <HeroMeta
            icon={<Clock3 className="h-4 w-4" />}
            label={`${nextMatch.mode.name} • ${nextMatch.deck.name}`}
          />
          <HeroMeta
            icon={<Users className="h-4 w-4" />}
            label={`${nextMatch.participations.length} подтверждено`}
          />
        </div>

        <p className="mt-5 max-w-2xl text-base leading-8 text-text-secondary">
          {nextMatch.planningNote}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {rsvpOptions.map((option) => (
            <Button
              key={option.value}
              aria-label={`RSVP ${option.value}`}
              aria-pressed={rsvp === option.value}
              className={cn(
                'min-w-[148px]',
                rsvp === option.value &&
                  option.variant !== 'primary' &&
                  'border-gold text-gold',
              )}
              variant={option.variant}
              onClick={() => onRsvpChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-border-subtle bg-bg-base/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-text-primary">
              Подтверждённый состав
            </h3>
            <span className="text-xs uppercase tracking-[0.2em] text-text-tertiary">
              Host {nextMatch.createdBy.nickname}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {nextMatch.participations.map((participation, index) => (
              <motion.div
                key={participation.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.24 }}
                whileHover={{ y: -3 }}
                title={participation.user.nickname}
              >
                <div className="rounded-[1.5rem] border border-border-subtle bg-bg-elev1 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-bg-base font-semibold text-gold">
                      {participation.user.nickname.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">
                        {participation.user.nickname}
                      </p>
                      <div className="mt-1">
                        <FactionBadge
                          factionSlug={participation.faction}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border-subtle bg-bg-base/70 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
            Hero summary
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <SummaryStat label="Режим" value={nextMatch.mode.name} />
            <SummaryStat label="Колода" value={nextMatch.deck.name} />
            <SummaryStat label="Статус" value="planned" />
          </dl>
        </div>
      </div>
    </motion.section>
  )
}

function HeroMeta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-base/80 px-3 py-2">
      {icon}
      {label}
    </span>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-elev1 px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-2 font-display text-xl text-text-primary">{value}</dd>
    </div>
  )
}

function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description: string
  title: string
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl text-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-text-secondary">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
