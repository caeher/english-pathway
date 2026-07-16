'use client'

import React, { useState } from 'react'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/helpers'

export interface CalendarGridProps {
  value: CalendarDate | null
  onChange: (date: CalendarDate) => void
  min?: CalendarDate | null
  max?: CalendarDate | null
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function CalendarGrid({ value, onChange, min, max }: CalendarGridProps) {
  const defaultDate = value || today(getLocalTimeZone())
  const [viewDate, setViewDate] = useState<CalendarDate>(defaultDate)

  const { year, month } = viewDate

  const nextMonth = () => setViewDate((prev) => prev.add({ months: 1 }))
  const prevMonth = () => setViewDate((prev) => prev.subtract({ months: 1 }))
  const nextYear = () => setViewDate((prev) => prev.add({ years: 1 }))
  const prevYear = () => setViewDate((prev) => prev.subtract({ years: 1 }))

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayIndex = new Date(year, month - 1, 1).getDay()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  const gridCells: { date: CalendarDate; isCurrentMonth: boolean }[] = []

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevMonthDate =
      month === 1
        ? new CalendarDate(year - 1, 12, daysInPrevMonth - i)
        : new CalendarDate(year, month - 1, daysInPrevMonth - i)
    gridCells.push({ date: prevMonthDate, isCurrentMonth: false })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({ date: new CalendarDate(year, month, i), isCurrentMonth: true })
  }

  const remainingCells = 42 - gridCells.length
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate =
      month === 12
        ? new CalendarDate(year + 1, 1, i)
        : new CalendarDate(year, month + 1, i)
    gridCells.push({ date: nextMonthDate, isCurrentMonth: false })
  }

  const isDateDisabled = (date: CalendarDate) => {
    if (min && date.compare(min) < 0) return true
    if (max && date.compare(max) > 0) return true
    return false
  }

  const isSelected = (date: CalendarDate) => {
    if (!value) return false
    return date.compare(value) === 0
  }

  const isToday = (date: CalendarDate) => {
    const t = today(getLocalTimeZone())
    return date.compare(t) === 0
  }

  return (
    <div className="w-[280px] p-2 bg-(--bg-card) text-(--text-primary) rounded-xl select-none border-2 border-(--border-primary)">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevYear}
            className="p-1 text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
            title="Previous year"
            aria-label="Previous year"
          >
            <span className="text-[10px] font-bold">&lt;&lt;</span>
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <span className="text-sm font-medium tracking-wide text-(--accent)">
          {MONTHS[month - 1]} {year}
        </span>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
            title="Siguiente mes"
            aria-label="Siguiente mes"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={nextYear}
            className="p-1 text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
            title="Next year"
            aria-label="Next year"
          >
            <span className="text-[10px] font-bold">&gt;&gt;</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS_SHORT.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid">
        {gridCells.map(({ date, isCurrentMonth }, idx) => {
          const disabled = isDateDisabled(date)
          const selected = isSelected(date)
          const todayItem = isToday(date)

          return (
            <button
              key={`${date.toString()}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(date)}
              className={cn(
                'h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-(--accent)/30',
                !isCurrentMonth && 'text-(--text-muted)',
                isCurrentMonth && !selected && !disabled && 'text-(--text-primary) hover:bg-(--bg-tertiary) hover:text-(--accent)',
                selected && 'bg-(--accent) text-white font-semibold',
                todayItem && !selected && 'border-2 border-(--accent)/50 text-(--accent)',
                disabled && 'opacity-25 cursor-not-allowed text-(--text-muted)'
              )}
              role="gridcell"
              aria-selected={selected}
              aria-disabled={disabled}
            >
              {date.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
