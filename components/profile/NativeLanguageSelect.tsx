'use client'

import { Label } from '@/components/ui/label'
import { NATIVE_LANGUAGES, type NativeLanguageCode } from '@/lib/languages/native-languages'

interface NativeLanguageSelectProps {
  id: string
  value: NativeLanguageCode | null
  onChange: (value: NativeLanguageCode | null) => void
  allowEmpty?: boolean
  describedBy?: string
  className?: string
}

export default function NativeLanguageSelect({
  id,
  value,
  onChange,
  allowEmpty = true,
  describedBy,
  className,
}: NativeLanguageSelectProps) {
  return (
    <select
      id={id}
      value={value ?? ''}
      aria-describedby={describedBy}
      onChange={(event) => {
        const nextValue = event.target.value
        onChange(nextValue ? (nextValue as NativeLanguageCode) : null)
      }}
      className={
        className ??
        'mt-1 w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-2.5 text-sm text-(--text-primary)'
      }
    >
      {allowEmpty && <option value="">Not set</option>}
      {NATIVE_LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  )
}

export function NativeLanguageField({
  id,
  label,
  hint,
  value,
  onChange,
  allowEmpty = true,
}: {
  id: string
  label: string
  hint?: string
  value: NativeLanguageCode | null
  onChange: (value: NativeLanguageCode | null) => void
  allowEmpty?: boolean
}) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NativeLanguageSelect
        id={id}
        value={value}
        onChange={onChange}
        allowEmpty={allowEmpty}
        describedBy={hintId}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-(--text-muted)">
          {hint}
        </p>
      )}
    </div>
  )
}
