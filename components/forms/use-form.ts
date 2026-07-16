'use client'

import { useCallback, useState } from 'react'
import type { ZodType } from 'zod'

export type FormValues = Record<string, unknown>

export type FormChangeEvent = {
  target: { name: string; value: unknown }
  persist: () => void
}

export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>

interface UseFormOptions<T extends FormValues> {
  initialValues: T
  schema?: ZodType<T>
  onSubmit?: (values: T) => void | Promise<void>
}

export function useForm<T extends FormValues>({
  initialValues,
  schema,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e: FormChangeEvent) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name as keyof T]) return prev
      const next = { ...prev }
      delete next[name as keyof T]
      return next
    })
  }, [])

  const setFieldValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    if (!schema) return true

    const result = schema.safeParse(values)
    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: FormErrors<T> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof T
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }, [schema, values])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!validate()) return
      setIsSubmitting(true)
      try {
        await onSubmit?.(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, validate, values]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    handleSubmit,
    validate,
    reset,
    setErrors,
  }
}
