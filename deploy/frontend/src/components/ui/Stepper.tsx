import { cn } from '@/lib/cn'

interface StepperProps {
  currentStep: number
  steps: string[]
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isPassed = index < currentStep

          return (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition',
                    isPassed && 'border-gold bg-gold text-black',
                    isActive && 'border-gold text-gold',
                    !isPassed &&
                      !isActive &&
                      'border-border-subtle bg-bg-base text-text-tertiary',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-sm transition',
                    isActive || isPassed
                      ? 'text-text-primary'
                      : 'text-text-tertiary',
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div className="h-px w-10 bg-border-subtle" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
