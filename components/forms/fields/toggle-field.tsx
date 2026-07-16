'use client'

import React, { useId, ElementType } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { Tooltip } from '../primitives/form-tooltip'
import { cn } from '@/lib/helpers'

export interface ToggleOption {
  value: string | number
  label?: string
  icon?: ElementType
  hint?: string
}

export interface ToggleFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  options: ToggleOption[]
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  multiple?: boolean
  size?: 'sm' | 'md' | 'lg'
  name?: string
  onChange?: (e: { target: { name: string; value: (string | number)[] }; persist: () => void }) => void
}

export function ToggleField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  options = [],
  value,
  defaultValue = [],
  multiple = false,
  size = 'md',
  name = '',
  onChange,
}: ToggleFieldProps) {
  const generatedId = useId()
  const id = `${name || 'toggle'}-${generatedId}`

  const [internalVal, setInternalVal] = React.useState<(string | number)[]>(defaultValue)
  const currentVal = value !== undefined ? value : internalVal

  const handleToggle = (optVal: string | number) => {
    let newVal: (string | number)[]

    if (multiple) {
      if (currentVal.includes(optVal)) {
        newVal = currentVal.filter((v) => v !== optVal)
      } else {
        newVal = [...currentVal, optVal]
      }
    } else {
      newVal = currentVal.includes(optVal) ? [] : [optVal]
    }

    if (value === undefined) {
      setInternalVal(newVal)
    }

    if (onChange) {
      onChange({
        target: { name, value: newVal },
        persist: () => {},
      })
    }
  }

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 h-7',
    md: 'px-3.5 py-1.5 text-sm gap-2 h-9',
    lg: 'px-4.5 py-2 text-base gap-2.5 h-11',
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div
        id={id}
        role="group"
        className="inline-flex rounded-xl border-2 border-(--border-primary) bg-(--bg-card) p-1 w-fit max-w-full"
      >
        {options.map((opt) => {
          const isActive = currentVal.includes(opt.value)

          const buttonEl = (
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(opt.value)}
              className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all select-none cursor-pointer',
                sizeStyles[size],
                isActive
                  ? 'bg-(--accent-soft) text-(--accent) border-2 border-(--accent)/50'
                  : 'text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) border-2 border-transparent',
                disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent'
              )}
            >
              {opt.icon && React.createElement(opt.icon, { size: size === 'sm' ? 14 : size === 'lg' ? 18 : 16 })}
              {opt.label && <span>{opt.label}</span>}
            </button>
          )

          if (opt.hint) {
            return (
              <Tooltip key={opt.value} content={opt.hint} side="top">
                {buttonEl}
              </Tooltip>
            )
          }

          return <React.Fragment key={opt.value}>{buttonEl}</React.Fragment>
        })}
      </div>
    </FieldWrapper>
  )
}
