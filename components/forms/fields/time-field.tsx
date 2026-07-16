'use client'

import React, { useId, useState } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { parseTimeValue } from '../utils/parseTimeValue'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { getFieldTriggerClass } from '../utils/field-styles'

const timeActiveClass = 'bg-(--accent-soft) text-(--accent) font-bold'
const timeColClass = 'flex flex-col overflow-y-auto w-12 border-r border-(--border-primary) pr-1'

export interface TimeFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  use24Hour?: boolean
  showSeconds?: boolean
  minuteStep?: number
  value?: string
  defaultValue?: string
  name?: string
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export function TimeField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  use24Hour = true,
  showSeconds = false,
  minuteStep = 1,
  value,
  defaultValue = '',
  name = '',
  onChange,
}: TimeFieldProps) {
  const generatedId = useId()
  const id = `${name || 'time'}-${generatedId}`

  const defaultTime = React.useMemo(
    () => parseTimeValue(defaultValue) || { hours: 0, minutes: 0, seconds: 0 },
    [defaultValue]
  )
  const [internalTime, setInternalTime] = useState(defaultTime)

  const currentTime = React.useMemo(() => {
    if (value !== undefined) {
      return parseTimeValue(value) || { hours: 0, minutes: 0, seconds: 0 }
    }
    return internalTime
  }, [value, internalTime])

  const triggerChange = (hours: number, minutes: number, seconds: number) => {
    const formattedHours = String(hours).padStart(2, '0')
    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(seconds).padStart(2, '0')

    const timeString = showSeconds
      ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      : `${formattedHours}:${formattedMinutes}`

    if (value === undefined) {
      setInternalTime({ hours, minutes, seconds })
    }

    if (onChange) {
      onChange({
        target: { name, value: timeString },
        persist: () => {},
      })
    }
  }

  const displayTime = () => {
    const { hours, minutes, seconds } = currentTime
    if (use24Hour) {
      const hStr = String(hours).padStart(2, '0')
      const mStr = String(minutes).padStart(2, '0')
      const sStr = String(seconds).padStart(2, '0')
      return showSeconds ? `${hStr}:${mStr}:${sStr}` : `${hStr}:${mStr}`
    }
    const isPm = hours >= 12
    const h12 = hours % 12 === 0 ? 12 : hours % 12
    const hStr = String(h12).padStart(2, '0')
    const mStr = String(minutes).padStart(2, '0')
    const sStr = String(seconds).padStart(2, '0')
    const ampm = isPm ? 'PM' : 'AM'
    return showSeconds ? `${hStr}:${mStr}:${sStr} ${ampm}` : `${hStr}:${mStr} ${ampm}`
  }

  const hoursList = Array.from({ length: use24Hour ? 24 : 12 }, (_, i) => (use24Hour ? i : i + 1))

  const minutesList: number[] = []
  for (let i = 0; i < 60; i += minuteStep) {
    minutesList.push(i)
  }

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
        <input type="hidden" name={name} value={displayTime()} />

        <Popover
          disabled={disabled}
          matchTriggerWidth={false}
          align="start"
          trigger={
            <button type="button" className={getFieldTriggerClass(error)}>
              <span className="font-mono text-(--text-primary)">{displayTime()}</span>
              <Clock size={16} className="text-(--text-muted)" />
            </button>
          }
          content={() => (
            <div className="flex gap-1 h-44 bg-(--bg-card) p-2 text-(--text-primary) rounded-xl select-none border-2 border-(--border-primary)">
              <div className={timeColClass}>
                <span className="text-[9px] font-bold text-(--text-muted) uppercase text-center mb-1">Hrs</span>
                {hoursList.map((h) => {
                  let active = false
                  if (use24Hour) {
                    active = currentTime.hours === h
                  } else {
                    const curH12 = currentTime.hours % 12 === 0 ? 12 : currentTime.hours % 12
                    active = curH12 === h
                  }

                  const handleHourSelect = () => {
                    let nextH = h
                    if (!use24Hour) {
                      const isPm = currentTime.hours >= 12
                      if (isPm && h < 12) nextH = h + 12
                      else if (!isPm && h === 12) nextH = 0
                    }
                    triggerChange(nextH, currentTime.minutes, currentTime.seconds)
                  }

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={handleHourSelect}
                      className={cn(
                        'py-1 text-xs rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                        active && timeActiveClass
                      )}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>

              <div className={cn(timeColClass, 'px-1')}>
                <span className="text-[9px] font-bold text-(--text-muted) uppercase text-center mb-1">Min</span>
                {minutesList.map((m) => {
                  const active = currentTime.minutes === m
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => triggerChange(currentTime.hours, m, currentTime.seconds)}
                      className={cn(
                        'py-1 text-xs rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                        active && timeActiveClass
                      )}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>

              {showSeconds && (
                <div className={cn(timeColClass, 'px-1')}>
                  <span className="text-[9px] font-bold text-(--text-muted) uppercase text-center mb-1">Seg</span>
                  {secondsList.map((s) => {
                    const active = currentTime.seconds === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => triggerChange(currentTime.hours, currentTime.minutes, s)}
                        className={cn(
                          'py-1 text-xs rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
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
                <div className="flex flex-col w-12 pl-1 justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTime.hours >= 12) {
                        triggerChange(currentTime.hours - 12, currentTime.minutes, currentTime.seconds)
                      }
                    }}
                    className={cn(
                      'py-1 text-[10px] font-bold rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                      currentTime.hours < 12 && timeActiveClass
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTime.hours < 12) {
                        triggerChange(currentTime.hours + 12, currentTime.minutes, currentTime.seconds)
                      }
                    }}
                    className={cn(
                      'py-1 text-[10px] font-bold rounded-lg hover:bg-(--bg-tertiary) transition-colors font-mono',
                      currentTime.hours >= 12 && timeActiveClass
                    )}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>
          )}
        />
      </div>
    </FieldWrapper>
  )
}
