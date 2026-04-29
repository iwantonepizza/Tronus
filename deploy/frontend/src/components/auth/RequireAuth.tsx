import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth() {
  const location = useLocation()
  const { isBootstrapping, user } = useAuth()

  if (isBootstrapping) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-elev1 px-6 py-4 text-sm text-text-secondary">
          Проверяем сессию…
        </div>
      </main>
    )
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
