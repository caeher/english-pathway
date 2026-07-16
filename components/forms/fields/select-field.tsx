'use client'

import React, { useId, ElementType } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/helpers'
import {
  fieldOptionClass,
  fieldOptionSelectedClass,
  getFieldTriggerClass,
} from '../utils/field-styles'

export interface SelectOption {
  label: string
  value: string | number
  icon?: ElementType
  image?: string
}

export interface SelectFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  options: SelectOption[]
  value?: string | number
  defaultValue?: string | number
  name?: string
  matchTriggerWidth?: boolean
  onChange?: (e: { target: { name: string; value: string | number }; persist: () => void }) => void
}

export function SelectField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  options = [],
  value,
  defaultValue,
  name = '',
  matchTriggerWidth = true,
  onChange,
}: SelectFieldProps) {
  const generatedId = useId()
  const id = `${name || 'select'}-${generatedId}`

  const [internalVal, setInternalVal] = React.useState<string | number>(defaultValue ?? '')
  const currentVal = value !== undefined ? value : internalVal

  const selectedOption = options.find((opt) => String(opt.value) === String(currentVal))

  const handleSelect = (val: string | number, close: () => void) => {
    if (value === undefined) {
      setInternalVal(val)
    }
    if (onChange) {
      onChange({
        target: { name, value: val },
        persist: () => {},
      })
    }
    close()
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
      <div className="relative w-full">
        <select
          id={id}
          name={name}
          value={currentVal}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            handleSelect(e.target.value, () => {})
          }}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Popover
          disabled={disabled}
          matchTriggerWidth={matchTriggerWidth}
          trigger={
            <button type="button" className={getFieldTriggerClass(error)}>
              <div className="flex items-center gap-2 truncate">
                {selectedOption?.image && (
                  <img
                    src={selectedOption.image}
                    alt={selectedOption.label}
                    className="w-5 h-5 rounded-full object-cover border border-(--border-primary)"
                  />
                )}
                {selectedOption?.icon && (
                  <span className="text-(--text-muted)">
                    {React.createElement(selectedOption.icon, { size: 16 })}
                  </span>
                )}
                <span className={cn(selectedOption ? 'text-(--text-primary)' : 'text-(--text-muted)')}>
                  {selectedOption ? selectedOption.label : 'Select an option...'}
                </span>
              </div>
              <ChevronDown size={16} className="text-(--text-muted)" />
            </button>
          }
          content={(close) => (
            <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
              {options.length === 0 ? (
                <div className="text-xs text-(--text-muted) p-2 text-center">No options available</div>
              ) : (
                options.map((opt) => {
                  const isSelected = String(opt.value) === String(currentVal)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value, close)}
                      className={cn(
                        'w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl text-sm transition-all',
                        isSelected ? fieldOptionSelectedClass : fieldOptionClass
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt={opt.label}
                            className="w-5 h-5 rounded-full object-cover border border-(--border-primary)"
                          />
                        )}
                        {opt.icon && React.createElement(opt.icon, { size: 16, className: 'text-(--text-muted)' })}
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-(--accent)" />}
                    </button>
                  )
                })
              )}
            </div>
          )}
        />
      </div>
    </FieldWrapper>
  )
}
