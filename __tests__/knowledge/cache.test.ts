import { describe, expect, it } from 'vitest'
import { clearModuleCache, getChapter, getChapterNav, getModule, loadAllModules } from '@/lib/knowledge/load-all'

describe('knowledge catalog cache', () => {
  it('reuses one indexed catalog for repeated module, chapter, and navigation reads', () => {
    clearModuleCache()
    const catalog = loadAllModules()
    expect(loadAllModules()).toBe(catalog)
    expect(getModule('modulo-1')).toBe(catalog[0])
    expect(getChapter('m1-ch1')?.chapter).toBe(catalog[0]?.chapters[0])
    expect(getChapterNav('m1-ch1').next).not.toBeNull()
  })

  it('rebuilds every index after explicit invalidation', () => {
    const before = loadAllModules()
    clearModuleCache()
    const after = loadAllModules()
    expect(after).not.toBe(before)
    expect(getChapter('m1-ch1')?.chapter.id).toBe('m1-ch1')
  })
})
