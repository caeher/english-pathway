export type PragmaticRating = 'optimal' | 'acceptable' | 'inappropriate'
export type GrammaticalRating = 'correct' | 'incorrect'

export interface BranchingDialogueChoice {
  id: string
  text: string
  nextNodeId: string
  pragmaticRating: PragmaticRating
  grammaticalRating?: GrammaticalRating
  consequence?: string
  explanation: string
}

export interface BranchingDialogueNode {
  id: string
  speakerId?: string
  intention: string
  prompt: string
  audio?: {
    src: string
    transcript: string
    speaker?: string
    accent?: string
    defaultRate?: number
    altText?: string
  }
  choices: BranchingDialogueChoice[]
  isTerminal?: boolean
}

export interface BranchingDialogueCharacter {
  id: string
  name: string
  role?: string
}

export interface BranchingDialogueProps {
  setting: string
  characters?: BranchingDialogueCharacter[]
  startNodeId: string
  nodes: BranchingDialogueNode[]
}

export interface BranchingDialogueChoiceRecord {
  nodeId: string
  choiceId: string
  pragmaticRating: PragmaticRating
  grammaticalRating: GrammaticalRating
}

export function isDecisionNode(node: BranchingDialogueNode): boolean {
  return !node.isTerminal && node.choices.length >= 2
}

export function countDecisionNodes(nodes: BranchingDialogueNode[]): number {
  return nodes.filter(isDecisionNode).length
}

export function getDecisionNodeIds(props: BranchingDialogueProps): string[] {
  const nodeMap = new Map(props.nodes.map((node) => [node.id, node]))
  const visited = new Set<string>()
  const ordered: string[] = []
  const queue = [props.startNodeId]

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (!nodeId || visited.has(nodeId)) continue
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) continue

    if (isDecisionNode(node)) {
      ordered.push(node.id)
    }

    for (const choice of node.choices) {
      if (!visited.has(choice.nextNodeId)) {
        queue.push(choice.nextNodeId)
      }
    }
  }

  return ordered
}

export function findNode(props: BranchingDialogueProps, nodeId: string): BranchingDialogueNode | undefined {
  return props.nodes.find((node) => node.id === nodeId)
}

export function isWeakChoice(choice: Pick<BranchingDialogueChoice, 'pragmaticRating' | 'grammaticalRating'>): boolean {
  const grammatical = choice.grammaticalRating ?? 'correct'
  return choice.pragmaticRating !== 'optimal' || grammatical === 'incorrect'
}

export function computeBranchingDialogueScores(choicesMade: BranchingDialogueChoiceRecord[]) {
  if (choicesMade.length === 0) {
    return { pragmaticScore: 0, grammaticalScore: 0, scorePercent: 0 }
  }

  const pragmaticTotal = choicesMade.reduce((sum, choice) => {
    if (choice.pragmaticRating === 'optimal') return sum + 100
    if (choice.pragmaticRating === 'acceptable') return sum + 50
    return sum
  }, 0)

  const grammaticalTotal = choicesMade.reduce((sum, choice) => (
    sum + (choice.grammaticalRating === 'correct' ? 100 : 0)
  ), 0)

  const count = choicesMade.length
  const pragmaticScore = Math.round(pragmaticTotal / count)
  const grammaticalScore = Math.round(grammaticalTotal / count)
  const scorePercent = Math.round(pragmaticScore * 0.7 + grammaticalScore * 0.3)

  return { pragmaticScore, grammaticalScore, scorePercent }
}
