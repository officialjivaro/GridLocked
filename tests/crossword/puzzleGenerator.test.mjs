import assert from 'node:assert/strict'
import test from 'node:test'
import { DIFFICULTIES } from '../../src/features/crossword/data/gameConfig.js'
import { TOPICS } from '../../src/features/crossword/data/topics.js'
import { generatePuzzle } from '../../src/features/crossword/services/puzzleGenerator.js'
import { getEligibleWords } from '../../src/features/crossword/services/wordRepository.js'
import { loadTestWords } from './testHelpers.mjs'

function assertValidPuzzle(puzzle, difficulty) {
  assert.ok(puzzle.entries.length >= difficulty.minimumWords)
  assert.ok(puzzle.entries.length <= difficulty.targetWords)
  assert.ok(puzzle.rows <= difficulty.maxGridSize)
  assert.ok(puzzle.cols <= difficulty.maxGridSize)
  assert.equal(new Set(puzzle.cells.map((cell) => cell.key)).size, puzzle.cells.length)

  const cells = new Map(puzzle.cells.map((cell) => [cell.key, cell]))

  for (const entry of puzzle.entries) {
    assert.equal(entry.cells.length, entry.answer.length)
    assert.ok(entry.cells.every((key) => cells.has(key)))
    assert.ok(
      entry.cells.some((key) => cells.get(key).entryIds.length === 2),
      `${entry.answer} does not intersect another entry`
    )

    entry.cells.forEach((key, index) => {
      assert.equal(cells.get(key).solution, entry.answer[index])
    })
  }
}

test('the same seed produces the same puzzle', async () => {
  const words = await loadTestWords()
  const options = { words, topicId: 'science', difficultyId: 'normal', seed: 'repeatable-seed' }

  assert.deepEqual(generatePuzzle(options), generatePuzzle(options))
})

test('available topic and difficulty combinations produce connected puzzles', async () => {
  const words = await loadTestWords()

  for (const topic of TOPICS) {
    for (const [difficultyId, difficulty] of Object.entries(DIFFICULTIES)) {
      const eligible = getEligibleWords(words, topic.id, difficultyId)
      if (eligible.length < difficulty.minimumWords) {
        continue
      }

      const puzzle = generatePuzzle({
        words,
        topicId: topic.id,
        difficultyId,
        seed: `${topic.id}-${difficultyId}-test`
      })

      assertValidPuzzle(puzzle, difficulty)
      if (topic.id !== 'all') {
        assert.ok(puzzle.entries.every((entry) => entry.topics.includes(topic.id)))
      }
    }
  }
})
