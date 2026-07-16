'use client'

import React, { forwardRef, useId, ComponentPropsWithRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'
import { fieldErrorClass, fieldFocusClass } from '../utils/field-styles'

export interface TextareaFieldProps extends Omit<ComponentPropsWithRef<'textarea'>, 'onChange'> {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  rows?: number
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  rows = 4,
  className,
  id: customId,
  name = '',
  onChange,
  ...props
}, ref) => {
  const generatedId = useId()
  const id = customId || generatedId

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange({
        target: {
          name: e.target.name || name,
          value: e.target.value,
        },
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
      <Textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(fieldFocusClass, error && fieldErrorClass, className)}
        {...props}
      />
    </FieldWrapper>
  )
})

TextareaField.displayName = 'TextareaField'
