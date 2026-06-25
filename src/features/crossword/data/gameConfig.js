// App Settings | Centralizes gameplay, scoring, storage, and external navigation values
export const CROSSWORD_CONFIG = {
  appName: 'Jivaro Crossword',
  gamesUrl: 'https://jivaro.net/games',
  language: 'en',
  generatorAttempts: 80,
  candidatePoolSize: 48,
  storageVersion: 1,
  storageKeys: {
    activeGame: 'jivaro-crossword:active:v1',
    settings: 'jivaro-crossword:settings:v1',
    stats: 'jivaro-crossword:stats:v1'
  },
  score: {
    pointsPerCell: 10,
    perfectBonus: 200,
    multipliers: {
      easy: 1,
      normal: 1.5,
      hard: 2
    }
  }
}

// Difficulty Catalog | Controls puzzle size, data preference, and player assistance
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    icon: '🌱',
    description: 'Smaller board with optional instant error highlighting.',
    targetWords: 8,
    minimumWords: 7,
    maximumWords: 9,
    maxGridSize: 9,
    preferredWordDifficulties: [1, 2]
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    icon: '⭐',
    description: 'A balanced puzzle with manual checking.',
    targetWords: 12,
    minimumWords: 10,
    maximumWords: 14,
    maxGridSize: 13,
    preferredWordDifficulties: [1, 2, 3]
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    icon: '🔥',
    description: 'A larger board with harder clues and fewer visual assists.',
    targetWords: 16,
    minimumWords: 14,
    maximumWords: 18,
    maxGridSize: 15,
    preferredWordDifficulties: [2, 3]
  }
}

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES)
