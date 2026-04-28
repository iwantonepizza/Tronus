import { Link, useParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { LeaderboardRow } from '@/components/stats/LeaderboardRow'
import { StatTile } from '@/components/stats/StatTile'
import { WinrateBar } from '@/components/stats/WinrateBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFactionStats } from '@/hooks/useStats'

export function FactionDetailPage() {
  const params = useParams()
  const factionQuery = useFactionStats(params.slug)

  if (factionQuery.isLoading) {
    return <PageStatus title="Loading faction detail..." />
  }

  if (factionQuery.isError || !factionQuery.data) {
    return (
      <EmptyState
        icon={<Shield className="h-5 w-5" />}
        title="Faction was not found"
        description="This house is missing or inactive in reference data."
      />
    )
  }

  const stats = factionQuery.data

  return (
    <main className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 85% 0%, ${stats.faction.color}, transparent 58%)`,
          }}
        />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
            Faction Detail
          </p>
          <h1 className="mt-4 font-display text-5xl text-text-primary">
            {stats.faction.name}
          </h1>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Games" value={stats.totalGames} />
        <StatTile label="Wins" value={stats.wins} />
        <StatTile label="Winrate" value={formatPercent(stats.winrate)} />
        <StatTile label="Avg place" value={formatNumber(stats.avgPlace)} />
        <StatTile label="Avg castles" value={formatNumber(stats.avgCastles)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Winrate by mode
          </h2>
          <div className="mt-5 space-y-4">
            {stats.byMode.map((entry) => (
              <WinrateBar
                key={entry.mode}
                faction={stats.faction}
                label={`${entry.mode} / ${entry.games} games`}
                value={entry.winrate ?? 0}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Best players
          </h2>
          <div className="mt-5 space-y-3">
            {stats.topPlayers.map((entry, index) => (
              <Link key={entry.user.id} to={`/players/${entry.user.id}`}>
                <LeaderboardRow
                  metricLabel={`${entry.games} games`}
                  metricValue={formatPercent(entry.winrate)}
                  rank={index + 1}
                  user={entry.user}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
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
