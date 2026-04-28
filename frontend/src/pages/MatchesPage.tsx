import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Funnel, RotateCcw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MatchCard } from '@/components/match/MatchCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useSessions } from '@/hooks/useSessions'
import { useUsers } from '@/hooks/useUsers'
import { cn } from '@/lib/cn'
import type {
  DomainDeck,
  DomainGameMode,
  FactionSlug,
  SessionStatus,
} from '@/types/domain'

type StatusFilter = SessionStatus | 'all'
type SortOption = 'newest' | 'oldest' | 'longest'

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Все', value: 'all' },
  { label: 'Сыграны', value: 'completed' },
  { label: 'Запланированы', value: 'planned' },
  { label: 'Отменены', value: 'cancelled' },
]

const sortOptions: Array<{ label: string; value: SortOption }> = [
  { label: 'Новые', value: 'newest' },
  { label: 'Старые', value: 'oldest' },
  { label: 'По раундам', value: 'longest' },
]

export function MatchesPage() {
  const referenceQuery = useReferenceData()
  const usersQuery = useUsers()
  const sessionsQuery = useSessions()

  const [status, setStatus] = useState<StatusFilter>('all')
  const [mode, setMode] = useState<string | 'all'>('all')
  const [deck, setDeck] = useState<string | 'all'>('all')
  const [playerId, setPlayerId] = useState<number | 'all'>('all')
  const [faction, setFaction] = useState<FactionSlug | 'all'>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const filteredMatches = (sessionsQuery.data ?? [])
    .filter((match) => {
      if (status !== 'all' && match.status !== status) {
        return false
      }

      if (mode !== 'all' && match.mode.slug !== mode) {
        return false
      }

      if (deck !== 'all' && match.deck.slug !== deck) {
        return false
      }

      if (
        playerId !== 'all' &&
        !match.participations.some(
          (participation) => participation.user.id === playerId,
        )
      ) {
        return false
      }

      if (
        faction !== 'all' &&
        !match.participations.some(
          (participation) => participation.faction === faction,
        )
      ) {
        return false
      }

      if (query.trim()) {
        const normalizedQuery = query.trim().toLowerCase()
        const hitsQuery =
          match.planningNote.toLowerCase().includes(normalizedQuery) ||
          String(match.id).includes(normalizedQuery) ||
          match.participations.some((participation) =>
            participation.user.nickname.toLowerCase().includes(normalizedQuery),
          )

        if (!hitsQuery) {
          return false
        }
      }

      const matchDate = match.scheduledAt.slice(0, 10)

      if (dateFrom && matchDate < dateFrom) {
        return false
      }

      if (dateTo && matchDate > dateTo) {
        return false
      }

      return true
    })
    .sort((left, right) => {
      if (sort === 'newest') {
        return (
          new Date(right.scheduledAt).getTime() -
          new Date(left.scheduledAt).getTime()
        )
      }

      if (sort === 'oldest') {
        return (
          new Date(left.scheduledAt).getTime() -
          new Date(right.scheduledAt).getTime()
        )
      }

      return (
        (right.outcome?.roundsPlayed ?? 0) - (left.outcome?.roundsPlayed ?? 0)
      )
    })

  const resetFilters = () => {
    setStatus('all')
    setMode('all')
    setDeck('all')
    setPlayerId('all')
    setFaction('all')
    setSort('newest')
    setQuery('')
    setDateFrom('')
    setDateTo('')
  }

  if (
    referenceQuery.isLoading ||
    usersQuery.isLoading ||
    sessionsQuery.isLoading
  ) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем ленту партий…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Подтягиваем список сессий, игроков и справочники для фильтров.
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isError || usersQuery.isError || sessionsQuery.isError) {
    return (
      <main className="space-y-6">
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Не удалось загрузить матчи"
          description="Фронт не смог собрать данные для списка. Проверьте backend и повторите попытку."
          cta={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          }
        />
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Matches Index
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              Лента партий
            </h1>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              Полный список с быстрыми фильтрами по статусу, режиму, составу и
              диапазону дат.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="lg:hidden"
              iconLeft={<Funnel className="h-4 w-4" />}
              variant="secondary"
              onClick={() => setIsFiltersOpen(true)}
            >
              Фильтры
            </Button>
            <Link
              to="/matches/new"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-hover"
            >
              Новая партия
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <FiltersPanel
            dateFrom={dateFrom}
            dateTo={dateTo}
            deck={deck}
            decks={referenceQuery.data?.decks ?? []}
            faction={faction}
            factions={referenceQuery.data?.factions ?? []}
            mode={mode}
            modes={referenceQuery.data?.modes ?? []}
            playerId={playerId}
            players={usersQuery.data ?? []}
            query={query}
            sort={sort}
            status={status}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onDeckChange={setDeck}
            onFactionChange={setFaction}
            onModeChange={setMode}
            onPlayerChange={setPlayerId}
            onQueryChange={setQuery}
            onReset={resetFilters}
            onSortChange={setSort}
            onStatusChange={setStatus}
          />
        </aside>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border-subtle bg-bg-elev1 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  active={status === option.value}
                  label={option.label}
                  onClick={() => setStatus(option.value)}
                />
              ))}
            </div>
            <span className="text-sm text-text-secondary">
              Найдено матчей: {filteredMatches.length}
            </span>
          </div>

          {filteredMatches.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.24 }}
                >
                  <Link to={`/matches/${match.id}`} className="block">
                    <MatchCard match={match} />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              cta={
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              }
              description="Под эти фильтры пока ничего не найдено. Попробуйте ослабить условия или откройте полный список."
              icon={<Search className="h-5 w-5" />}
              title="Партий не найдено"
            />
          )}
        </section>
      </div>

      <Modal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title="Фильтры матчей"
      >
        <FiltersPanel
          dateFrom={dateFrom}
          dateTo={dateTo}
          deck={deck}
          decks={referenceQuery.data?.decks ?? []}
          faction={faction}
          factions={referenceQuery.data?.factions ?? []}
          mode={mode}
          modes={referenceQuery.data?.modes ?? []}
          playerId={playerId}
          players={usersQuery.data ?? []}
          query={query}
          sort={sort}
          status={status}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onDeckChange={setDeck}
          onFactionChange={setFaction}
          onModeChange={setMode}
          onPlayerChange={setPlayerId}
          onQueryChange={setQuery}
          onReset={resetFilters}
          onSortChange={setSort}
          onStatusChange={setStatus}
        />
      </Modal>
    </main>
  )
}

function FiltersPanel({
  dateFrom,
  dateTo,
  deck,
  decks,
  faction,
  factions,
  mode,
  modes,
  playerId,
  players,
  query,
  sort,
  status,
  onDateFromChange,
  onDateToChange,
  onDeckChange,
  onFactionChange,
  onModeChange,
  onPlayerChange,
  onQueryChange,
  onReset,
  onSortChange,
  onStatusChange,
}: {
  dateFrom: string
  dateTo: string
  deck: DomainDeck['slug'] | 'all'
  decks: DomainDeck[]
  faction: FactionSlug | 'all'
  factions: Array<{ slug: FactionSlug; name: string }>
  mode: DomainGameMode['slug'] | 'all'
  modes: DomainGameMode[]
  playerId: number | 'all'
  players: Array<{ id: number; nickname: string }>
  query: string
  sort: SortOption
  status: StatusFilter
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onDeckChange: (value: DomainDeck['slug'] | 'all') => void
  onFactionChange: (value: FactionSlug | 'all') => void
  onModeChange: (value: DomainGameMode['slug'] | 'all') => void
  onPlayerChange: (value: number | 'all') => void
  onQueryChange: (value: string) => void
  onReset: () => void
  onSortChange: (value: SortOption) => void
  onStatusChange: (value: StatusFilter) => void
}) {
  return (
    <div className="space-y-5 rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-text-primary">Фильтры</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-gold"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
          Сбросить
        </button>
      </div>

      <Input
        label="Поиск"
        placeholder="Матч, игрок или заметка"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div>
        <FilterLabel>Статус</FilterLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <FilterChip
              key={option.value}
              active={status === option.value}
              label={option.label}
              onClick={() => onStatusChange(option.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <FilterLabel>Режим</FilterLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            active={mode === 'all'}
            label="Все"
            onClick={() => onModeChange('all')}
          />
          {modes.map((item) => (
            <FilterChip
              key={item.slug}
              active={mode === item.slug}
              label={item.name}
              onClick={() => onModeChange(item.slug)}
            />
          ))}
        </div>
      </div>

      <Select
        label="Колода"
        value={deck}
        onChange={(event) =>
          onDeckChange(event.target.value as DomainDeck['slug'] | 'all')
        }
        options={[
          { label: 'Все', value: 'all' },
          ...decks.map((item) => ({ label: item.name, value: item.slug })),
        ]}
      />

      <Select
        label="Игрок"
        value={String(playerId)}
        onChange={(event) =>
          onPlayerChange(
            event.target.value === 'all' ? 'all' : Number(event.target.value),
          )
        }
        options={[
          { label: 'Все игроки', value: 'all' },
          ...players.map((item) => ({
            label: item.nickname,
            value: String(item.id),
          })),
        ]}
      />

      <Select
        label="Фракция"
        value={faction}
        onChange={(event) =>
          onFactionChange(event.target.value as FactionSlug | 'all')
        }
        options={[
          { label: 'Все фракции', value: 'all' },
          ...factions.map((item) => ({
            label: item.name,
            value: item.slug,
          })),
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <FilterLabel>С даты</FilterLabel>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 text-sm text-text-primary outline-none transition focus:border-gold/60"
          />
        </label>
        <label className="space-y-2">
          <FilterLabel>По дату</FilterLabel>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-border-subtle bg-bg-base px-4 text-sm text-text-primary outline-none transition focus:border-gold/60"
          />
        </label>
      </div>

      <div>
        <FilterLabel>Сортировка</FilterLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <FilterChip
              key={option.value}
              active={sort === option.value}
              label={option.label}
              onClick={() => onSortChange(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-3 py-2 text-sm transition',
        active
          ? 'border-gold bg-gold text-black'
          : 'border-border-subtle bg-bg-base text-text-secondary hover:border-gold hover:text-gold',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
      {children}
    </p>
  )
}
