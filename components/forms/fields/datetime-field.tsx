'use client'

import React, { useId, useState } from 'react'
import { CalendarDate } from '@internationalized/date'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { CalendarGrid } from '../utils/calendar-grid'
import { parseDateValue } from '../utils/parseDateValue'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { getFieldTriggerClass } from '../utils/field-styles'

const timeActiveClass = 'bg-(--accent-soft) text-(--accent) font-bold'

export interface DatetimeFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  use24Hour?: boolean
  showSeconds?: boolean
  min?: string | CalendarDate
  max?: string | CalendarDate
  value?: string
  defaultValue?: string
  name?: string
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export function DatetimeField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  use24Hour = true,
  showSeconds = false,
  min,
  max,
  value,
  defaultValue = '',
  name = '',
  onChange,
}: DatetimeFieldProps) {
  const generatedId = useId()
  const id = `${name || 'datetime'}-${generatedId}`

  const minDate = React.useMemo(() => parseDateValue(min), [min])
  const maxDate = React.useMemo(() => parseDateValue(max), [max])

  const extractDateTime = (valStr: string) => {
    const dt = valStr ? new Date(valStr) : new Date()
    const valid = valStr ? !isNaN(dt.getTime()) : false

    const dateVal = valid
      ? new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
      : null

    const timeVal = valid
      ? { hours: dt.getHours(), minutes: dt.getMinutes(), seconds: dt.getSeconds() }
      : { hours: 0, minutes: 0, seconds: 0 }

    return { date: dateVal, time: timeVal }
  }

  const initialVal = React.useMemo(() => extractDateTime(defaultValue), [defaultValue])

  const [internalDate, setInternalDate] = useState<CalendarDate | null>(initialVal.date)
  const [internalTime, setInternalTime] = useState(initialVal.time)

  const controlledParsed = value !== undefined ? extractDateTime(value) : null
  const selectedDate = controlledParsed?.date ?? internalDate
  const selectedTime = controlledParsed?.time ?? internalTime

  const triggerChange = (
    date: CalendarDate | null,
    time: { hours: number; minutes: number; seconds: number }
  ) => {
    if (!date) return

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${date.year}-${pad(date.month)}-${pad(date.day)}`
    const timeStr = showSeconds
      ? `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`
      : `${pad(time.hours)}:${pad(time.minutes)}`

    const isoStr = `${dateStr}T${timeStr}`

    if (value === undefined) {
      setInternalDate(date)
      setInternalTime(time)
    }

    if (onChange) {
      onChange({
        target: { name, value: isoStr },
        persist: () => {},
      })
    }
  }

  const displayString = () => {
    if (!selectedDate) return 'Select date and time...'

    const pad = (n: number) => String(n).padStart(2, '0')
    const datePart = `${pad(selectedDate.day)}/${pad(selectedDate.month)}/${selectedDate.year}`

    const { hours, minutes, seconds } = selectedTime

    if (use24Hour) {
      const timePart = showSeconds
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}`
      return `${datePart} ${timePart}`
    }

    const isPm = hours >= 12
    const h12 = hours % 12 === 0 ? 12 : hours % 12
    const timePart = showSeconds
      ? `${pad(h12)}:${pad(minutes)}:${pad(seconds)} ${isPm ? 'PM' : 'AM'}`
      : `${pad(h12)}:${pad(minutes)} ${isPm ? 'PM' : 'AM'}`

    return `${datePart} ${timePart}`
  }

  const handleDateChange = (date: CalendarDate) => {
    triggerChange(date, selectedTime)
  }

  const handleTimeSelect = (h: number, m: number, s: number) => {
    triggerChange(selectedDate, { hours: h, minutes: m, seconds: s })
  }

  const hoursList = Array.from({ length: use24Hour ? 24 : 12 }, (_, i) => (use24Hour ? i : i + 1))
  const minutesList = Array.from({ length: 60 }, (_, i) => i)
  const secondsList = Array.from({ length: 60 }, (_, i) => i)

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
          type="hidden"
          name={name}
          value={
            selectedDate
              ? `${selectedDate.toString()}T${String(selectedTime.hours).padStart(2, '0')}:${String(selectedTime.minutes).padStart(2, '0')}`
              : ''
          }
        />

        <Popover
          disabled={disabled}
          matchTriggerWidth={false}
          align="start"
          trigger={
            <button type="button" className={getFieldTriggerClass(error)}>
              <span
                className={cn(
                  selectedDate ? 'text-(--text-primary) font-mono text-xs' : 'text-(--text-muted)'
                )}
              >
                {displayString()}
              </span>
              <div className="flex items-center gap-1.5 text-(--text-muted)">
                <CalendarIcon size={14} />
                <span className="text-(--border-secondary)">|</span>
                <Clock size={14} />
              </div>
            </button>
          }
          content={() => (
            <div className="flex flex-col gap-3 p-1 max-w-[300px]">
              <CalendarGrid
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDate}
              />

              <div className="flex justify-center gap-1.5 h-32 bg-(--bg-card) p-2 text-(--text-primary) border-2 border-(--border-primary) rounded-xl select-none">
                <div className="flex flex-col overflow-y-auto w-12 border-r border-(--border-primary) pr-1 text-center">
                  <span className="text-[8px] font-bold text-(--text-muted) uppercase tracking-wider mb-1">Hrs</span>
                  {hoursList.map((h) => {
                    let active = false
                    if (use24Hour) {
                      active = selectedTime.hours === h
                    } else {
                      const curH12 = selectedTime.hours % 12 === 0 ? 12 : selectedTime.hours % 12
                      active = curH12 === h
                    }

                    const handleHourClick = () => {
                      let nextH = h
                      if (!use24Hour) {
                        const isPm = selectedTime.hours >= 12
                        if (isPm && h < 12) nextH = h + 12
                        else if (!isPm && h === 12) nextH = 0
                      }
                      handleTimeSelect(nextH, selectedTime.minutes, selectedTime.seconds)
                    }

                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={handleHourClick}
                        className={cn(
                          'py-0.5 text-[10px] rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                          active && timeActiveClass
                        )}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-col overflow-y-auto w-12 border-r border-(--border-primary) px-1 text-center">
                  <span className="text-[8px] font-bold text-(--text-muted) uppercase tracking-wider mb-1">Min</span>
                  {minutesList.map((m) => {
                    const active = selectedTime.minutes === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeSelect(selectedTime.hours, m, selectedTime.seconds)}
                        className={cn(
                          'py-0.5 text-[10px] rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                          active && timeActiveClass
                        )}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>

                {showSeconds && (
                  <div className="flex flex-col overflow-y-auto w-12 border-r border-(--border-primary) px-1 text-center">
                    <span className="text-[8px] font-bold text-(--text-muted) uppercase tracking-wider mb-1">Seg</span>
                    {secondsList.map((s) => {
                      const active = selectedTime.seconds === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleTimeSelect(selectedTime.hours, selectedTime.minutes, s)}
                          className={cn(
                            'py-0.5 text-[10px] rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                            active && timeActiveClass
                          )}
                        >
                          {String(s).padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                )}

                {!use24Hour && (
                  <div className="flex flex-col w-12 pl-1 justify-center gap-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTime.hours >= 12) {
                          handleTimeSelect(
                            selectedTime.hours - 12,
                            selectedTime.minutes,
                            selectedTime.seconds
                          )
                        }
                      }}
                      className={cn(
                        'py-1 text-[8px] font-bold rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                        selectedTime.hours < 12 && timeActiveClass
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTime.hours < 12) {
                          handleTimeSelect(
                            selectedTime.hours + 12,
                            selectedTime.minutes,
                            selectedTime.seconds
                          )
                        }
                      }}
                      className={cn(
                        'py-1 text-[8px] font-bold rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                        selectedTime.hours >= 12 && timeActiveClass
                      )}
                    >
                      PM
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>
    </FieldWrapper>
  )
}
