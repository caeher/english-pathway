'use client'

import React, { useId, useState, useRef } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { parseColor, formatColor, hsvToRgb, ColorState } from '../utils/colorConversions'
import { cn } from '@/lib/helpers'
import { getFieldTriggerClass } from '../utils/field-styles'

export interface ColorPickerFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  format?: 'hex' | 'rgb' | 'hsl' | 'hex-alpha' | 'rgb-alpha' | 'hsl-alpha'
  presets?: string[]
  showInput?: boolean
  value?: string
  defaultValue?: string
  name?: string
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

const DEFAULT_PRESETS = [
  '#e85d3a', '#1a9e8f', '#e5a411', '#ef4444',
  '#ec4899', '#8b5cf6', '#3b82f6', '#64748b',
]

export function ColorPickerField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  format = 'hex',
  presets = DEFAULT_PRESETS,
  value,
  defaultValue = '#e85d3a',
  name = '',
  onChange,
}: ColorPickerFieldProps) {
  const generatedId = useId()
  const id = `${name || 'color'}-${generatedId}`

  const initialColor = React.useMemo(() => parseColor(defaultValue), [defaultValue])
  const [internalColor, setInternalColor] = useState<ColorState>(initialColor)

  const currentColor = React.useMemo(() => {
    if (value !== undefined) {
      return parseColor(value)
    }
    return internalColor
  }, [value, internalColor])

  const triggerChange = (newColor: ColorState) => {
    const formatted = formatColor(newColor, format)
    if (value === undefined) {
      setInternalColor(newColor)
    }
    if (onChange) {
      onChange({
        target: { name, value: formatted },
        persist: () => {},
      })
    }
  }

  const svRef = useRef<HTMLDivElement>(null)

  const updateSVFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

    const s = Math.round((x / rect.width) * 100)
    const v = Math.round((1 - y / rect.height) * 100)

    const rgb = hsvToRgb(currentColor.h, s, v)
    triggerChange({
      ...currentColor,
      ...rgb,
      s,
      v,
    })
  }

  const handleSVPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    updateSVFromPointer(e)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateSVFromPointer(moveEvent)
    }
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const hueRef = useRef<HTMLDivElement>(null)

  const updateHueFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const h = Math.round((x / rect.width) * 360)

    const rgb = hsvToRgb(h, currentColor.s, currentColor.v)
    triggerChange({
      ...currentColor,
      ...rgb,
      h: h === 360 ? 0 : h,
    })
  }

  const handleHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    updateHueFromPointer(e)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateHueFromPointer(moveEvent)
    }
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const alphaRef = useRef<HTMLDivElement>(null)

  const updateAlphaFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!alphaRef.current) return
    const rect = alphaRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const a = parseFloat((x / rect.width).toFixed(2))

    triggerChange({
      ...currentColor,
      a,
    })
  }

  const handleAlphaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    updateAlphaFromPointer(e)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateAlphaFromPointer(moveEvent)
    }
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handlePresetSelect = (presetStr: string) => {
    triggerChange(parseColor(presetStr))
  }

  const hueBaseRgb = hsvToRgb(currentColor.h, 100, 100)
  const hueBaseHex = `rgb(${hueBaseRgb.r}, ${hueBaseRgb.g}, ${hueBaseRgb.b})`

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="relative w-full flex gap-2">
        <input type="hidden" name={name} value={formatColor(currentColor, format)} />

        <Popover
          disabled={disabled}
          matchTriggerWidth={false}
          align="start"
          trigger={
            <button
              type="button"
              className={cn(getFieldTriggerClass(error), 'flex-1 justify-start')}
            >
              <div
                className="w-5 h-5 rounded-lg border-2 border-(--border-primary) flex-shrink-0"
                style={{ backgroundColor: formatColor(currentColor, 'rgb-alpha') }}
              />
              <span className="font-mono text-xs uppercase text-(--text-primary)">
                {formatColor(currentColor, format)}
              </span>
            </button>
          }
          content={() => (
            <div className="flex flex-col gap-3 p-1 w-[220px]">
              <div
                ref={svRef}
                onPointerDown={handleSVPointerDown}
                className="relative h-28 w-full rounded-xl border-2 border-(--border-primary) overflow-hidden cursor-crosshair select-none"
                style={{ backgroundColor: hueBaseHex }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                <div
                  className="absolute w-3 h-3 -translate-x-1.5 -translate-y-1.5 border-2 border-white rounded-full shadow-md pointer-events-none"
                  style={{
                    left: `${currentColor.s}%`,
                    top: `${100 - currentColor.v}%`,
                    backgroundColor: formatColor(currentColor, 'rgb'),
                  }}
                />
              </div>

              <div className="flex flex-col gap-1 select-none">
                <span className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">Hue</span>
                <div
                  ref={hueRef}
                  onPointerDown={handleHuePointerDown}
                  className="relative h-3 w-full rounded-lg border-2 border-(--border-primary) cursor-ew-resize [background-image:linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
                >
                  <div
                    className="absolute w-2 h-3.5 -translate-x-1 -translate-y-0.5 bg-white border border-(--border-primary) rounded shadow-sm pointer-events-none"
                    style={{ left: `${(currentColor.h / 360) * 100}%` }}
                  />
                </div>
              </div>

              {format.includes('alpha') && (
                <div className="flex flex-col gap-1 select-none">
                  <span className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">
                    Opacity ({Math.round(currentColor.a * 100)}%)
                  </span>
                  <div
                    ref={alphaRef}
                    onPointerDown={handleAlphaPointerDown}
                    className="relative h-3 w-full rounded-lg border-2 border-(--border-primary) cursor-ew-resize bg-(--bg-tertiary)"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b}))`,
                    }}
                  >
                    <div
                      className="absolute w-2 h-3.5 -translate-x-1 -translate-y-0.5 bg-white border border-(--border-primary) rounded shadow-sm pointer-events-none"
                      style={{ left: `${currentColor.a * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">Presets</span>
                <div className="grid grid-cols-8 gap-1.5">
                  {presets.map((preset) => {
                    const active =
                      formatColor(parseColor(preset), 'hex') === formatColor(currentColor, 'hex')
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={cn(
                          'w-5 h-5 rounded-lg cursor-pointer border-2 border-(--border-primary) hover:scale-110 transition-transform',
                          active && 'ring-2 ring-(--accent)'
                        )}
                        style={{ backgroundColor: preset }}
                        title={preset}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </FieldWrapper>
  )
}
