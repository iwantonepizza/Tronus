import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-black hover:bg-gold-hover',
  secondary:
    'border border-border-subtle bg-bg-elev1 text-text-primary hover:border-gold hover:text-gold',
  ghost: 'text-text-secondary hover:bg-bg-elev1 hover:text-text-primary',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconLeft?: ReactNode
  iconRight?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  children,
  className,
  iconLeft,
  iconRight,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
        variantClassNames[variant],
        sizeClassNames[size],
        className,
      )}
      {...props}
    >
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </button>
  )
}
