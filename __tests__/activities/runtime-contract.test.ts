import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ACTIVITY_RUNTIME_CONTRACT_VERSION,
  activityRegistry,
  activityRuntimeEventSchema,
  extractItemIndexFromProgress,
  getActivityDefinition,
  getDeclaredCapabilities,
  hasActivityCapability,
  hasCapability,
  toActivityCompleteSummary,
} from '@/features/activities'
import type { ActivityType } from '@/types'

const activityTypes: ActivityType[] = [
  'quiz', 'flashcard', 'word-match', 'sentence-builder', 'svg-scene',
  'word-scramble', 'listening', 'dictation', 'pronunciation', 'drag-drop',
]

const hintTypes = new Set<ActivityType>(['word-scramble', 'dictation', 'pronunciation'])
const itemFeedbackTypes = new Set<ActivityType>(['quiz', 'listening'])

describe('activity runtime contract', () => {
  it.each(activityTypes)('%s declares contract version 1 and required registry fields', (type) => {
    const definition = activityRegistry[type]
    expect(definition.contractVersion).toBe(ACTIVITY_RUNTIME_CONTRACT_VERSION)
    expect(definition.schema).toBeDefined()
    expect(definition.renderer).toBe(type)
    expect(definition.evaluator({ score: 2, total: 4 }).scorePercent).toBe(50)
    expect(definition.snapshot.version).toBe(1)
    expect(definition.capabilities.supports.size).toBeGreaterThan(0)
    expect(hasCapability(definition.capabilities, 'progress')).toBe(true)
    expect(hasCapability(definition.capabilities, 'snapshot')).toBe(true)
    expect(hasCapability(definition.capabilities, 'keyboard')).toBe(true)
    expect(hasCapability(definition.capabilities, 'review')).toBe(true)
  })

  it.each(activityTypes)('%s exposes declared capabilities through helpers', (type) => {
    const declared = getDeclaredCapabilities(type)
    expect(declared.supports.size).toBe(activityRegistry[type].capabilities.supports.size)
    expect(hasActivityCapability(activityRegistry[type], 'keyboard')).toBe(true)
  })

  it('declares hint capability only for editorial hint activities', () => {
    for (const type of activityTypes) {
      expect(hasActivityCapability(activityRegistry[type], 'hint')).toBe(hintTypes.has(type))
      if (hintTypes.has(type)) {
        expect(activityRegistry[type].capabilities.hintLevels).toBe(1)
      }
    }
  })

  it('declares item feedback for activities with per-item explanations', () => {
    for (const type of activityTypes) {
      expect(hasActivityCapability(activityRegistry[type], 'itemFeedback')).toBe(itemFeedbackTypes.has(type))
    }
  })

  it('validates normalized runtime events', () => {
    const summary = toActivityCompleteSummary({
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      score: 4,
      total: 5,
      scorePercent: 80,
      correctness: 'partial',
      weakItemIndexes: [2],
    })

    expect(activityRuntimeEventSchema.safeParse({
      type: 'started',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
    }).success).toBe(true)

    expect(activityRuntimeEventSchema.safeParse({
      type: 'hintRequested',
      activityId: 'm1-ch1-dictation',
      activityType: 'dictation',
      itemIndex: 1,
      level: 2,
    }).success).toBe(true)

    expect(activityRuntimeEventSchema.safeParse({
      type: 'completed',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      result: summary,
    }).success).toBe(true)

    expect(activityRuntimeEventSchema.safeParse({
      type: 'abandoned',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      reason: 'exit',
    }).success).toBe(true)
  })

  it('extracts item indexes from known progress payloads', () => {
    expect(extractItemIndexFromProgress('quiz', { current: 2, answered: true })).toBe(2)
    expect(extractItemIndexFromProgress('flashcard', { currentIndex: 1 })).toBe(1)
    expect(extractItemIndexFromProgress('quiz', null)).toBeUndefined()
  })

  it('returns null for unknown activity definitions', () => {
    expect(getActivityDefinition('not-a-game')).toBeNull()
  })
})

describe('activity shell capability wiring', () => {
  it('renders Need help only through the optional onHelp prop', () => {
    const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityControlBar.tsx'), 'utf8')
    expect(source).toContain('{onHelp && <Button')
    expect(source).toContain('Need help')
  })

  it('gates help in ActivityRenderer from declared hint capability', () => {
    const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(source).toContain("hasActivityCapability(definition, 'hint')")
    expect(source).toContain('onHelp={canRequestHelp ? handleHelpDuringPlay : undefined}')
    expect(source).toContain('onRuntimeEvent?: (event: ActivityRuntimeEvent) => void')
  })
})
