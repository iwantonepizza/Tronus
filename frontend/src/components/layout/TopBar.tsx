import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { BRAND_MARK } from '@/components/layout/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/cn'
import type { ApiNotification } from '@/api/types'

// Notification kind labels
const KIND_LABEL: Record<string, string> = {
  invite_received: 'Новое приглашение',
  invite_accepted: 'Приглашение принято',
  invite_declined: 'Приглашение отклонено',
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: ApiNotification
  onRead: (id: number) => void
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 transition',
        notification.is_read
          ? 'border-transparent bg-transparent'
          : 'border-gold/20 bg-gold/5',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {KIND_LABEL[notification.kind] ?? notification.kind}
        </p>
        <p className="mt-0.5 text-xs text-text-tertiary">
          {format(new Date(notification.created_at), 'dd.MM HH:mm')}
        </p>
      </div>
      {!notification.is_read && (
        <button
          type="button"
          onClick={() => onRead(notification.id)}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-bg-base text-text-tertiary transition hover:text-gold"
          aria-label="Отметить как прочитанное"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifQuery = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  const unreadCount = notifQuery.data?.unread_count ?? 0
  const notifications = notifQuery.data?.results ?? []

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-bg-elev1 text-text-secondary transition hover:border-border-strong hover:text-text-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-[1.5rem] border border-border-subtle bg-bg-elev1 shadow-panel">
          <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Уведомления
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition hover:text-text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto px-3 pb-3 space-y-1">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                Нет уведомлений
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface TopBarProps {
  onSearchOpen?: () => void
}

export function TopBar({ onSearchOpen }: TopBarProps) {
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
          <span className="font-brand text-lg tracking-[0.2em]">TRONUS</span>
        </Link>

        <button
          type="button"
          onClick={onSearchOpen}
          aria-label="Открыть поиск"
          className="ml-auto hidden min-w-56 items-center gap-2 rounded-2xl border border-border-subtle bg-bg-elev1 px-4 py-2 text-sm text-text-tertiary transition hover:border-border-strong hover:text-text-secondary md:inline-flex"
        >
          <Search className="h-4 w-4" />
          <span>Поиск по партиям и игрокам</span>
          <span className="ml-auto font-mono text-[11px] text-text-tertiary/80">
            cmd+k
          </span>
        </button>

        {isAuthenticated && <NotificationBell />}

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
