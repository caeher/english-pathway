'use client'

import React, { useId, ElementType } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'

export interface RadioOption {
  label: string
  value: string | number
}

export interface RadioGroupFieldProps {
  label?: string
  hint?: string
  error?: string
  options: RadioOption[]
  value?: string | number
  defaultValue?: string | number
  inline?: boolean
  disabled?: boolean
  name?: string
  icon?: ElementType
  onChange?: (e: { target: { name: string; value: string | number }; persist: () => void }) => void
}

export function RadioGroupField({
  label,
  hint,
  error,
  options = [],
  value,
  defaultValue,
  inline = false,
  disabled = false,
  name = '',
  icon: Icon,
  onChange,
}: RadioGroupFieldProps) {
  const generatedId = useId()
  const id = `${name || 'radiogroup'}-${generatedId}`

  const [internalVal, setInternalVal] = React.useState<string>(String(defaultValue ?? ''))
  const currentVal = value !== undefined ? String(value) : internalVal

  const handleValueChange = (optVal: string) => {
    if (value === undefined) {
      setInternalVal(optVal)
    }
    if (onChange) {
      onChange({
        target: { name, value: optVal },
        persist: () => {},
      })
    }
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
      <RadioGroup
        value={currentVal}
        onValueChange={handleValueChange}
        disabled={disabled}
        aria-labelledby={label ? `${id}-label` : undefined}
        className={cn(
          'flex gap-4 w-full',
          inline ? 'flex-row items-center flex-wrap' : 'flex-col'
        )}
      >
        {options.map((opt, idx) => {
          const optId = `${id}-${idx}`
          return (
            <div key={opt.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={String(opt.value)}
                id={optId}
                aria-invalid={error ? 'true' : 'false'}
              />
              <label
                htmlFor={optId}
                className={cn(
                  'flex items-center gap-2 text-sm text-(--text-primary) font-medium cursor-pointer select-none',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {Icon && <Icon size={16} className="text-(--text-muted)" />}
                <span>{opt.label}</span>
              </label>
            </div>
          )
        })}
      </RadioGroup>
      <input type="hidden" name={name} value={currentVal} />
    </FieldWrapper>
  )
}
