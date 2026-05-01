import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, hint, id, label, type, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = type === 'password'
  const resolvedType = isPasswordField
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : type

  return (
    <div className="block space-y-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={cn(
            'w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold',
            isPasswordField && 'pr-12',
            error && 'border-red-500/50 focus:border-red-400',
            className,
          )}
          {...props}
        />
        {isPasswordField ? (
          <button
            type="button"
            aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-tertiary transition hover:bg-bg-elev1 hover:text-text-primary"
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!error && hint ? (
        <p className="text-sm text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  )
})
