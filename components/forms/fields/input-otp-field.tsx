'use client'

import React, { useId, useState, useEffect, useRef } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { cn } from '@/lib/helpers'
import { fieldErrorClass, fieldFocusClass } from '../utils/field-styles'

export interface InputOtpFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  length?: 4 | 6
  value?: string
  defaultValue?: string
  autoFocus?: boolean
  name?: string
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export function InputOtpField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  length = 6,
  value,
  defaultValue = '',
  autoFocus = false,
  name = '',
  onChange,
}: InputOtpFieldProps) {
  const generatedId = useId()
  const id = `${name || 'otp'}-${generatedId}`

  const [internalVal, setInternalVal] = useState<string[]>(() => {
    const arr = Array(length).fill('')
    const startVal = defaultValue.replace(/\D/g, '').substring(0, length)
    for (let i = 0; i < startVal.length; i++) {
      arr[i] = startVal[i]
    }
    return arr
  })

  const currentVal = React.useMemo(() => {
    if (value !== undefined) {
      const arr = Array(length).fill('')
      const startVal = value.replace(/\D/g, '').substring(0, length)
      for (let i = 0; i < startVal.length; i++) {
        arr[i] = startVal[i]
      }
      return arr
    }
    return internalVal
  }, [value, length, internalVal])

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const triggerChange = (newArr: string[]) => {
    const valString = newArr.join('')
    if (value === undefined) {
      setInternalVal(newArr)
    }
    if (onChange) {
      onChange({
        target: { name, value: valString },
        persist: () => {},
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) return

    const newArr = [...currentVal]
    newArr[idx] = val.substring(val.length - 1)

    triggerChange(newArr)

    if (idx < length - 1 && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      const newArr = [...currentVal]

      if (currentVal[idx] !== '') {
        newArr[idx] = ''
        triggerChange(newArr)
      } else if (idx > 0) {
        newArr[idx - 1] = ''
        triggerChange(newArr)
        inputRefs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, length)
    if (!pastedText) return

    const newArr = Array(length).fill('')
    for (let i = 0; i < pastedText.length; i++) {
      newArr[i] = pastedText[i]
    }

    triggerChange(newArr)

    const focusIdx = Math.min(pastedText.length, length - 1)
    inputRefs.current[focusIdx]?.focus()
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
      <div className="flex gap-2.5 items-center w-full">
        {Array(length).fill(0).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={currentVal[idx]}
            onChange={(e) => handleInputChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className={cn(
              'w-11 h-12 rounded-xl border-2 border-(--border-primary) bg-(--bg-card) text-center text-lg font-bold font-mono text-(--text-primary) transition-all outline-none',
              fieldFocusClass,
              error && fieldErrorClass,
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />
        ))}
      </div>
    </FieldWrapper>
  )
}
