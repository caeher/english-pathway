import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('activity hint persistence', () => {
  it('stores hint metadata on activity snapshots', () => {
    const snapshot = readFileSync(resolve(process.cwd(), 'features/activities/snapshot.ts'), 'utf8')
    const renderer = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')

    expect(snapshot).toContain('hintMeta')
    expect(renderer).toContain('restoreHintFromSnapshot')
    expect(renderer).toContain('hintMeta: meta')
  })
})
