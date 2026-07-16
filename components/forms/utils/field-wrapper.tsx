'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/helpers'
import {
  fieldErrorTextClass,
  fieldHintClass,
  fieldLabelClass,
  fieldLabelErrorClass,
} from './field-styles'

export interface FieldWrapperProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  children: ReactNode
  id: string
}

export function FieldWrapper({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  children,
  id,
}: FieldWrapperProps) {
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div
      className={cn(
        'group/field flex w-full',
        inline ? 'flex-row items-center gap-4 py-1' : 'flex-col gap-1.5',
        disabled && 'opacity-60 pointer-events-none'
      )}
    >
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className={cn(
            fieldLabelClass,
            inline ? 'w-[30%] text-right pr-2 truncate' : 'w-full',
            error && fieldLabelErrorClass
          )}
        >
          {label}
        </label>
      )}

      <div className={cn('flex flex-col gap-1.5 flex-1', inline ? 'w-[70%]' : 'w-full')}>
        {children}

        {error ? (
          <p id={errorId} role="alert" className={fieldErrorTextClass}>
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className={fieldHintClass}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
