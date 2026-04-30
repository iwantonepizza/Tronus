import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFactionStatsList } from '@/hooks/useStats'

export function FactionsPage() {
  const factionsQuery = useFactionStatsList()

  if (factionsQuery.isLoading) {
    return <PageStatus title="Загружаем мету фракций..." />
  }

  if (factionsQuery.isError || !factionsQuery.data) {
    return (
      <EmptyState
        icon={<Shield className="h-5 w-5" />}
        title="Статистика фракций недоступна"
        description="Stats endpoint не вернул агрегаты по фракциям."
      />
    )
  }

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Фракции
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Карта меты
        </h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {factionsQuery.data.map((stats) => (
          <Link
            key={stats.faction.slug}
            to={`/factions/${stats.faction.slug}`}
            className="group relative overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-gold/50"
          >
            <div
              className="absolute inset-0 opacity-25 transition group-hover:opacity-40"
              style={{
                background: `radial-gradient(circle at 80% 0%, ${stats.faction.color}, transparent 55%)`,
              }}
            />
            <div className="relative">
              <Shield className="h-10 w-10 text-gold" />
              <h2 className="mt-5 font-display text-3xl text-text-primary">
                {stats.faction.name}
              </h2>
              <dl className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="Партии" value={stats.totalGames} />
                <MiniStat label="Победы" value={stats.wins} />
                <MiniStat label="Винрейт" value={formatPercent(stats.winrate)} />
              </dl>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-base/80 px-3 py-3">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-text-primary">{value}</dd>
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
