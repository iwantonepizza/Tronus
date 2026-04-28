import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { LeaderboardRow } from '@/components/stats/LeaderboardRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLeaderboardStats } from '@/hooks/useStats'
import { cn } from '@/lib/cn'
import type { LeaderboardMetric } from '@/api/types'

const metrics: Array<{ label: string; value: LeaderboardMetric }> = [
  { label: 'Winrate', value: 'winrate' },
  { label: 'Wins', value: 'wins' },
  { label: 'Games', value: 'games' },
  { label: 'Crowns', value: 'crowns' },
  { label: 'Shits', value: 'shits' },
  { label: 'Avg place', value: 'avg_place' },
]

export function LeaderboardPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>('winrate')
  const leaderboardQuery = useLeaderboardStats(metric, 20)

  if (leaderboardQuery.isLoading) {
    return <PageStatus title="Loading leaderboard..." />
  }

  if (leaderboardQuery.isError || !leaderboardQuery.data) {
    return (
      <EmptyState
        icon={<Trophy className="h-5 w-5" />}
        title="Leaderboard is unavailable"
        description="Stats API did not return a leaderboard payload."
      />
    )
  }

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Leaderboard
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Season ratings
        </h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {metrics.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition',
                metric === item.value
                  ? 'border-gold bg-gold text-black'
                  : 'border-border-subtle bg-bg-base text-text-secondary hover:border-gold hover:text-gold',
              )}
              onClick={() => setMetric(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {leaderboardQuery.data.results.map((entry) => (
              <motion.div
                key={entry.user.id}
                layout
                layoutId={`leaderboard-row-${entry.user.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <LeaderboardRow
                  metricLabel={leaderboardQuery.data.label}
                  metricValue={formatMetric(metric, entry.metricValue)}
                  rank={entry.rank}
                  user={entry.user}
                />
              </motion.div>
            ))}
          </AnimatePresence>
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

function formatMetric(metric: LeaderboardMetric, value: number | null) {
  if (value === null) {
    return '-'
  }

  if (metric === 'winrate') {
    return `${Math.round(value * 100)}%`
  }

  if (metric === 'avg_place') {
    return value.toFixed(2)
  }

  return String(value)
}
