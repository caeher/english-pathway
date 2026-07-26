import { chapterActivitySchema } from './contracts'
import {
  parseChapterActivitiesFile,
  resolveActivityAdvanceFields,
  resolveActivityAdvancePolicy,
} from './advance-policy'
import { getDecisionNodeIds, isDecisionNode } from './branching-dialogue'
import {
  findDuplicateContentAcrossChapter,
  isGenericDescription,
  isGenericTitle,
  RETIRED_ACTIVITY_TYPES,
} from './quality/rules'

export interface ActivityValidationIssue {
  moduleId: string
  chapterId: string
  activityId: string
  field: string
  message: string
  severity?: 'error' | 'warning'
}

function validateQuizSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: { questions: Array<{ id: string; type: string; options?: string[]; correct?: number | string; explanation?: string }> },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []

  for (const [index, question] of props.questions.entries()) {
    if (question.type !== 'multiple-choice' || !question.options) continue

    const correctIndex = question.correct as number
    const correctOption = question.options[correctIndex]
    const distractors = question.options.filter((_, i) => i !== correctIndex)
    const distinctDistractors = new Set(distractors.map((o) => o.trim().toLowerCase()))

    if (distinctDistractors.size < 2) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.options`,
        message: 'multiple-choice questions should have at least two distinct distractors',
        severity: 'warning',
      })
    }

    if (!question.explanation?.trim()) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.explanation`,
        message: 'multiple-choice questions should include an explanation for feedback',
        severity: 'warning',
      })
    }

    if (correctOption && distractors.some((d) => d.trim().toLowerCase() === correctOption.trim().toLowerCase())) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.options`,
        message: 'a distractor matches the correct answer',
        severity: 'error',
      })
    }
  }

  return issues
}

function validateListeningSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: { items: Array<{ audio?: { src: string; altText?: string } }> },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []

  for (const [index, item] of props.items.entries()) {
    if (item.audio && !item.audio.altText?.trim()) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.items.${index}.audio.altText`,
        message: 'curated listening audio should include altText for post-answer feedback',
        severity: 'warning',
      })
    }
  }

  return issues
}

function validatePronunciationSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: { items: Array<{ contrastPair?: unknown }> },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []

  const contrastCount = props.items.filter((item) => item.contrastPair).length
  if (contrastCount > 0 && contrastCount < 2) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'props.items',
      message: 'pronunciation activities with contrast pairs should include at least two items with contrastPair',
      severity: 'warning',
    })
  }

  return issues
}

function validateMinimalPairsSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: {
    pairs: Array<{
      id: string
      wordA: string
      wordB: string
      audioA?: { altText?: string }
      audioB?: { altText?: string }
    }>
  },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []
  const seenIds = new Set<string>()

  for (const [index, pair] of props.pairs.entries()) {
    if (seenIds.has(pair.id)) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.pairs.${index}.id`,
        message: `duplicate pair id "${pair.id}"`,
        severity: 'error',
      })
    }
    seenIds.add(pair.id)

    for (const [field, audio] of [['audioA', pair.audioA], ['audioB', pair.audioB]] as const) {
      if (audio && !audio.altText?.trim()) {
        issues.push({
          moduleId,
          chapterId,
          activityId,
          field: `props.pairs.${index}.${field}.altText`,
          message: 'curated minimal-pairs audio should include altText for post-answer feedback',
          severity: 'warning',
        })
      }
    }
  }

  return issues
}

function validateBranchingDialogueSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: {
    startNodeId: string
    nodes: Array<{
      id: string
      isTerminal?: boolean
      choices: Array<{ nextNodeId: string; pragmaticRating: string; explanation?: string }>
    }>
  },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []
  const nodeMap = new Map(props.nodes.map((node) => [node.id, node]))
  const reachable = new Set<string>()
  const queue = [props.startNodeId]

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (!nodeId || reachable.has(nodeId)) continue
    reachable.add(nodeId)
    const node = nodeMap.get(nodeId)
    if (!node) continue
    for (const choice of node.choices) {
      if (!reachable.has(choice.nextNodeId)) queue.push(choice.nextNodeId)
    }
  }

  for (const node of props.nodes) {
    if (!reachable.has(node.id)) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.nodes.${node.id}`,
        message: `node "${node.id}" is unreachable from startNodeId`,
        severity: 'warning',
      })
    }
  }

  const hasTerminal = props.nodes.some((node) => node.isTerminal || node.choices.length === 0)
  if (!hasTerminal) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'props.nodes',
      message: 'branching dialogue should include at least one terminal node',
      severity: 'error',
    })
  }

  for (const [index, node] of props.nodes.entries()) {
    if (!isDecisionNode(node as import('./branching-dialogue').BranchingDialogueNode)) continue

    const hasViableChoice = node.choices.some(
      (choice) => choice.pragmaticRating === 'optimal' || choice.pragmaticRating === 'acceptable',
    )
    if (!hasViableChoice) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.nodes.${index}.choices`,
        message: 'decision nodes should include at least one optimal or acceptable choice',
        severity: 'error',
      })
    }

    if (node.choices.every((choice) => choice.pragmaticRating === 'inappropriate')) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.nodes.${index}.choices`,
        message: 'decision nodes should not only contain inappropriate choices',
        severity: 'warning',
      })
    }

    for (const [choiceIndex, choice] of node.choices.entries()) {
      if (!choice.explanation?.trim()) {
        issues.push({
          moduleId,
          chapterId,
          activityId,
          field: `props.nodes.${index}.choices.${choiceIndex}.explanation`,
          message: 'each choice should include pedagogical feedback in explanation',
          severity: 'warning',
        })
      }
    }
  }

  if (getDecisionNodeIds({ setting: '', startNodeId: props.startNodeId, nodes: props.nodes as import('./branching-dialogue').BranchingDialogueNode[] }).length < 2) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'props.nodes',
      message: 'branching dialogue should include at least two decision nodes',
      severity: 'warning',
    })
  }

  return issues
}

function validateEditorialMetadata(
  moduleId: string,
  chapterId: string,
  activityId: string,
  activity: { id: string; title: string; description: string; type: string },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []
  const expectedId = `${chapterId}-${activity.type}`

  if (RETIRED_ACTIVITY_TYPES.includes(activity.type as typeof RETIRED_ACTIVITY_TYPES[number])) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'type',
      message: `activity type "${activity.type}" is retired`,
      severity: 'error',
    })
  }

  if (activity.id !== expectedId && !activity.id.startsWith(`${chapterId}-`)) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'id',
      message: `activity id should follow ${chapterId}-{type}`,
      severity: 'warning',
    })
  }

  if (isGenericTitle(activity.title)) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'title',
      message: 'title looks like a generic template',
      severity: 'warning',
    })
  }

  if (isGenericDescription(activity.description)) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'description',
      message: 'description looks like a generic template',
      severity: 'warning',
    })
  }

  return issues
}

function validateAdvancePolicySemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  activity: { required?: boolean; policy?: { mode?: string; passThreshold?: number } },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []

  if (activity.required === undefined) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'required',
      message: 'required must be declared explicitly (true or false)',
      severity: 'error',
    })
  }

  if (!activity.policy) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'policy',
      message: 'policy must be declared explicitly with mode (and passThreshold when mode is score)',
      severity: 'error',
    })
    return issues
  }

  if (activity.policy.mode === 'completion' && activity.policy.passThreshold !== undefined) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'policy.passThreshold',
      message: 'passThreshold is not allowed when policy.mode is completion',
      severity: 'error',
    })
  }

  if (activity.policy.mode === 'score' && activity.policy.passThreshold === undefined) {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'policy.passThreshold',
      message: 'passThreshold must be declared explicitly when policy.mode is score',
      severity: 'error',
    })
  }

  try {
    resolveActivityAdvancePolicy({
      mode: activity.policy.mode === 'completion' ? 'completion' : activity.policy.mode === 'score' ? 'score' : undefined,
      passThreshold: activity.policy.passThreshold,
    })
  } catch {
    issues.push({
      moduleId,
      chapterId,
      activityId,
      field: 'policy',
      message: 'policy is invalid',
      severity: 'error',
    })
  }

  return issues
}

function validateChapterAdvancePolicy(
  moduleId: string,
  chapterId: string,
  activities: Array<{ id: string; required?: boolean; policy?: { mode?: string; passThreshold?: number } }>,
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []
  const ids = new Set<string>()

  for (const activity of activities) {
    if (ids.has(activity.id)) {
      issues.push({
        moduleId,
        chapterId,
        activityId: activity.id,
        field: 'id',
        message: `duplicate activity id "${activity.id}"`,
        severity: 'error',
      })
    }
    ids.add(activity.id)
  }

  const resolved = activities.map((activity) => resolveActivityAdvanceFields({
    required: activity.required,
    policy: activity.policy ? {
      mode: activity.policy.mode === 'completion' ? 'completion' : activity.policy.mode === 'score' ? 'score' : undefined,
      passThreshold: activity.policy.passThreshold,
    } : undefined,
  }))
  const requiredCount = resolved.filter((activity) => activity.required).length
  if (activities.length > 0 && requiredCount === 0) {
    issues.push({
      moduleId,
      chapterId,
      activityId: 'chapter',
      field: 'activities',
      message: 'chapter must declare at least one required activity',
      severity: 'error',
    })
  }

  return issues
}

function validateChapterEditorialRules(
  moduleId: string,
  chapterId: string,
  activities: Array<{ id: string; type: string; title: string; description: string; props: unknown }>,
): ActivityValidationIssue[] {
  const parsedActivities = activities.flatMap((activity) => {
    const parsed = chapterActivitySchema.safeParse(activity)
    return parsed.success ? [parsed.data] : []
  })

  return findDuplicateContentAcrossChapter(parsedActivities).map((finding) => ({
    moduleId,
    chapterId,
    activityId: finding.activityId ?? 'chapter',
    field: finding.field,
    message: finding.message,
    severity: 'warning' as const,
  }))
}

export function validateCurriculumContrastPairs(
  activitiesByChapter: Array<{ moduleId: string; chapterId: string; activities: Array<{ type: string; props: unknown }> }>,
): ActivityValidationIssue[] {
  let contrastPairCount = 0

  for (const chapter of activitiesByChapter) {
    for (const activity of chapter.activities) {
      if (activity.type !== 'pronunciation' || !activity.props || typeof activity.props !== 'object') continue
      const items = (activity.props as { items?: Array<{ contrastPair?: unknown }> }).items ?? []
      contrastPairCount += items.filter((item) => item.contrastPair).length
    }
  }

  if (contrastPairCount < 2) {
    return [{
      moduleId: 'curriculum',
      chapterId: 'global',
      activityId: 'pronunciation-contrast-pairs',
      field: 'contrastPair',
      message: 'curriculum should include at least two pronunciation contrastPair items',
      severity: 'warning',
    }]
  }

  return []
}

export function validateActivityDocument(moduleId: string, chapterId: string, activity: unknown, index: number): ActivityValidationIssue[] {
  const parsed = chapterActivitySchema.safeParse(activity)
  const raw = activity && typeof activity === 'object' ? activity as Record<string, unknown> : {}
  const activityId = typeof raw.id === 'string' ? raw.id : `index:${index}`
  const activityType = typeof raw.type === 'string' ? raw.type : 'unknown'

  if (RETIRED_ACTIVITY_TYPES.includes(activityType as typeof RETIRED_ACTIVITY_TYPES[number])) {
    return [{
      moduleId,
      chapterId,
      activityId,
      field: 'type',
      message: `activity type "${activityType}" is retired`,
      severity: 'error',
    }]
  }

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      moduleId,
      chapterId,
      activityId,
      field: issue.path.length > 0 ? issue.path.join('.') : 'activity',
      message: issue.message,
      severity: 'error' as const,
    }))
  }

  const editorialIssues = validateEditorialMetadata(moduleId, chapterId, activityId, parsed.data)
  let semanticIssues: ActivityValidationIssue[] = []

  if (parsed.data.type === 'quiz') {
    semanticIssues = validateQuizSemantics(moduleId, chapterId, activityId, parsed.data.props)
  } else if (parsed.data.type === 'listening') {
    semanticIssues = validateListeningSemantics(moduleId, chapterId, activityId, parsed.data.props)
  } else if (parsed.data.type === 'pronunciation') {
    semanticIssues = validatePronunciationSemantics(moduleId, chapterId, activityId, parsed.data.props)
  } else if (parsed.data.type === 'branching-dialogue') {
    semanticIssues = validateBranchingDialogueSemantics(moduleId, chapterId, activityId, parsed.data.props)
  } else if (parsed.data.type === 'minimal-pairs') {
    semanticIssues = validateMinimalPairsSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  const policyIssues = validateAdvancePolicySemantics(moduleId, chapterId, activityId, parsed.data)

  return [...editorialIssues, ...semanticIssues, ...policyIssues]
}

export function validateActivityList(moduleId: string, chapterId: string, raw: unknown): ActivityValidationIssue[] {
  let activities: unknown[]
  try {
    activities = parseChapterActivitiesFile(raw).activities
  } catch (error) {
    return [{
      moduleId,
      chapterId,
      activityId: 'chapter',
      field: 'activities',
      message: error instanceof Error ? error.message : 'invalid activities file',
      severity: 'error',
    }]
  }

  const perActivity = activities.flatMap((activity, index) => validateActivityDocument(moduleId, chapterId, activity, index))
  const chapterActivities = activities.filter((activity): activity is { id: string; type: string; title: string; description: string; props: unknown; required?: boolean; policy?: { mode?: string; passThreshold?: number } } => (
    Boolean(activity && typeof activity === 'object')
  ))
  const chapterLevel = [
    ...validateChapterEditorialRules(moduleId, chapterId, chapterActivities),
    ...validateChapterAdvancePolicy(moduleId, chapterId, chapterActivities),
  ]
  return [...perActivity, ...chapterLevel]
}

export function filterValidationErrors(issues: ActivityValidationIssue[]): ActivityValidationIssue[] {
  return issues.filter((issue) => issue.severity !== 'warning')
}
