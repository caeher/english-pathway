'use client'

import React, { useId, useState, ElementType } from 'react'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../utils/field-wrapper'
import { Popover } from '../primitives/form-popover'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/helpers'
import {
  fieldOptionClass,
  fieldOptionSelectedClass,
  getFieldTriggerClass,
} from '../utils/field-styles'

export interface ComboboxOption {
  label: string
  value: string | number
  icon?: ElementType
  image?: string
  description?: string
  keywords?: string[]
}

export interface ComboboxFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  options: ComboboxOption[]
  value?: string | number
  defaultValue?: string | number
  placeholder?: string
  searchPlaceholder?: string
  clearable?: boolean
  name?: string
  onChange?: (e: { target: { name: string; value: string | number }; persist: () => void }) => void
}

export function ComboboxField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  options = [],
  value,
  defaultValue,
  placeholder = 'Search and select...',
  searchPlaceholder = 'Filter options...',
  clearable = true,
  name = '',
  onChange,
}: ComboboxFieldProps) {
  const generatedId = useId()
  const id = `${name || 'combobox'}-${generatedId}`

  const [internalVal, setInternalVal] = useState<string | number>(defaultValue ?? '')
  const currentVal = value !== undefined ? value : internalVal
  const [searchTerm, setSearchTerm] = useState('')

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleSelect('', () => {})
  }

  const filteredOptions = options.filter((opt) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const matchLabel = opt.label.toLowerCase().includes(term)
    const matchDesc = opt.description?.toLowerCase().includes(term) || false
    const matchVal = String(opt.value).toLowerCase().includes(term)
    const matchKeywords = opt.keywords?.some((k) => k.toLowerCase().includes(term)) || false
    return matchLabel || matchDesc || matchVal || matchKeywords
  })

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
          onChange={(e) => handleSelect(e.target.value, () => {})}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Popover
          disabled={disabled}
          matchTriggerWidth={true}
          trigger={
            <button type="button" className={getFieldTriggerClass(error)}>
              <div className="flex items-center gap-2 truncate mr-2">
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
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {clearable && selectedOption && (
                  <span
                    onClick={handleClear}
                    className="p-0.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </span>
                )}
                <ChevronDown size={16} className="text-(--text-muted)" />
              </div>
            </button>
          }
          content={(close) => (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-hidden">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-(--text-muted)" />
                <Input
                  type="text"
                  autoFocus
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
                {filteredOptions.length === 0 ? (
                  <div className="text-xs text-(--text-muted) p-2 text-center">No options match search</div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = String(opt.value) === String(currentVal)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleSelect(opt.value, close)
                          setSearchTerm('')
                        }}
                        className={cn(
                          'w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-xl text-sm transition-all',
                          isSelected ? fieldOptionSelectedClass : fieldOptionClass
                        )}
                      >
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt={opt.label}
                            className="w-5 h-5 rounded-full object-cover border border-(--border-primary) mt-0.5"
                          />
                        )}
                        {opt.icon && (
                          <span className="mt-0.5 text-(--text-muted)">
                            {React.createElement(opt.icon, { size: 16 })}
                          </span>
                        )}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[10px] text-(--text-muted) truncate mt-0.5">
                              {opt.description}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check size={14} className="text-(--accent) self-center" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        />
      </div>
    </FieldWrapper>
  )
}
