export async function enqueueSrsItems(contentRefs: string[]) {
  if (contentRefs.length === 0) return false
  const response = await fetch('/api/srs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enqueue', contentRefs }),
  })
  if (response.ok && typeof window !== 'undefined') window.dispatchEvent(new Event('srs-queue-updated'))
  return response.ok
}
