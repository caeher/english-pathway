import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('feature boundaries', () => {
  it('passes the repository boundary check', () => {
    const script = path.join(process.cwd(), 'scripts', 'check-feature-boundaries.mjs')
    const output = execFileSync(process.execPath, [script], { encoding: 'utf8' })

    expect(output).toContain('Feature boundary check passed')
  })
})
