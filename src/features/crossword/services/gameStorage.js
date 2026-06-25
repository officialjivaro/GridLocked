import { CROSSWORD_CONFIG } from '../data/gameConfig.js'
import { createEmptyStats } from './scoring.js'

function hasStorage() {
  return typeof globalThis.localStorage !== 'undefined'
}

function readJson(key, fallback) {
  if (!hasStorage()) {
    return fallback
  }

  try {
    const raw = globalThis.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  if (!hasStorage()) {
    return false
  }

  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// Active Game Storage | Saves one resumable puzzle with a versioned payload
export function saveActiveGame(game) {
  return writeJson(CROSSWORD_CONFIG.storageKeys.activeGame, {
    version: CROSSWORD_CONFIG.storageVersion,
    savedAt: new Date().toISOString(),
    game
  })
}

export function loadActiveGame() {
  const payload = readJson(CROSSWORD_CONFIG.storageKeys.activeGame, null)

  const valid = Boolean(
    payload
    && payload.version === CROSSWORD_CONFIG.storageVersion
    && payload.game
    && payload.game.puzzle
    && Array.isArray(payload.game.puzzle.cells)
    && Array.isArray(payload.game.puzzle.entries)
    && typeof payload.game.playerLetters === 'object'
  )

  if (!valid) {
    clearActiveGame()
    return null
  }

  return payload.game
}

export function clearActiveGame() {
  if (!hasStorage()) {
    return
  }

  try {
    globalThis.localStorage.removeItem(CROSSWORD_CONFIG.storageKeys.activeGame)
  } catch {
    // Storage failures should not prevent gameplay.
  }
}

// Settings Storage | Keeps player preferences local to this browser
export function loadSettings() {
  const defaults = {
    soundEnabled: true,
    reducedMotion: false,
    easyAutoCheck: true,
    showTimer: true
  }

  const stored = readJson(CROSSWORD_CONFIG.storageKeys.settings, {})
  return { ...defaults, ...(stored && typeof stored === 'object' ? stored : {}) }
}

export function saveSettings(settings) {
  return writeJson(CROSSWORD_CONFIG.storageKeys.settings, settings)
}

// Statistics Storage | Keeps small aggregate results without accounts or tracking
export function loadStats() {
  const stored = readJson(CROSSWORD_CONFIG.storageKeys.stats, null)
  if (!stored || typeof stored !== 'object') {
    return createEmptyStats()
  }

  const defaults = createEmptyStats()
  return {
    ...defaults,
    ...stored,
    bestScores: { ...defaults.bestScores, ...stored.bestScores },
    bestTimes: { ...defaults.bestTimes, ...stored.bestTimes }
  }
}

export function saveStats(stats) {
  return writeJson(CROSSWORD_CONFIG.storageKeys.stats, stats)
}
