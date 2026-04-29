import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { PRIMARY_NAV_ITEMS, QUICK_CREATE } from '@/components/layout/navigation'
import { cn } from '@/lib/cn'

export function Sidebar() {
  const location = useLocation()
  const CreateIcon = QUICK_CREATE.icon

  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 flex-col border-r border-border-subtle bg-bg-base lg:flex">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon
          const isActive = item.match(location.pathname)

          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm text-text-secondary transition hover:border-border-subtle hover:bg-bg-elev1 hover:text-text-primary',
                isActive && 'border-gold/20 bg-gold/10 text-gold',
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-3 left-0 w-1 rounded-r-full bg-transparent transition',
                  isActive && 'bg-gold',
                )}
              />
              <ItemIcon className="h-4 w-4" />
              <span className={cn('font-medium', isActive && 'text-gold')}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 rgba(201, 164, 76, 0)',
              '0 0 28px rgba(201, 164, 76, 0.35)',
              '0 0 0 rgba(201, 164, 76, 0)',
            ],
          }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 8.8,
            ease: 'easeInOut',
          }}
          className="rounded-2xl"
        >
          <NavLink
            to={QUICK_CREATE.to}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-gold-hover"
          >
            <CreateIcon className="h-4 w-4" />
            {QUICK_CREATE.label}
          </NavLink>
        </motion.div>
      </div>
    </aside>
  )
}
