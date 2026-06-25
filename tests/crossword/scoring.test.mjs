import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateScore, createEmptyStats, updateStats } from '../../src/features/crossword/services/scoring.js'

const puzzle = {
  cells: Array.from({ length: 20 }, (_, index) => ({ key: `0,${index}` }))
}

test('score excludes revealed cells and applies the difficulty multiplier', () => {
  const result = calculateScore({
    puzzle,
    revealedCells: { '0,1': true, '0,2': true },
    difficultyId: 'normal'
  })

  assert.equal(result.baseScore, 180)
  assert.equal(result.multiplier, 1.5)
  assert.equal(result.perfect, false)
  assert.equal(result.score, 270)
})

test('a puzzle without reveals receives the perfect bonus', () => {
  const result = calculateScore({ puzzle, revealedCells: {}, difficultyId: 'hard' })

  assert.equal(result.perfect, true)
  assert.equal(result.bonus, 200)
  assert.equal(result.score, 800)
})

test('statistics keep best scores and fastest times', () => {
  const first = updateStats(createEmptyStats(), {
    difficulty: 'easy',
    score: 300,
    elapsedSeconds: 120,
    perfect: true
  })
  const second = updateStats(first, {
    difficulty: 'easy',
    score: 250,
    elapsedSeconds: 90,
    perfect: false
  })

  assert.equal(second.completed, 2)
  assert.equal(second.perfect, 1)
  assert.equal(second.bestScores.easy, 300)
  assert.equal(second.bestTimes.easy, 90)
})
