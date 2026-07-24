export function scoreToPercent(score: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

export function passesThreshold(percent: number, threshold = 70): boolean {
  return percent >= threshold
}

export function starsFromPercent(percent: number): number {
  if (percent >= 90) return 3
  if (percent >= 70) return 2
  if (percent >= 50) return 1
  return 0
}

export function wordMatchAccuracy(correct: number, total: number): number {
  return scoreToPercent(correct, total)
}

export function flashcardCoverage(reviewed: number, total: number): number {
  return scoreToPercent(reviewed, total)
}
