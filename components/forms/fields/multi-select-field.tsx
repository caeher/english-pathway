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

export interface MultiSelectOption {
  label: string
  value: string | number
  icon?: ElementType
  image?: string
  description?: string
  keywords?: string[]
}

export interface MultiSelectFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  options: MultiSelectOption[]
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  placeholder?: string
  searchPlaceholder?: string
  maxSelections?: number
  name?: string
  onChange?: (e: { target: { name: string; value: (string | number)[] }; persist: () => void }) => void
}

export function MultiSelectField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  options = [],
  value,
  defaultValue = [],
  placeholder = 'Select multiple...',
  searchPlaceholder = 'Filter options...',
  maxSelections,
  name = '',
  onChange,
}: MultiSelectFieldProps) {
  const generatedId = useId()
  const id = `${name || 'multiselect'}-${generatedId}`

  const [internalVal, setInternalVal] = useState<(string | number)[]>(defaultValue)
  const currentVal = value !== undefined ? value : internalVal
  const [searchTerm, setSearchTerm] = useState('')

  const handleSelectOption = (optVal: string | number) => {
    let newVal: (string | number)[]

    if (currentVal.includes(optVal)) {
      newVal = currentVal.filter((v) => v !== optVal)
    } else {
      if (maxSelections !== undefined && currentVal.length >= maxSelections) {
        return
      }
      newVal = [...currentVal, optVal]
    }

    if (value === undefined) {
      setInternalVal(newVal)
    }
    if (onChange) {
      onChange({
        target: { name, value: newVal },
        persist: () => {},
      })
    }
  }

  const handleRemoveChip = (e: React.MouseEvent, optVal: string | number) => {
    e.stopPropagation()
    handleSelectOption(optVal)
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

  const selectedOptions = options.filter((opt) => currentVal.includes(opt.value))
  const atLimit = maxSelections !== undefined && currentVal.length >= maxSelections

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
          multiple
          value={currentVal.map(String)}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
            if (value === undefined) {
              setInternalVal(selected)
            }
            if (onChange) {
              onChange({
                target: { name, value: selected },
                persist: () => {},
              })
            }
          }}
        >
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
            <button
              type="button"
              className={cn(getFieldTriggerClass(error), 'p-2 min-h-11 h-auto items-start')}
            >
              <div className="flex flex-wrap gap-1.5 items-center mr-2 max-w-full">
                {selectedOptions.length === 0 ? (
                  <span className="text-(--text-muted) pl-1">{placeholder}</span>
                ) : (
                  selectedOptions.map((opt) => (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1 bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) text-xs px-2 py-0.5 rounded-lg"
                    >
                      {opt.image && (
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="w-3.5 h-3.5 rounded-full object-cover mr-0.5"
                        />
                      )}
                      {opt.icon && React.createElement(opt.icon, { size: 10, className: 'text-(--text-muted)' })}
                      <span className="max-w-[120px] truncate">{opt.label}</span>
                      <span
                        onClick={(e) => handleRemoveChip(e, opt.value)}
                        className="p-0.5 text-(--text-muted) hover:text-red-500 hover:bg-(--bg-card) rounded transition-colors"
                      >
                        <X size={10} />
                      </span>
                    </span>
                  ))
                )}
              </div>
              <ChevronDown size={16} className="text-(--text-muted) self-center flex-shrink-0" />
            </button>
          }
          content={() => (
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
                    const isSelected = currentVal.includes(opt.value)
                    const isOptionDisabled = !isSelected && atLimit

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isOptionDisabled}
                        onClick={() => handleSelectOption(opt.value)}
                        className={cn(
                          'w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-xl text-sm transition-all',
                          isSelected ? fieldOptionSelectedClass : fieldOptionClass,
                          isOptionDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
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
