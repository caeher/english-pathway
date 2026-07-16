'use client'

import React, { useId, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from '../utils/field-wrapper'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { fieldErrorClass } from '../utils/field-styles'

export interface NumberFieldProps {
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
  name?: string
  onChange?: (e: { target: { name: string; value: number }; persist: () => void }) => void
}

export function NumberField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  name = '',
  onChange,
}: NumberFieldProps) {
  const generatedId = useId()
  const id = `${name || 'number'}-${generatedId}`

  const [internalVal, setInternalVal] = useState<number>(defaultValue)
  const currentVal = value !== undefined ? value : internalVal

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleUpdate = (direction: 'increment' | 'decrement') => {
    let nextVal = direction === 'increment' ? currentVal + step : currentVal - step

    if (min !== undefined && nextVal < min) nextVal = min
    if (max !== undefined && nextVal > max) nextVal = max

    const decimalPlaces = (step.toString().split('.')[1] || '').length
    nextVal = parseFloat(nextVal.toFixed(decimalPlaces))

    if (value === undefined) {
      setInternalVal(nextVal)
    }

    if (onChange) {
      onChange({
        target: { name, value: nextVal },
        persist: () => {},
      })
    }
  }

  const startContinuousChange = (direction: 'increment' | 'decrement') => {
    if (disabled) return
    handleUpdate(direction)

    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        handleUpdate(direction)
      }, 80)
    }, 400)
  }

  const stopContinuousChange = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    return () => {
      stopContinuousChange()
    }
  }, [])

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="flex w-full items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || (min !== undefined && currentVal <= min)}
          onPointerDown={() => startContinuousChange('decrement')}
          onPointerUp={stopContinuousChange}
          onPointerLeave={stopContinuousChange}
          className="rounded-r-none h-11 border-r-0"
          title="Decrease"
          aria-label="Decrease"
        >
          <Minus size={14} />
        </Button>

        <input
          id={id}
          type="text"
          name={name}
          value={currentVal}
          readOnly
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            'h-11 w-full bg-(--bg-card) text-center font-mono text-(--text-primary) border-y-2 border-(--border-primary) text-sm outline-none',
            error && fieldErrorClass,
            disabled && 'opacity-50'
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || (max !== undefined && currentVal >= max)}
          onPointerDown={() => startContinuousChange('increment')}
          onPointerUp={stopContinuousChange}
          onPointerLeave={stopContinuousChange}
          className="rounded-l-none h-11 border-l-0"
          title="Increase"
          aria-label="Increase"
        >
          <Plus size={14} />
        </Button>
      </div>
    </FieldWrapper>
  )
}
