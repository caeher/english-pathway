import { describe, expect, it } from 'vitest'
import { loadAllModules } from '@/lib/knowledge/load-all'
import { activityRegistry, validateActivityDocument, filterValidationErrors } from '@/features/activities'

describe('activity contracts and registry', () => {
  it('registers every renderer extension point with schema, evaluator, and capabilities', () => {
    expect(Object.keys(activityRegistry)).toHaveLength(8)
    for (const definition of Object.values(activityRegistry)) {
      expect(definition.schema).toBeDefined()
      expect(definition.renderer).toBeDefined()
      expect(definition.contractVersion).toBe(1)
      expect(definition.evaluator({ score: 1, total: 2 }).scorePercent).toBe(50)
      expect(definition.capabilities.supports.size).toBeGreaterThan(0)
    }
  })

  it('validates every activity loaded from the knowledge base', () => {
    const invalid = loadAllModules().flatMap((module) => module.chapters.flatMap((chapter) =>
      chapter.activities.flatMap((activity, index) => validateActivityDocument(module.id, chapter.id, activity, index))))
    expect(filterValidationErrors(invalid)).toEqual([])
  })

  it('reports the exact activity field for invalid content', () => {
    const issues = validateActivityDocument('modulo-1', 'm1-ch1', {
      id: 'bad-quiz',
      type: 'quiz',
      title: 'Bad quiz',
      description: '',
      props: { questions: [] },
    }, 0)
    expect(issues[0]).toMatchObject({ moduleId: 'modulo-1', chapterId: 'm1-ch1', activityId: 'bad-quiz', field: 'props.questions' })
  })
})
