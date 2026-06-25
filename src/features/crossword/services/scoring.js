import { CROSSWORD_CONFIG } from '../data/gameConfig.js'

// Score Calculation | Rewards correct unrevealed cells without adding a time penalty
export function calculateScore({ puzzle, revealedCells = {}, difficultyId }) {
  const multiplier = CROSSWORD_CONFIG.score.multipliers[difficultyId] ?? 1
  const unrevealedCells = puzzle.cells.filter((cell) => !revealedCells[cell.key]).length
  const baseScore = unrevealedCells * CROSSWORD_CONFIG.score.pointsPerCell
  const perfect = unrevealedCells === puzzle.cells.length
  const bonus = perfect ? CROSSWORD_CONFIG.score.perfectBonus : 0

  return {
    baseScore,
    multiplier,
    perfect,
    bonus,
    score: Math.round((baseScore + bonus) * multiplier)
  }
}

export function createEmptyStats() {
  return {
    completed: 0,
    perfect: 0,
    totalScore: 0,
    bestScores: {
      easy: 0,
      normal: 0,
      hard: 0
    },
    bestTimes: {
      easy: null,
      normal: null,
      hard: null
    },
    lastResult: null
  }
}

export function updateStats(currentStats, result) {
  const stats = {
    ...createEmptyStats(),
    ...currentStats,
    bestScores: { ...createEmptyStats().bestScores, ...currentStats?.bestScores },
    bestTimes: { ...createEmptyStats().bestTimes, ...currentStats?.bestTimes }
  }

  const currentBestTime = stats.bestTimes[result.difficulty]

  return {
    ...stats,
    completed: stats.completed + 1,
    perfect: stats.perfect + (result.perfect ? 1 : 0),
    totalScore: stats.totalScore + result.score,
    bestScores: {
      ...stats.bestScores,
      [result.difficulty]: Math.max(stats.bestScores[result.difficulty] ?? 0, result.score)
    },
    bestTimes: {
      ...stats.bestTimes,
      [result.difficulty]: currentBestTime === null
        ? result.elapsedSeconds
        : Math.min(currentBestTime, result.elapsedSeconds)
    },
    lastResult: result
  }
}
