import { NavLink, useLocation } from 'react-router-dom'
import { MOBILE_NAV_ITEMS } from '@/components/layout/navigation'
import { cn } from '@/lib/cn'

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border-subtle bg-bg-base/95 px-2 backdrop-blur-xl md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const ItemIcon = item.icon
        const isActive = item.match(location.pathname)
        const isFab = item.id === 'create'

        return (
          <NavLink
            key={item.id}
            to={item.to}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-text-tertiary transition',
              isActive && 'text-gold',
              isFab &&
                'mx-1 -translate-y-3 rounded-full bg-gold p-3 text-black shadow-[0_10px_30px_rgba(201,164,76,0.42)]',
            )}
          >
            <ItemIcon className={cn('h-4 w-4', isFab && 'h-5 w-5')} />
            <span className={cn(isFab && 'sr-only')}>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
