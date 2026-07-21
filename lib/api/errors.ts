import { NextResponse } from 'next/server'
import { apiErrorSchema } from './contracts'

export type DomainErrorCode = 'AUTHENTICATION_REQUIRED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'CREDITS_EXHAUSTED' | 'DEPENDENCY_FAILURE' | 'TIMEOUT'

const statusByCode: Record<DomainErrorCode, number> = {
  AUTHENTICATION_REQUIRED: 401,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CREDITS_EXHAUSTED: 429,
  DEPENDENCY_FAILURE: 503,
  TIMEOUT: 504,
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly status: number

  constructor(code: DomainErrorCode, message: string, status = statusByCode[code]) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.status = status
  }
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const domainError = error instanceof DomainError ? error : null
  const response = {
    error: domainError?.message ?? fallbackMessage,
    ...(domainError ? { code: domainError.code } : { code: 'DEPENDENCY_FAILURE' as const }),
  }
  return NextResponse.json(apiErrorSchema.parse(response), { status: domainError?.status ?? 503 })
}

export async function respondWithApiErrors<T>(operation: () => Promise<T>, fallbackMessage: string, init?: ResponseInit, timeoutMs = 10_000) {
  try {
    const { withApiTimeout } = await import('./timeout')
    return NextResponse.json(await withApiTimeout(operation(), timeoutMs), init)
  } catch (error) {
    console.error(error)
    return apiErrorResponse(error, fallbackMessage)
  }
}
