export type PronunciationWordStatus = 'correct' | 'incorrect' | 'missing'

export interface PronunciationWordComparison {
  target: string
  spoken?: string
  status: PronunciationWordStatus
}

export interface PronunciationScore {
  percent: number
  distance: number
  words: PronunciationWordComparison[]
  extraWords: string[]
}

const CONTRACTIONS: Record<string, string> = {
  "can't": 'cannot',
  "couldn't": 'could not',
  "didn't": 'did not',
  "doesn't": 'does not',
  "don't": 'do not',
  "aren't": 'are not',
  "i'd": 'i would',
  "i'll": 'i will',
  "i'm": 'i am',
  "i've": 'i have',
  "isn't": 'is not',
  "it's": 'it is',
  "shouldn't": 'should not',
  "that's": 'that is',
  "there's": 'there is',
  "they're": 'they are',
  "we're": 'we are',
  "weren't": 'were not',
  "won't": 'will not',
  "wouldn't": 'would not',
  "you're": 'you are',
}

export function normalizePronunciationText(text: string): string[] {
  let normalized = text.toLocaleLowerCase().replace(/[’']/g, "'")

  for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${contraction}\\b`, 'g'), expansion)
  }

  return normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function scorePronunciation(spoken: string, target: string): PronunciationScore {
  const spokenWords = normalizePronunciationText(spoken)
  const targetWords = normalizePronunciationText(target)
  const rows = targetWords.length + 1
  const columns = spokenWords.length + 1
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
  )

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost = targetWords[row - 1] === spokenWords[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      )
    }
  }

  const words: PronunciationWordComparison[] = []
  const extraWords: string[] = []
  let row = targetWords.length
  let column = spokenWords.length

  while (row > 0 || column > 0) {
    if (
      row > 0 &&
      column > 0 &&
      matrix[row][column] === matrix[row - 1][column - 1] + (targetWords[row - 1] === spokenWords[column - 1] ? 0 : 1)
    ) {
      words.unshift({
        target: targetWords[row - 1],
        spoken: spokenWords[column - 1],
        status: targetWords[row - 1] === spokenWords[column - 1] ? 'correct' : 'incorrect',
      })
      row -= 1
      column -= 1
    } else if (row > 0 && matrix[row][column] === matrix[row - 1][column] + 1) {
      words.unshift({ target: targetWords[row - 1], status: 'missing' })
      row -= 1
    } else {
      extraWords.unshift(spokenWords[column - 1])
      column -= 1
    }
  }

  const denominator = Math.max(targetWords.length, spokenWords.length)
  const distance = matrix[targetWords.length][spokenWords.length]
  const percent = denominator === 0 ? 0 : Math.max(0, Math.round(((denominator - distance) / denominator) * 100))

  return { percent, distance, words, extraWords }
}
