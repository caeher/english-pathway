'use client'

import React, { useId, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'

export interface ProgressFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  variant?: 'default' | 'gradient' | 'striped'
  color?: 'cyan' | 'accent' | 'green' | 'amber' | 'red'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  name?: string
  onChange?: (e: { target: { name: string; value: number }; persist: () => void }) => void
}

export function ProgressField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  variant = 'default',
  color = 'accent',
  size = 'md',
  showValue = true,
  interactive = false,
  name = '',
  onChange,
}: ProgressFieldProps) {
  const generatedId = useId()
  const id = `${name || 'progress'}-${generatedId}`

  const [internalVal, setInternalVal] = useState<number>(defaultValue)
  const currentVal = value !== undefined ? value : internalVal

  const percent = Math.min(Math.max(((currentVal - min) / (max - min)) * 100, 0), 100)

  const normalizedColor = color === 'cyan' ? 'accent' : color

  const handleSliderChange = (vals: number[]) => {
    const val = vals[0]
    if (value === undefined) {
      setInternalVal(val)
    }
    if (onChange) {
      onChange({
        target: { name, value: val },
        persist: () => {},
      })
    }
  }

  const colorClasses = {
    accent: {
      bar: 'bg-(--accent)',
      gradient: 'bg-gradient-to-r from-(--accent-muted) to-(--accent)',
      striped:
        'bg-(--accent) [background-image:linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem]',
      text: 'text-(--accent)',
    },
    green: {
      bar: 'bg-(--success)',
      gradient: 'bg-gradient-to-r from-(--success-soft) to-(--success)',
      striped:
        'bg-(--success) [background-image:linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem]',
      text: 'text-(--success)',
    },
    amber: {
      bar: 'bg-(--reward)',
      gradient: 'bg-gradient-to-r from-(--reward-soft) to-(--reward)',
      striped:
        'bg-(--reward) [background-image:linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem]',
      text: 'text-(--reward)',
    },
    red: {
      bar: 'bg-red-500',
      gradient: 'bg-gradient-to-r from-red-900 to-red-400',
      striped:
        'bg-red-500 [background-image:linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem]',
      text: 'text-red-500',
    },
  } as const

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  }

  const palette = colorClasses[normalizedColor as keyof typeof colorClasses] || colorClasses.accent

  const activeBarClass =
    variant === 'striped'
      ? palette.striped
      : variant === 'gradient'
        ? palette.gradient
        : palette.bar

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="flex flex-col gap-1 w-full">
        {showValue && !inline && (
          <div className="flex justify-end text-[10px] font-bold font-mono tracking-wider text-(--text-muted)">
            <span className={palette.text}>{currentVal}</span> / {max}
          </div>
        )}

        <div className="relative flex items-center w-full gap-3">
          {!interactive ? (
            <div
              className={cn(
                'w-full bg-(--bg-tertiary) border-2 border-(--border-primary) rounded-full overflow-hidden flex',
                heightClasses[size],
                disabled && 'opacity-50'
              )}
              role="progressbar"
              aria-valuenow={currentVal}
              aria-valuemin={min}
              aria-valuemax={max}
            >
              <div
                className={cn('h-full rounded-full transition-all duration-300 ease-out', activeBarClass)}
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : (
            <Slider
              id={id}
              min={min}
              max={max}
              step={step}
              value={[currentVal]}
              disabled={disabled}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
          )}

          {showValue && inline && (
            <div className="text-xs font-bold font-mono tracking-wider text-(--text-muted) flex-shrink-0">
              <span className={palette.text}>{currentVal}</span>
            </div>
          )}
        </div>
      </div>
    </FieldWrapper>
  )
}
