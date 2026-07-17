export async function enqueueSrsItems(contentRefs: string[]) {
  if (contentRefs.length === 0) return false
  const response = await fetch('/api/srs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enqueue', contentRefs }),
  })
  return response.ok
}
