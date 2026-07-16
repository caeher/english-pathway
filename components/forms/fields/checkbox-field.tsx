'use client'

import React, { useId, ElementType } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'

export interface CheckboxFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  checked?: boolean
  defaultChecked?: boolean
  name?: string
  icon?: ElementType
  iconPosition?: 'left' | 'right'
  onChange?: (e: { target: { name: string; value: boolean }; persist: () => void }) => void
}

export function CheckboxField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  checked,
  defaultChecked,
  name = '',
  icon: Icon,
  iconPosition = 'left',
  onChange,
}: CheckboxFieldProps) {
  const generatedId = useId()
  const id = `${name || 'checkbox'}-${generatedId}`

  const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked ?? false)
  const isChecked = checked !== undefined ? checked : internalChecked

  const handleCheckedChange = (nextVal: boolean) => {
    if (checked === undefined) {
      setInternalChecked(nextVal)
    }
    if (onChange) {
      onChange({
        target: { name, value: nextVal },
        persist: () => {},
      })
    }
  }

  return (
    <FieldWrapper
      id={id}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-start gap-3 cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <Checkbox
          id={id}
          name={name}
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={handleCheckedChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn('mt-0.5', error && 'border-red-500')}
        />

        {(label || Icon) && (
          <div className="flex items-center gap-2 text-sm text-(--text-primary) font-medium leading-tight">
            {Icon && iconPosition === 'left' && <Icon size={16} className="text-(--text-muted)" />}
            {label && <span>{label}</span>}
            {Icon && iconPosition === 'right' && <Icon size={16} className="text-(--text-muted)" />}
          </div>
        )}
      </label>
    </FieldWrapper>
  )
}
