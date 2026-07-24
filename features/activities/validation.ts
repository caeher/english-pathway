import { chapterActivitySchema } from './contracts'
import { getDecisionNodeIds, isDecisionNode } from './branching-dialogue'

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

  if (parsed.data.type === 'quiz') {
    return validateQuizSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  if (parsed.data.type === 'listening') {
    return validateListeningSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  if (parsed.data.type === 'pronunciation') {
    return validatePronunciationSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  if (parsed.data.type === 'branching-dialogue') {
    return validateBranchingDialogueSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  return []
}

export function validateActivityList(moduleId: string, chapterId: string, activities: unknown[]): ActivityValidationIssue[] {
  return activities.flatMap((activity, index) => validateActivityDocument(moduleId, chapterId, activity, index))
}

export function filterValidationErrors(issues: ActivityValidationIssue[]): ActivityValidationIssue[] {
  return issues.filter((issue) => issue.severity !== 'warning')
}
