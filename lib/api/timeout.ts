import { DomainError } from './errors'

export async function withApiTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new DomainError('TIMEOUT', 'The request took too long. Please try again.')), timeoutMs)
  })
  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
