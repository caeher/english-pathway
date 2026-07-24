import { describe, expect, it } from 'vitest'
import {
  computeBranchingDialogueScores,
  countDecisionNodes,
  getDecisionNodeIds,
  isWeakChoice,
} from '@/features/activities/branching-dialogue'

const sampleProps = {
  setting: 'Office',
  startNodeId: 'n1',
  nodes: [
    {
      id: 'n1',
      intention: 'Greet',
      prompt: 'Hello',
      choices: [
        { id: 'a', text: 'Hi', nextNodeId: 'n2', pragmaticRating: 'optimal' as const, explanation: 'Good' },
        { id: 'b', text: 'Yo', nextNodeId: 'n2', pragmaticRating: 'inappropriate' as const, explanation: 'Too casual' },
      ],
    },
    {
      id: 'n2',
      intention: 'Close',
      prompt: 'Bye',
      choices: [
        { id: 'c', text: 'See you', nextNodeId: 'end', pragmaticRating: 'optimal' as const, explanation: 'Polite' },
        { id: 'd', text: 'Later', nextNodeId: 'end', pragmaticRating: 'acceptable' as const, grammaticalRating: 'incorrect' as const, explanation: 'Informal' },
      ],
    },
    { id: 'end', intention: 'Done', prompt: 'Finished', isTerminal: true, choices: [] },
  ],
}

describe('branching dialogue helpers', () => {
  it('counts and orders decision nodes from the start node', () => {
    expect(countDecisionNodes(sampleProps.nodes)).toBe(2)
    expect(getDecisionNodeIds(sampleProps)).toEqual(['n1', 'n2'])
  })

  it('flags weak choices by pragmatic or grammatical ratings', () => {
    expect(isWeakChoice({ pragmaticRating: 'optimal', grammaticalRating: 'correct' })).toBe(false)
    expect(isWeakChoice({ pragmaticRating: 'acceptable', grammaticalRating: 'correct' })).toBe(true)
    expect(isWeakChoice({ pragmaticRating: 'optimal', grammaticalRating: 'incorrect' })).toBe(true)
  })

  it('computes dual pragmatic and grammatical scores', () => {
    const scores = computeBranchingDialogueScores([
      { nodeId: 'n1', choiceId: 'a', pragmaticRating: 'optimal', grammaticalRating: 'correct' },
      { nodeId: 'n2', choiceId: 'd', pragmaticRating: 'acceptable', grammaticalRating: 'incorrect' },
    ])

    expect(scores.pragmaticScore).toBe(75)
    expect(scores.grammaticalScore).toBe(50)
    expect(scores.scorePercent).toBe(68)
  })
})
