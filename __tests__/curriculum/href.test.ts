import { describe, expect, it } from 'vitest'
import { curriculumChapterHref, curriculumModuleHref } from '@/lib/curriculum/href'

describe('curriculum URLs', () => {
  it('creates canonical module and chapter paths', () => {
    expect(curriculumModuleHref('modulo-1')).toBe('/curriculum/modulo-1')
    expect(curriculumChapterHref('modulo-1', 'm1-ch1')).toBe('/curriculum/modulo-1/m1-ch1')
  })

  it('escapes dynamic path identifiers', () => {
    expect(curriculumChapterHref('module one', 'chapter/one')).toBe('/curriculum/module%20one/chapter%2Fone')
  })
})
