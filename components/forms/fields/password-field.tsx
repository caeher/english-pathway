'use client'

import React, { forwardRef, useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'
import { fieldIconClass, getFieldControlClass } from '../utils/field-styles'
import { Eye, EyeOff, Lock } from 'lucide-react'

export interface PasswordFieldProps extends Omit<React.ComponentPropsWithRef<'input'>, 'onChange'> {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  className,
  id: customId,
  name = '',
  onChange,
  ...props
}, ref) => {
  const generatedId = useId()
  const id = customId || generatedId
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="relative w-full group/input">
        <div className={cn('absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none', fieldIconClass)}>
          <Lock size={16} />
        </div>

        <Input
          ref={ref}
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(getFieldControlClass(error), 'pl-10 pr-10', className)}
          {...props}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-(--text-muted) hover:text-(--text-primary) disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </FieldWrapper>
  )
})

PasswordField.displayName = 'PasswordField'
