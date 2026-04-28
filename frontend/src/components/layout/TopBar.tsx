import { Bell, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_MARK } from '@/components/layout/navigation'
import { useAuth } from '@/hooks/useAuth'

export function TopBar() {
  const BrandMark = BRAND_MARK
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-3 rounded-full px-2 py-1.5 text-gold transition hover:text-gold-hover"
        >
          <BrandMark className="h-5 w-5" />
          <span className="font-display text-lg tracking-[0.2em]">TRONUS</span>
        </Link>

        <button
          type="button"
          className="ml-auto hidden min-w-56 items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elev1 px-4 py-2 text-sm text-text-tertiary transition hover:border-border-strong hover:text-text-secondary md:inline-flex"
        >
          <Search className="h-4 w-4" />
          <span>Поиск по партии и игрокам</span>
          <span className="ml-auto font-mono text-[11px] text-text-tertiary/80">
            cmd+k
          </span>
        </button>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-bg-elev1 text-text-secondary transition hover:border-border-strong hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {isAuthenticated && user !== null ? (
          <Link
            to="/me"
            className="inline-flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-elev1 px-3 py-2 text-sm text-text-primary transition hover:border-gold"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/35 bg-gold/10 font-semibold text-gold">
              {user.nickname.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden md:inline">{user.nickname}</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-2xl border border-border-subtle px-4 py-2 text-sm text-text-primary transition hover:border-gold hover:text-gold"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  )
}
