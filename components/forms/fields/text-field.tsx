'use client'

import React, { forwardRef, useId, ElementType, ComponentPropsWithRef } from 'react'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'
import { fieldIconClass, getFieldControlClass } from '../utils/field-styles'

export interface TextFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'onChange'> {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  icon?: ElementType
  iconPosition?: 'left' | 'right'
  disabled?: boolean
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  hint,
  error,
  inline = false,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  className,
  id: customId,
  name = '',
  onChange,
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId()
  const id = customId || generatedId

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
        {Icon && iconPosition === 'left' && (
          <div className={cn('absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none', fieldIconClass)}>
            <Icon size={16} />
          </div>
        )}

        <Input
          ref={ref}
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            getFieldControlClass(error),
            Icon && iconPosition === 'left' && 'pl-10',
            Icon && iconPosition === 'right' && 'pr-10',
            className
          )}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className={cn('absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none', fieldIconClass)}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </FieldWrapper>
  )
})

TextField.displayName = 'TextField'
