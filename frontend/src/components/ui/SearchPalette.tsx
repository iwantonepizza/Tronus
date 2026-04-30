import { useEffect, useRef, useState } from 'react'
import { Search, Shield, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchAll } from '@/api/search'
import type { SearchResults } from '@/api/search'

interface SearchPaletteProps {
  open: boolean
  onClose: () => void
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(query, 300)

  // Focus input when palette opens
  useEffect(() => {
    if (!open) return

    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])

  // Fetch results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      return
    }
    searchAll(debouncedQuery)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Keyboard close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.sessions.length > 0 ||
      results.factions.length > 0)

  function handleUser(id: number) {
    navigate(`/players/${id}`)
    onClose()
  }
  function handleSession(id: number) {
    navigate(`/matches/${id}`)
    onClose()
  }

  function handleQueryChange(value: string) {
    setQuery(value)

    if (value.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-[2rem] border border-border-subtle bg-bg-elev1 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Поиск по игрокам, партиям, фракциям…"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-text-tertiary transition hover:text-text-primary"
            aria-label="Закрыть поиск"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto p-3 space-y-1">
          {loading && (
            <p className="py-4 text-center text-sm text-text-tertiary">Ищем…</p>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <p className="py-4 text-center text-sm text-text-tertiary">Ничего не найдено</p>
          )}

          {!loading && query.length < 2 && (
            <p className="py-4 text-center text-sm text-text-tertiary">
              Введите минимум 2 символа
            </p>
          )}

          {results && results.users.length > 0 && (
            <section>
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-text-tertiary">
                Игроки
              </p>
              {results.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleUser(u.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-bg-base"
                >
                  <User className="h-4 w-4 shrink-0 text-text-tertiary" />
                  <span className="text-sm text-text-primary">{u.nickname}</span>
                </button>
              ))}
            </section>
          )}

          {results && results.sessions.length > 0 && (
            <section>
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-text-tertiary">
                Партии
              </p>
              {results.sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSession(s.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-bg-base"
                >
                  <span className="text-sm text-text-primary line-clamp-1">
                    {s.planning_note || `Партия #${s.id}`}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-text-tertiary capitalize">
                    {s.status}
                  </span>
                </button>
              ))}
            </section>
          )}

          {results && results.factions.length > 0 && (
            <section>
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-text-tertiary">
                Фракции
              </p>
              {results.factions.map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => { navigate(`/factions/${f.slug}`); onClose() }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-bg-base"
                >
                  <Shield className="h-4 w-4 shrink-0 text-text-tertiary" />
                  <span className="text-sm text-text-primary">{f.name}</span>
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
