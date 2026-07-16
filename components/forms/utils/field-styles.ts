import { cn } from '@/lib/helpers'

export const fieldControlClass =
  'h-11 w-full rounded-xl border-2 border-(--border-primary) bg-(--bg-card) px-4 py-2 font-display text-sm text-(--text-primary) placeholder:text-(--text-muted) transition-colors outline-none'

export const fieldFocusClass =
  'focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20'

export const fieldErrorClass =
  'border-red-500 focus:border-red-500 focus:ring-red-500/20'

export const fieldLabelClass =
  'font-display font-semibold text-sm text-(--text-primary) select-none transition-colors group-focus-within/field:text-(--accent)'

export const fieldLabelErrorClass = 'text-red-500 group-focus-within/field:text-red-500'

export const fieldHintClass = 'text-xs text-(--text-muted) font-normal'

export const fieldErrorTextClass =
  'text-xs font-medium text-red-500 animate-in fade-in-50 slide-in-from-top-1'

export const fieldTriggerClass = cn(
  fieldControlClass,
  fieldFocusClass,
  'flex items-center justify-between text-left cursor-pointer'
)

export const fieldOptionSelectedClass =
  'bg-(--accent-soft) text-(--accent) font-medium'

export const fieldOptionClass =
  'text-(--text-primary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)'

export const fieldIconClass =
  'text-(--text-muted) group-focus-within/input:text-(--accent) transition-colors'

export function getFieldControlClass(error?: string, className?: string) {
  return cn(
    fieldControlClass,
    fieldFocusClass,
    error && fieldErrorClass,
    className
  )
}

export function getFieldTriggerClass(error?: string, className?: string) {
  return cn(
    fieldTriggerClass,
    error && fieldErrorClass,
    className
  )
}
