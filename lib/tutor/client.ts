import type { TutorMemoryWrite } from '@/lib/api/tutor-memory-schemas'

export async function saveTutorMemory(write: TutorMemoryWrite) {
  try {
    const response = await fetch('/api/tutor/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(write),
      keepalive: true,
    })
    return response.ok
  } catch {
    return false
  }
}
