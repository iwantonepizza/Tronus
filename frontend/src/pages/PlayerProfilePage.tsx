import { Link, useParams } from 'react-router-dom'
import { Crown, Skull, Trophy } from 'lucide-react'
import { FactionBadge } from '@/components/player/FactionBadge'
import { StatTile } from '@/components/stats/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePlayerStats } from '@/hooks/useStats'
import type { FactionSlug } from '@/types/domain'

export function PlayerProfilePage() {
  const params = useParams()
  const userId = params.id ? Number(params.id) : undefined
  const statsQuery = usePlayerStats(Number.isFinite(userId) ? userId : undefined)

  if (statsQuery.isLoading) {
    return <PageStatus title="Загружаем профиль игрока..." />
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <EmptyState
        icon={<Trophy className="h-5 w-5" />}
        title="Игрок не найден"
        description="Этот профиль отсутствует или скрыт из публичной статистики."
      />
    )
  }

  const stats = statsQuery.data

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top_left,_rgba(201,164,76,0.16),_transparent_34%),linear-gradient(135deg,_rgba(23,23,31,1),_rgba(14,14,18,0.98))] p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Профиль игрока
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-5xl text-text-primary">
              {stats.user.nickname}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3">
              {stats.favoriteFaction ? (
                <FactionBadge factionSlug={stats.favoriteFaction} />
              ) : null}
              <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
                {formatStreak(stats.currentStreak.type, stats.currentStreak.count)}
              </span>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border-subtle px-4 text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
          >
            Открыть таблицу
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={<Trophy className="h-5 w-5" />} label="Победы" value={stats.wins} />
        <StatTile
          icon={<Crown className="h-5 w-5" />}
          label="Винрейт"
          value={formatPercent(stats.winrate)}
        />
        <StatTile label="Среднее место" value={formatNumber(stats.avgPlace)} />
        <StatTile label="Средние замки" value={formatNumber(stats.avgCastles)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">Форма по фракциям</h2>
          <div className="mt-5 grid gap-3">
            <FactionStat label="Любимая" slug={stats.favoriteFaction} />
            <FactionStat label="Лучшая" slug={stats.bestFaction?.faction ?? null} />
            <FactionStat label="Худшая" slug={stats.worstFaction?.faction ?? null} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">Последние партии</h2>
          <div className="mt-5 space-y-3">
            {stats.last10.map((entry) => (
              <Link
                key={entry.matchId}
                to={`/matches/${entry.matchId}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 transition hover:border-gold/60"
              >
                <span className="font-mono text-xs text-text-tertiary">
                  #{entry.matchId}
                </span>
                <FactionBadge factionSlug={entry.faction} size="sm" />
                <span className="text-sm text-text-secondary">
                  место {entry.place ?? '-'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <VoteCard icon={<Crown className="h-5 w-5" />} label="Получено корон" value={stats.crownsReceived} />
        <VoteCard icon={<Skull className="h-5 w-5" />} label="Получено говен" value={stats.shitsReceived} />
      </section>
    </main>
  )
}

function FactionStat({
  label,
  slug,
}: {
  label: string
  slug: FactionSlug | null
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      {slug ? <FactionBadge factionSlug={slug} size="sm" /> : <span>-</span>}
    </div>
  )
}

function VoteCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-[1.75rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base text-gold">
        {icon}
      </div>
      <p className="mt-4 text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-4xl text-text-primary">{value}</p>
    </div>
  )
}

function PageStatus({ title }: { title: string }) {
  return (
    <main className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
      <p className="font-display text-3xl text-text-primary">{title}</p>
    </main>
  )
}

function formatPercent(value: number | null) {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}

function formatNumber(value: number | null) {
  return value === null ? '-' : value.toFixed(2)
}

function formatStreak(type: 'win' | 'loss' | null, count: number) {
  if (!type || count === 0) {
    return 'Без текущей серии'
  }

  return `${type === 'win' ? 'Серия побед' : 'Серия поражений'} ×${count}`
}
