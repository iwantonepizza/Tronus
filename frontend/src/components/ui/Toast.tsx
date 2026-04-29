import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error'

interface ToastProps {
  message: string
  onClose?: () => void
  type: ToastType
  visible: boolean
}

export function Toast({ message, onClose, type, visible }: ToastProps) {
  if (!visible) {
    return null
  }

  const toneClass =
    type === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-100'
      : 'border-red-500/30 bg-red-500/12 text-red-100'

  const Icon = type === 'success' ? CheckCircle2 : CircleAlert

  return (
    <div className="fixed right-4 top-20 z-[90] w-[min(360px,calc(100vw-2rem))]">
      <div
        className={cn(
          'flex items-start gap-3 rounded-3xl border px-4 py-4 shadow-panel backdrop-blur',
          toneClass,
        )}
        role="status"
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm leading-6">{message}</p>
        {onClose ? (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-current/80 transition hover:bg-white/10 hover:text-current"
            onClick={onClose}
            aria-label="Закрыть уведомление"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
