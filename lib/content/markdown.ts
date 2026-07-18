export interface MarkdownHeading {
  level: 1 | 2 | 3 | 4
  text: string
  id: string
}

export function plainMarkdownText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function slugifyHeading(value: string): string {
  return plainMarkdownText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section'
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const counts = new Map<string, number>()
  const headings: MarkdownHeading[] = []

  for (const match of content.matchAll(/^(#{1,4})\s+(.+?)\s*#*\s*$/gm)) {
    const level = match[1].length as 1 | 2 | 3 | 4
    const text = plainMarkdownText(match[2])
    const baseId = slugifyHeading(text)
    const count = counts.get(baseId) ?? 0
    counts.set(baseId, count + 1)
    headings.push({ level, text, id: count === 0 ? baseId : `${baseId}-${count + 1}` })
  }

  return headings
}
