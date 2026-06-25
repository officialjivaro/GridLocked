import { DIFFICULTIES, CROSSWORD_CONFIG } from '../data/gameConfig.js'
import { getEligibleWords } from './wordRepository.js'
import { applyPlacement, canPlaceWord, cellKey, getGridBounds } from '../utils/gridRules.js'
import { createSeededRandom, randomItem, shuffle } from '../utils/seededRandom.js'

function buildLetterFrequency(records) {
  const frequency = new Map()

  for (const record of records) {
    for (const letter of new Set(record.normalizedAnswer)) {
      frequency.set(letter, (frequency.get(letter) ?? 0) + 1)
    }
  }

  return frequency
}

function rankCandidates(records, random) {
  const frequency = buildLetterFrequency(records)

  return records
    .map((record) => {
      const crossability = [...record.normalizedAnswer]
        .reduce((total, letter) => total + (frequency.get(letter) ?? 0), 0)
      const lengthPreference = Math.min(record.normalizedAnswer.length, 10) * 3

      return {
        record,
        priority: crossability + lengthPreference + random() * 18
      }
    })
    .sort((left, right) => right.priority - left.priority)
    .map(({ record }) => record)
}

function findPlacementsForEntry(grid, entry, maxGridSize, random) {
  const placements = []
  const seen = new Set()
  const currentBounds = getGridBounds(grid)

  for (let letterIndex = 0; letterIndex < entry.normalizedAnswer.length; letterIndex += 1) {
    const letter = entry.normalizedAnswer[letterIndex]

    for (const gridCell of grid.values()) {
      if (gridCell.letter !== letter) {
        continue
      }

      const availableDirections = []
      if (gridCell.across && !gridCell.down) {
        availableDirections.push('down')
      }
      if (gridCell.down && !gridCell.across) {
        availableDirections.push('across')
      }

      for (const direction of availableDirections) {
        const startRow = gridCell.row - (direction === 'down' ? letterIndex : 0)
        const startCol = gridCell.col - (direction === 'across' ? letterIndex : 0)
        const signature = `${startRow}:${startCol}:${direction}`

        if (seen.has(signature)) {
          continue
        }
        seen.add(signature)

        const validation = canPlaceWord({
          grid,
          answer: entry.normalizedAnswer,
          startRow,
          startCol,
          direction,
          maxGridSize
        })

        if (!validation.valid) {
          continue
        }

        const areaIncrease = validation.bounds.area - currentBounds.area
        const centerRow = (validation.bounds.minRow + validation.bounds.maxRow) / 2
        const centerCol = (validation.bounds.minCol + validation.bounds.maxCol) / 2
        const centerPenalty = Math.abs(centerRow) + Math.abs(centerCol)
        const shapePenalty = Math.abs(validation.bounds.rows - validation.bounds.cols)
        const score = (
          validation.intersections * 140
          + validation.newCells * 4
          - areaIncrease * 2.5
          - centerPenalty * 2
          - shapePenalty
          + random() * 24
        )

        placements.push({
          entry,
          startRow,
          startCol,
          direction,
          intersections: validation.intersections,
          score
        })
      }
    }
  }

  return placements
}

function chooseStartingEntry(candidates, random) {
  const suitable = candidates
    .filter((entry) => entry.normalizedAnswer.length >= 5)
    .slice(0, 12)

  return randomItem(suitable.length ? suitable : candidates.slice(0, 12), random)
}

function buildAttempt(records, difficulty, seed, attemptIndex) {
  const random = createSeededRandom(`${seed}:attempt:${attemptIndex}`)
  const ranked = rankCandidates(shuffle(records, random), random)
    .slice(0, CROSSWORD_CONFIG.candidatePoolSize)
  const startingEntry = chooseStartingEntry(ranked, random)

  if (!startingEntry) {
    return null
  }

  const grid = new Map()
  const placedEntries = []
  const startCol = -Math.floor(startingEntry.normalizedAnswer.length / 2)

  applyPlacement(
    grid,
    startingEntry.id,
    startingEntry.normalizedAnswer,
    0,
    startCol,
    'across'
  )

  placedEntries.push({
    ...startingEntry,
    direction: 'across',
    startRow: 0,
    startCol,
    intersections: 0
  })

  const remaining = ranked.filter((entry) => entry.id !== startingEntry.id)

  while (placedEntries.length < difficulty.targetWords && remaining.length) {
    const possiblePlacements = []

    for (const entry of remaining) {
      possiblePlacements.push(
        ...findPlacementsForEntry(grid, entry, difficulty.maxGridSize, random)
      )
    }

    if (!possiblePlacements.length) {
      break
    }

    possiblePlacements.sort((left, right) => right.score - left.score)
    const shortlistSize = Math.min(5, possiblePlacements.length)
    const placement = possiblePlacements[Math.floor(random() * shortlistSize)]

    applyPlacement(
      grid,
      placement.entry.id,
      placement.entry.normalizedAnswer,
      placement.startRow,
      placement.startCol,
      placement.direction
    )

    placedEntries.push({
      ...placement.entry,
      direction: placement.direction,
      startRow: placement.startRow,
      startCol: placement.startCol,
      intersections: placement.intersections
    })

    const placedIndex = remaining.findIndex((entry) => entry.id === placement.entry.id)
    if (placedIndex >= 0) {
      remaining.splice(placedIndex, 1)
    }
  }

  const bounds = getGridBounds(grid)
  const crossingCells = [...grid.values()].filter((cell) => cell.across && cell.down).length
  const acrossCount = placedEntries.filter((entry) => entry.direction === 'across').length
  const downCount = placedEntries.length - acrossCount
  const layoutScore = (
    placedEntries.length * 10000
    + crossingCells * 180
    + Math.min(acrossCount, downCount) * 40
    - bounds.area * 3
    - Math.abs(bounds.rows - bounds.cols) * 5
  )

  return { grid, placedEntries, bounds, crossingCells, layoutScore }
}

function finalizePuzzle(attempt, { seed, topicId, difficultyId }) {
  const { grid, placedEntries, bounds, crossingCells } = attempt
  const rowOffset = -bounds.minRow
  const colOffset = -bounds.minCol
  const startCells = placedEntries
    .map((entry) => ({
      key: cellKey(entry.startRow + rowOffset, entry.startCol + colOffset),
      row: entry.startRow + rowOffset,
      col: entry.startCol + colOffset
    }))
    .sort((left, right) => left.row - right.row || left.col - right.col)

  const numberByStart = new Map()
  let nextNumber = 1

  for (const start of startCells) {
    if (!numberByStart.has(start.key)) {
      numberByStart.set(start.key, nextNumber)
      nextNumber += 1
    }
  }

  const entries = placedEntries
    .map((entry) => {
      const row = entry.startRow + rowOffset
      const col = entry.startCol + colOffset
      const stepRow = entry.direction === 'down' ? 1 : 0
      const stepCol = entry.direction === 'across' ? 1 : 0
      const cells = [...entry.normalizedAnswer].map((_, index) => (
        cellKey(row + stepRow * index, col + stepCol * index)
      ))

      return {
        id: entry.id,
        answer: entry.normalizedAnswer,
        displayAnswer: entry.answer,
        clue: entry.clue,
        topics: [...entry.topics],
        wordDifficulty: entry.difficulty,
        direction: entry.direction,
        row,
        col,
        number: numberByStart.get(cellKey(row, col)),
        length: entry.normalizedAnswer.length,
        cells
      }
    })
    .sort((left, right) => left.number - right.number || left.direction.localeCompare(right.direction))

  const cells = [...grid.values()]
    .map((cell) => {
      const row = cell.row + rowOffset
      const col = cell.col + colOffset
      const key = cellKey(row, col)
      return {
        key,
        row,
        col,
        solution: cell.letter,
        number: numberByStart.get(key) ?? null,
        acrossEntryId: cell.across,
        downEntryId: cell.down,
        entryIds: [cell.across, cell.down].filter(Boolean)
      }
    })
    .sort((left, right) => left.row - right.row || left.col - right.col)

  return {
    id: `${topicId}-${difficultyId}-${seed}`,
    seed,
    topicId,
    difficultyId,
    rows: bounds.rows,
    cols: bounds.cols,
    crossingCells,
    cells,
    entries,
    acrossEntries: entries.filter((entry) => entry.direction === 'across'),
    downEntries: entries.filter((entry) => entry.direction === 'down')
  }
}

// Puzzle Generation | Tries multiple deterministic layouts and keeps the strongest valid result
export function generatePuzzle({ words, topicId = 'all', difficultyId = 'normal', seed }) {
  const difficulty = DIFFICULTIES[difficultyId]
  if (!difficulty) {
    throw new Error(`Unknown difficulty: ${difficultyId}`)
  }

  const eligibleWords = getEligibleWords(words, topicId, difficultyId)
  if (eligibleWords.length < difficulty.minimumWords) {
    throw new Error('There are not enough words for this topic and difficulty yet.')
  }

  let bestAttempt = null

  for (let attemptIndex = 0; attemptIndex < CROSSWORD_CONFIG.generatorAttempts; attemptIndex += 1) {
    const attempt = buildAttempt(eligibleWords, difficulty, seed, attemptIndex)

    if (!attempt) {
      continue
    }

    if (!bestAttempt || attempt.layoutScore > bestAttempt.layoutScore) {
      bestAttempt = attempt
    }

    if (
      attempt.placedEntries.length >= difficulty.targetWords
      && attempt.crossingCells >= Math.max(2, Math.floor(difficulty.targetWords * 0.7))
    ) {
      break
    }
  }

  if (!bestAttempt || bestAttempt.placedEntries.length < difficulty.minimumWords) {
    throw new Error('A connected puzzle could not be generated from this word selection. Try a new puzzle.')
  }

  return finalizePuzzle(bestAttempt, { seed, topicId, difficultyId })
}
