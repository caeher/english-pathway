'use client'

import React, { useId, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/helpers'
import {
  fieldOptionClass,
  fieldOptionSelectedClass,
  fieldErrorClass,
  fieldFocusClass,
} from '../utils/field-styles'

export interface PhoneCountryOption {
  code: string
  dial: string
  label: string
  flag?: string
}

export const DEFAULT_COUNTRIES: PhoneCountryOption[] = [
  { code: 'US', dial: '+1', label: 'United States', flag: '🇺🇸' },
  { code: 'MX', dial: '+52', label: 'Mexico', flag: '🇲🇽' },
  { code: 'CA', dial: '+1', label: 'Canada', flag: '🇨🇦' },
  { code: 'GB', dial: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'ES', dial: '+34', label: 'Spain', flag: '🇪🇸' },
  { code: 'FR', dial: '+33', label: 'France', flag: '🇫🇷' },
  { code: 'DE', dial: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: 'IT', dial: '+39', label: 'Italy', flag: '🇮🇹' },
  { code: 'BR', dial: '+55', label: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', dial: '+54', label: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', dial: '+57', label: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', dial: '+56', label: 'Chile', flag: '🇨🇱' },
  { code: 'PE', dial: '+51', label: 'Peru', flag: '🇵🇪' },
  { code: 'VE', dial: '+58', label: 'Venezuela', flag: '🇻🇪' },
  { code: 'JP', dial: '+81', label: 'Japan', flag: '🇯🇵' },
  { code: 'CN', dial: '+86', label: 'China', flag: '🇨🇳' },
  { code: 'IN', dial: '+91', label: 'India', flag: '🇮🇳' },
  { code: 'AU', dial: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: 'ZA', dial: '+27', label: 'South Africa', flag: '🇿🇦' },
  { code: 'RU', dial: '+7', label: 'Russia', flag: '🇷🇺' },
]

export interface PhoneFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  value?: string
  defaultValue?: string
  country?: string
  defaultCountry?: string
  countries?: PhoneCountryOption[]
  name?: string
  onCountryChange?: (countryCode: string) => void
  onChange?: (e: { target: { name: string; value: string }; persist: () => void }) => void
}

export function PhoneField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  value,
  defaultValue = '',
  country,
  defaultCountry = 'US',
  countries = DEFAULT_COUNTRIES,
  name = '',
  onCountryChange,
  onChange,
}: PhoneFieldProps) {
  const generatedId = useId()
  const id = `${name || 'phone'}-${generatedId}`

  const parseVal = useCallback((val: string) => {
    if (!val) return { dial: '', national: '' }
    const match = countries.find((c) => val.startsWith(c.dial))
    if (match) {
      return {
        dial: match.dial,
        national: val.substring(match.dial.length).trim(),
      }
    }
    return { dial: '', national: val }
  }, [countries])

  const initialParsed = parseVal(defaultValue)

  const [internalNationalNumber, setInternalNationalNumber] = useState(initialParsed.national)
  const [internalCountry, setInternalCountry] = useState<PhoneCountryOption>(() => {
    if (country) {
      return countries.find((c) => c.code === country) || countries[0]
    }
    if (initialParsed.dial) {
      return (
        countries.find((c) => c.dial === initialParsed.dial) ||
        countries.find((c) => c.code === defaultCountry) ||
        countries[0]
      )
    }
    return countries.find((c) => c.code === defaultCountry) || countries[0]
  })

  const controlledParsed = value !== undefined ? parseVal(value) : null
  const nationalNumber = controlledParsed?.national ?? internalNationalNumber
  const selectedCountry = React.useMemo(() => {
    if (value !== undefined && controlledParsed?.dial) {
      const matchingCountry = countries.find((c) => c.dial === controlledParsed.dial)
      if (matchingCountry) return matchingCountry
    }
    if (country) {
      return countries.find((c) => c.code === country) || internalCountry
    }
    return internalCountry
  }, [value, controlledParsed, country, countries, internalCountry])

  const handleCountryChange = (c: PhoneCountryOption, close: () => void) => {
    if (value === undefined) {
      setInternalCountry(c)
    }
    if (onCountryChange) {
      onCountryChange(c.code)
    }

    const newFullNumber = `${c.dial} ${nationalNumber}`.trim()
    if (onChange) {
      onChange({
        target: { name, value: newFullNumber },
        persist: () => {},
      })
    }
    close()
  }

  const handleNationalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d\s\-()]/g, '')
    if (value === undefined) {
      setInternalNationalNumber(cleaned)
    }

    const newFullNumber = `${selectedCountry.dial} ${cleaned}`.trim()
    if (onChange) {
      onChange({
        target: { name, value: newFullNumber },
        persist: () => {},
      })
    }
  }

  const fullNumber = `${selectedCountry.dial} ${nationalNumber}`.trim()

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="flex w-full items-center relative">
        <input type="hidden" name={name} value={fullNumber} />

        <Popover
          disabled={disabled}
          matchTriggerWidth={false}
          align="start"
          trigger={
            <button
              type="button"
              className={cn(
                'h-11 px-3 flex items-center gap-1.5 bg-(--bg-card) text-(--text-primary) border-2 border-(--border-primary) border-r-0 rounded-l-xl hover:bg-(--bg-tertiary) transition-colors select-none cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-semibold font-mono">{selectedCountry.dial}</span>
              <ChevronDown size={12} className="text-(--text-muted)" />
            </button>
          }
          content={(close) => (
            <div className="flex flex-col gap-0.5 max-h-[220px] w-56 overflow-y-auto">
              {countries.map((c) => {
                const isSelected = c.code === selectedCountry.code
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c, close)}
                    className={cn(
                      'w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl text-xs transition-all',
                      isSelected ? fieldOptionSelectedClass : fieldOptionClass
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{c.flag}</span>
                      <span className="font-mono text-[10px] bg-(--bg-tertiary) px-1 py-0.5 rounded text-(--text-muted)">
                        {c.dial}
                      </span>
                      <span className="truncate">{c.label}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-(--accent)" />}
                  </button>
                )
              })}
            </div>
          )}
        />

        <Input
          id={id}
          type="tel"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNationalNumberChange}
          placeholder="Enter phone number..."
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            'rounded-l-none border-l-0',
            fieldFocusClass,
            error && fieldErrorClass
          )}
        />
      </div>
    </FieldWrapper>
  )
}
