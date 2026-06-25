import { computed, onBeforeUnmount, ref } from 'vue'
import { DIFFICULTIES } from '../data/gameConfig.js'
import { generatePuzzle } from '../services/puzzleGenerator.js'
import {
  clearActiveGame,
  loadActiveGame,
  loadStats,
  saveActiveGame,
  saveStats
} from '../services/gameStorage.js'
import { calculateScore, updateStats } from '../services/scoring.js'
import { playCrosswordSound } from '../services/soundService.js'
import { findNewlyCompletedEntries } from '../utils/entryCompletion.js'
import { cellKey } from '../utils/gridRules.js'
import { normalizePlayerLetter } from '../utils/normalizeAnswer.js'
import { createPuzzleSeed } from '../utils/seededRandom.js'
import { useGameTimer } from './useGameTimer.js'

// Crossword State | Coordinates generation, input, assistance, saving, and completion
export function useCrosswordGame({ words, settings }) {
  const phase = ref('setup')
  const puzzle = ref(null)
  const playerLetters = ref({})
  const checkedCells = ref({})
  const incorrectCells = ref({})
  const revealedCells = ref({})
  const selection = ref(null)
  const undoStack = ref([])
  const checkCount = ref(0)
  const completionResult = ref(null)
  const errorMessage = ref('')
  const isGenerating = ref(false)
  const stats = ref(loadStats())
  const savedGame = ref(loadActiveGame())
  const hasSavedGame = computed(() => Boolean(savedGame.value))
  const completedEntryIds = ref(new Set())
  let completionAnimationTimer = null

  const timer = useGameTimer({ onPersist: persistGame })

  const cellsByKey = computed(() => new Map(
    (puzzle.value?.cells ?? []).map((cell) => [cell.key, cell])
  ))

  const entriesById = computed(() => new Map(
    (puzzle.value?.entries ?? []).map((entry) => [entry.id, entry])
  ))

  const selectedCell = computed(() => (
    selection.value ? cellsByKey.value.get(selection.value.key) ?? null : null
  ))

  const activeEntry = computed(() => (
    selection.value ? entriesById.value.get(selection.value.entryId) ?? null : null
  ))

  const activeCellKeys = computed(() => new Set(activeEntry.value?.cells ?? []))
  const revealCount = computed(() => Object.keys(revealedCells.value).length)

  const filledCellCount = computed(() => {
    if (!puzzle.value) {
      return 0
    }

    return puzzle.value.cells.reduce(
      (count, cell) => count + (playerLetters.value[cell.key] ? 1 : 0),
      0
    )
  })

  const progressPercent = computed(() => {
    const total = puzzle.value?.cells.length ?? 0
    return total ? Math.round((filledCellCount.value / total) * 100) : 0
  })

  function clearEntryCelebration() {
    if (completionAnimationTimer !== null) {
      globalThis.clearTimeout(completionAnimationTimer)
      completionAnimationTimer = null
    }
    completedEntryIds.value = new Set()
  }

  function celebrateEntries(entryIds) {
    clearEntryCelebration()
    if (!entryIds.length || settings.reducedMotion) {
      return
    }

    completedEntryIds.value = new Set(entryIds)
    completionAnimationTimer = globalThis.setTimeout(() => {
      completedEntryIds.value = new Set()
      completionAnimationTimer = null
    }, 850)
  }

  function makeSelection(key, direction) {
    const cell = cellsByKey.value.get(key)
    if (!cell) {
      return null
    }

    const directionId = direction === 'down' ? cell.downEntryId : cell.acrossEntryId
    if (!directionId) {
      const fallbackDirection = cell.acrossEntryId ? 'across' : 'down'
      return {
        key,
        row: cell.row,
        col: cell.col,
        direction: fallbackDirection,
        entryId: fallbackDirection === 'across' ? cell.acrossEntryId : cell.downEntryId
      }
    }

    return {
      key,
      row: cell.row,
      col: cell.col,
      direction,
      entryId: directionId
    }
  }

  function selectCell(key, preferredDirection = null) {
    const cell = cellsByKey.value.get(key)
    if (!cell) {
      return
    }

    const hasAcross = Boolean(cell.acrossEntryId)
    const hasDown = Boolean(cell.downEntryId)
    let direction = preferredDirection

    if (hasAcross && hasDown) {
      if (!direction) {
        if (selection.value?.key === key) {
          direction = selection.value.direction === 'across' ? 'down' : 'across'
        } else if (selection.value?.direction === 'down') {
          direction = 'down'
        } else {
          direction = 'across'
        }
      }
    } else {
      direction = hasAcross ? 'across' : 'down'
    }

    selection.value = makeSelection(key, direction)
    persistGame()
  }

  function selectEntry(entryId, preferEmpty = true) {
    const entry = entriesById.value.get(entryId)
    if (!entry) {
      return
    }

    const targetKey = preferEmpty
      ? entry.cells.find((key) => !playerLetters.value[key]) ?? entry.cells[0]
      : entry.cells[0]

    selection.value = makeSelection(targetKey, entry.direction)
    persistGame()
  }

  function selectInitialCell() {
    const firstEntry = puzzle.value?.entries?.[0]
    if (firstEntry) {
      selection.value = makeSelection(firstEntry.cells[0], firstEntry.direction)
    }
  }

  function moveWithinEntry(offset) {
    const entry = activeEntry.value
    if (!entry || !selection.value) {
      return
    }

    const currentIndex = entry.cells.indexOf(selection.value.key)
    const nextIndex = currentIndex + offset

    if (nextIndex >= 0 && nextIndex < entry.cells.length) {
      selection.value = makeSelection(entry.cells[nextIndex], entry.direction)
      return
    }

    if (offset > 0) {
      const sameDirection = puzzle.value.entries.filter((item) => item.direction === entry.direction)
      const entryIndex = sameDirection.findIndex((item) => item.id === entry.id)
      const nextEntry = sameDirection[(entryIndex + 1) % sameDirection.length]
      const nextKey = nextEntry.cells.find((key) => !playerLetters.value[key]) ?? nextEntry.cells[0]
      selection.value = makeSelection(nextKey, nextEntry.direction)
    }
  }

  function moveSelectionBy(rowDelta, colDelta) {
    if (!selection.value || !puzzle.value) {
      return
    }

    let row = selection.value.row + rowDelta
    let col = selection.value.col + colDelta

    while (row >= 0 && col >= 0 && row < puzzle.value.rows && col < puzzle.value.cols) {
      const key = cellKey(row, col)
      if (cellsByKey.value.has(key)) {
        selectCell(key, selection.value.direction)
        return
      }

      row += rowDelta
      col += colDelta
    }
  }

  function toggleDirection() {
    const cell = selectedCell.value
    if (!cell?.acrossEntryId || !cell?.downEntryId) {
      return
    }

    selectCell(
      selection.value.key,
      selection.value.direction === 'across' ? 'down' : 'across'
    )
  }

  function rememberEdit(key, nextLetter) {
    undoStack.value.push({
      key,
      previousLetter: playerLetters.value[key] ?? '',
      nextLetter,
      previousChecked: Boolean(checkedCells.value[key]),
      previousIncorrect: Boolean(incorrectCells.value[key])
    })

    if (undoStack.value.length > 100) {
      undoStack.value.shift()
    }
  }

  function setLetter(key, letter) {
    playerLetters.value = { ...playerLetters.value, [key]: letter }

    const nextChecked = { ...checkedCells.value }
    const nextIncorrect = { ...incorrectCells.value }
    delete nextChecked[key]
    delete nextIncorrect[key]

    if (
      puzzle.value?.difficultyId === 'easy'
      && settings.easyAutoCheck
      && letter
      && cellsByKey.value.get(key)?.solution !== letter
    ) {
      nextChecked[key] = true
      nextIncorrect[key] = true
    }

    checkedCells.value = nextChecked
    incorrectCells.value = nextIncorrect
  }

  function inputLetter(value) {
    const letter = normalizePlayerLetter(value)
    const key = selection.value?.key
    if (!letter || !key || revealedCells.value[key]) {
      return
    }

    const previousLetters = playerLetters.value
    rememberEdit(key, letter)
    setLetter(key, letter)

    const newlyCompleted = findNewlyCompletedEntries({
      entries: puzzle.value?.entries ?? [],
      previousLetters,
      nextLetters: playerLetters.value
    })
    const isWrong = cellsByKey.value.get(key)?.solution !== letter

    if (isPuzzleComplete()) {
      clearEntryCelebration()
      checkForCompletion()
      return
    }

    if (newlyCompleted.length) {
      celebrateEntries(newlyCompleted)
      playCrosswordSound('word-complete', settings.soundEnabled)
    } else {
      playCrosswordSound(
        isWrong && puzzle.value.difficultyId === 'easy' && settings.easyAutoCheck ? 'error' : 'input',
        settings.soundEnabled
      )
    }

    moveWithinEntry(1)
    persistGame()
  }

  function deleteLetter() {
    const key = selection.value?.key
    if (!key) {
      return
    }

    if (playerLetters.value[key] && !revealedCells.value[key]) {
      rememberEdit(key, '')
      setLetter(key, '')
    } else {
      moveWithinEntry(-1)
    }

    persistGame()
  }

  function undo() {
    const edit = undoStack.value.pop()
    if (!edit || revealedCells.value[edit.key]) {
      return
    }

    playerLetters.value = { ...playerLetters.value, [edit.key]: edit.previousLetter }
    checkedCells.value = { ...checkedCells.value, [edit.key]: edit.previousChecked }
    incorrectCells.value = { ...incorrectCells.value, [edit.key]: edit.previousIncorrect }

    if (!edit.previousChecked) {
      const next = { ...checkedCells.value }
      delete next[edit.key]
      checkedCells.value = next
    }
    if (!edit.previousIncorrect) {
      const next = { ...incorrectCells.value }
      delete next[edit.key]
      incorrectCells.value = next
    }

    const cell = cellsByKey.value.get(edit.key)
    if (cell) {
      selection.value = makeSelection(edit.key, selection.value?.direction ?? 'across')
    }

    persistGame()
  }

  function checkKeys(keys) {
    if (!puzzle.value) {
      return
    }

    const nextChecked = { ...checkedCells.value }
    const nextIncorrect = { ...incorrectCells.value }
    let wrongCount = 0

    for (const key of keys) {
      const letter = playerLetters.value[key]
      if (!letter) {
        continue
      }

      nextChecked[key] = true
      if (letter !== cellsByKey.value.get(key)?.solution) {
        nextIncorrect[key] = true
        wrongCount += 1
      } else {
        delete nextIncorrect[key]
      }
    }

    checkedCells.value = nextChecked
    incorrectCells.value = nextIncorrect
    checkCount.value += 1
    playCrosswordSound(wrongCount ? 'error' : 'input', settings.soundEnabled)
    persistGame()
  }

  function checkCell() {
    if (selection.value) {
      checkKeys([selection.value.key])
    }
  }

  function checkWord() {
    if (activeEntry.value) {
      checkKeys(activeEntry.value.cells)
    }
  }

  function checkPuzzle() {
    checkKeys(puzzle.value?.cells.map((cell) => cell.key) ?? [])
  }

  function revealKeys(keys) {
    const nextLetters = { ...playerLetters.value }
    const nextRevealed = { ...revealedCells.value }
    const nextChecked = { ...checkedCells.value }
    const nextIncorrect = { ...incorrectCells.value }
    let changed = false

    for (const key of keys) {
      const solution = cellsByKey.value.get(key)?.solution
      if (!solution) {
        continue
      }

      if (!nextRevealed[key] || nextLetters[key] !== solution) {
        changed = true
      }

      nextLetters[key] = solution
      nextRevealed[key] = true
      nextChecked[key] = true
      delete nextIncorrect[key]
    }

    if (!changed) {
      return
    }

    playerLetters.value = nextLetters
    revealedCells.value = nextRevealed
    checkedCells.value = nextChecked
    incorrectCells.value = nextIncorrect
    clearEntryCelebration()

    if (isPuzzleComplete()) {
      checkForCompletion()
      return
    }

    playCrosswordSound('reveal', settings.soundEnabled)
    persistGame()
  }

  function revealLetter() {
    if (selection.value) {
      revealKeys([selection.value.key])
    }
  }

  function revealWord() {
    if (activeEntry.value) {
      revealKeys(activeEntry.value.cells)
    }
  }

  function revealPuzzle() {
    revealKeys(puzzle.value?.cells.map((cell) => cell.key) ?? [])
  }

  function isPuzzleComplete() {
    return Boolean(
      puzzle.value?.cells.length
      && puzzle.value.cells.every((cell) => playerLetters.value[cell.key] === cell.solution)
    )
  }

  function checkForCompletion() {
    if (!isPuzzleComplete()) {
      return false
    }

    timer.pause()
    const scoreDetails = calculateScore({
      puzzle: puzzle.value,
      revealedCells: revealedCells.value,
      difficultyId: puzzle.value.difficultyId
    })

    const result = {
      puzzleId: puzzle.value.id,
      topicId: puzzle.value.topicId,
      difficulty: puzzle.value.difficultyId,
      difficultyLabel: DIFFICULTIES[puzzle.value.difficultyId].label,
      elapsedSeconds: timer.elapsedSeconds.value,
      checks: checkCount.value,
      reveals: revealCount.value,
      words: puzzle.value.entries.length,
      cells: puzzle.value.cells.length,
      completedAt: new Date().toISOString(),
      ...scoreDetails
    }

    stats.value = updateStats(stats.value, result)
    saveStats(stats.value)
    completionResult.value = result
    phase.value = 'completed'
    savedGame.value = null
    clearActiveGame()
    clearEntryCelebration()
    playCrosswordSound('complete', settings.soundEnabled)
    return true
  }

  function resetPlayState() {
    clearEntryCelebration()
    playerLetters.value = {}
    checkedCells.value = {}
    incorrectCells.value = {}
    revealedCells.value = {}
    selection.value = null
    undoStack.value = []
    checkCount.value = 0
    completionResult.value = null
    errorMessage.value = ''
  }

  async function startNewGame({ topicId, difficultyId }) {
    isGenerating.value = true
    errorMessage.value = ''

    try {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 0))
      const seed = createPuzzleSeed()
      const generatedPuzzle = generatePuzzle({ words, topicId, difficultyId, seed })

      timer.reset()
      resetPlayState()
      puzzle.value = generatedPuzzle
      phase.value = 'playing'
      selectInitialCell()
      timer.start(0)
      persistGame()
      return true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'The puzzle could not be generated.'
      phase.value = 'setup'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  function persistGame() {
    if (phase.value !== 'playing' || !puzzle.value) {
      return
    }

    const snapshot = {
      puzzle: puzzle.value,
      playerLetters: playerLetters.value,
      checkedCells: checkedCells.value,
      incorrectCells: incorrectCells.value,
      revealedCells: revealedCells.value,
      selection: selection.value,
      undoStack: undoStack.value.slice(-100),
      checkCount: checkCount.value,
      elapsedSeconds: timer.elapsedSeconds.value
    }

    saveActiveGame(snapshot)
    savedGame.value = snapshot
  }

  function resumeGame() {
    const game = loadActiveGame()
    if (!game) {
      savedGame.value = null
      return false
    }

    resetPlayState()
    puzzle.value = game.puzzle
    playerLetters.value = { ...game.playerLetters }
    checkedCells.value = { ...(game.checkedCells ?? {}) }
    incorrectCells.value = { ...(game.incorrectCells ?? {}) }
    revealedCells.value = { ...(game.revealedCells ?? {}) }
    undoStack.value = Array.isArray(game.undoStack) ? game.undoStack.slice(-100) : []
    checkCount.value = Number(game.checkCount) || 0
    phase.value = 'playing'

    const restoredSelection = game.selection?.key && cellsByKey.value.has(game.selection.key)
      ? makeSelection(game.selection.key, game.selection.direction)
      : null
    selection.value = restoredSelection
    if (!selection.value) {
      selectInitialCell()
    }

    timer.start(Number(game.elapsedSeconds) || 0)
    savedGame.value = game
    return true
  }

  function returnToSetup() {
    persistGame()
    timer.pause()
    phase.value = 'setup'
  }

  function abandonGame() {
    timer.reset()
    resetPlayState()
    puzzle.value = null
    savedGame.value = null
    phase.value = 'setup'
    clearActiveGame()
  }

  function finishAndReturnToSetup() {
    timer.reset()
    resetPlayState()
    puzzle.value = null
    phase.value = 'setup'
  }

  onBeforeUnmount(() => {
    clearEntryCelebration()
    persistGame()
  })

  return {
    phase,
    puzzle,
    playerLetters,
    checkedCells,
    incorrectCells,
    revealedCells,
    selection,
    activeEntry,
    activeCellKeys,
    completedEntryIds,
    filledCellCount,
    progressPercent,
    revealCount,
    checkCount,
    undoStack,
    completionResult,
    errorMessage,
    isGenerating,
    stats,
    hasSavedGame,
    timer,
    startNewGame,
    resumeGame,
    returnToSetup,
    abandonGame,
    finishAndReturnToSetup,
    selectCell,
    selectEntry,
    moveSelectionBy,
    toggleDirection,
    inputLetter,
    deleteLetter,
    undo,
    checkCell,
    checkWord,
    checkPuzzle,
    revealLetter,
    revealWord,
    revealPuzzle,
    persistGame
  }
}
