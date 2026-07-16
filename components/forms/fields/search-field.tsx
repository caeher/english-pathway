'use client'

import React, { forwardRef, useRef, useImperativeHandle, useId } from 'react'
import { TextField, TextFieldProps } from './text-field'
import { Search, Loader2, X } from 'lucide-react'

export interface SearchFieldProps extends Omit<TextFieldProps, 'type'> {
  loading?: boolean
  clearable?: boolean
  onClear?: () => void
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(({
  loading = false,
  clearable = true,
  onClear,
  icon: customIcon,
  onChange,
  value,
  name,
  id: customId,
  ...props
}, ref) => {
  const generatedId = useId()
  const id = customId || generatedId

  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
      if (onChange) {
        onChange({
          target: { name: name || '', value: '' },
          persist: () => {},
        })
      }
      if (onClear) {
        onClear()
      }
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const IconToRender = loading
    ? () => <Loader2 size={16} className="animate-spin text-(--accent)" />
    : (customIcon || Search)

  const hasValue = value !== undefined && value !== null && String(value).length > 0

  return (
    <div className="relative w-full">
      <TextField
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        type="search"
        icon={IconToRender}
        iconPosition="left"
        onChange={onChange}
        className="pr-10"
        {...props}
      />

      {clearable && hasValue && !loading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-tertiary) rounded-lg transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
})

SearchField.displayName = 'SearchField'
