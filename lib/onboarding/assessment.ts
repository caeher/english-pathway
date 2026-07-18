import { z } from 'zod'

export const ASSESSMENT_VERSION = 'cefr-v1'

export const assessmentLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
export const assessmentSourceSchema = z.enum(['voice', 'text', 'self_assessment'])

export const ASSESSMENT_QUESTIONS = [
  { id: 'introduction', prompt: 'Introduce yourself and describe a typical day.' },
  { id: 'experience', prompt: 'Tell us about something you did recently and how it went.' },
  { id: 'opinion', prompt: 'What is one skill you want to improve, and why?' },
] as const

export const assessmentAnswerSchema = z.object({
  questionId: z.enum(['introduction', 'experience', 'opinion']),
  response: z.string().trim().min(3).max(1000),
})

export const assessmentAnswersSchema = z.array(assessmentAnswerSchema).length(3)

export type AssessmentLevel = z.infer<typeof assessmentLevelSchema>
export type AssessmentSource = z.infer<typeof assessmentSourceSchema>
export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>

export interface AssessmentResult {
  level: AssessmentLevel
  score: number
  rubricVersion: string
  explanation: string[]
}

function scoreResponse(response: string): { vocabulary: number; grammar: number; fluency: number } {
  const words = response.split(/\s+/).filter(Boolean)
  const uniqueWords = new Set(words.map((word) => word.toLowerCase().replace(/[^a-z']/g, ''))).size
  const connectors = (response.match(/\b(and|but|because|so|although|however|when|then)\b/gi) ?? []).length
  const sentenceMarkers = (response.match(/[.!?]/g) ?? []).length

  return {
    vocabulary: Math.min(4, Math.max(0, Math.floor(uniqueWords / 12))),
    grammar: Math.min(4, Math.max(0, sentenceMarkers + (response.includes("'") ? 1 : 0))),
    fluency: Math.min(4, Math.max(0, Math.floor(words.length / 18) + Math.min(connectors, 2))),
  }
}

export function evaluateAssessment(answers: AssessmentAnswer[]): AssessmentResult {
  const totals = answers.reduce(
    (result, answer) => {
      const score = scoreResponse(answer.response)
      return {
        vocabulary: result.vocabulary + score.vocabulary,
        grammar: result.grammar + score.grammar,
        fluency: result.fluency + score.fluency,
      }
    },
    { vocabulary: 0, grammar: 0, fluency: 0 },
  )
  const score = Number(((totals.vocabulary + totals.grammar + totals.fluency) / 9).toFixed(2))
  const level: AssessmentLevel = score < 1.35 ? 'beginner' : score < 2.6 ? 'intermediate' : 'advanced'

  return {
    level,
    score,
    rubricVersion: ASSESSMENT_VERSION,
    explanation: [
      `Vocabulary range: ${totals.vocabulary}/12`,
      `Grammar control: ${totals.grammar}/12`,
      `Fluency and connections: ${totals.fluency}/12`,
    ],
  }
}
