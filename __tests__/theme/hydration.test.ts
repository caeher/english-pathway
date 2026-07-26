import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('theme hydration safety', () => {
  it('does not mutate document during theme store rehydration', () => {
    const source = readFileSync(resolve(process.cwd(), 'stores/useThemeStore.ts'), 'utf8')
    expect(source).not.toContain('document.documentElement')
    expect(source).not.toContain('onRehydrateStorage')
  })

  it('applies persisted dark mode before React hydrates', () => {
    const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')
    const script = readFileSync(resolve(process.cwd(), 'lib/theme/theme-script.ts'), 'utf8')
    expect(layout).toContain('themeInitScript')
    expect(script).toContain('english-pathway-theme')
    expect(script).toContain("classList.add('dark')")
  })
})
