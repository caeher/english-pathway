'use client'

import React, { useId } from 'react'
import { Switch } from '@/components/ui/switch'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'

export interface SwitchFieldProps {
  label?: string
  hint?: string
  error?: string
  checked?: boolean
  defaultChecked?: boolean
  inline?: boolean
  disabled?: boolean
  name?: string
  onChange?: (e: { target: { name: string; value: boolean }; persist: () => void }) => void
}

export function SwitchField({
  label,
  hint,
  error,
  checked,
  defaultChecked,
  inline = false,
  disabled = false,
  name = '',
  onChange,
}: SwitchFieldProps) {
  const generatedId = useId()
  const id = `${name || 'switch'}-${generatedId}`

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
      <div
        className={cn(
          'flex items-center justify-between w-full',
          !inline && 'p-3 rounded-xl border-2 border-(--border-primary) bg-(--bg-card)'
        )}
      >
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-(--text-primary) select-none cursor-pointer"
          >
            {label}
          </label>
        )}

        <Switch
          id={id}
          name={name}
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={handleCheckedChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
      </div>
    </FieldWrapper>
  )
}
