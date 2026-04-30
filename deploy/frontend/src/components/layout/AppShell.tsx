import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function AppShell() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary">
      <TopBar />
      <div className="mx-auto flex max-w-[1600px]">
        {isDesktop ? <Sidebar /> : null}
        <main className="min-h-[calc(100dvh-4rem)] flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:px-6 lg:px-10 lg:pb-10">
          <Outlet />
        </main>
      </div>
      {isMobile ? <BottomNav /> : null}
    </div>
  )
}
