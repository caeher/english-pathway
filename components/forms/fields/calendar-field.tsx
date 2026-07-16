'use client'

import React, { useId } from 'react'
import { CalendarDate } from '@internationalized/date'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { CalendarGrid } from '../utils/calendar-grid'
import { parseDateValue } from '../utils/parseDateValue'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { getFieldTriggerClass } from '../utils/field-styles'

export interface CalendarFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  value?: string | CalendarDate
  defaultValue?: string | CalendarDate
  min?: string | CalendarDate
  max?: string | CalendarDate
  name?: string
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export function CalendarField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  value,
  defaultValue,
  min,
  max,
  name = '',
  onChange,
}: CalendarFieldProps) {
  const generatedId = useId()
  const id = `${name || 'calendar'}-${generatedId}`

  const minDate = React.useMemo(() => parseDateValue(min), [min])
  const maxDate = React.useMemo(() => parseDateValue(max), [max])

  const initialDate = React.useMemo(() => parseDateValue(defaultValue), [defaultValue])
  const [internalDate, setInternalDate] = React.useState<CalendarDate | null>(initialDate)

  const currentDate = React.useMemo(() => {
    if (value !== undefined) {
      return parseDateValue(value)
    }
    return internalDate
  }, [value, internalDate])

  const handleSelectDate = (date: CalendarDate, close: () => void) => {
    const isoString = date.toString()

    if (value === undefined) {
      setInternalDate(date)
    }

    if (onChange) {
      onChange({
        target: { name, value: isoString },
        persist: () => {},
      })
    }
    close()
  }

  const triggerLabel = currentDate
    ? `${String(currentDate.day).padStart(2, '0')}/${String(currentDate.month).padStart(2, '0')}/${currentDate.year}`
    : 'Select date...'

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="relative w-full">
        <input
          id={id}
          type="hidden"
          name={name}
          value={currentDate ? currentDate.toString() : ''}
          disabled={disabled}
        />

        <Popover
          disabled={disabled}
          matchTriggerWidth={false}
          align="start"
          trigger={
            <button type="button" className={getFieldTriggerClass(error)}>
              <span className={cn(currentDate ? 'text-(--text-primary)' : 'text-(--text-muted)')}>
                {triggerLabel}
              </span>
              <CalendarIcon size={16} className="text-(--text-muted)" />
            </button>
          }
          content={(close) => (
            <CalendarGrid
              value={currentDate}
              onChange={(date) => handleSelectDate(date, close)}
              min={minDate}
              max={maxDate}
            />
          )}
        />
      </div>
    </FieldWrapper>
  )
}
