import { DIFFICULTIES } from '../data/gameConfig.js'
import { TOPIC_IDS } from '../data/topics.js'
import { isSupportedAnswer, normalizeAnswer } from '../utils/normalizeAnswer.js'

// Runtime Validation | Protects the game from malformed or disabled word records
export function prepareWordRecords(words) {
  const seenAnswers = new Set()
  const seenIds = new Set()
  const prepared = []

  for (const record of words) {
    const normalizedAnswer = normalizeAnswer(record?.answer)
    const validTopics = Array.isArray(record?.topics)
      && record.topics.length > 0
      && record.topics.every((topic) => TOPIC_IDS.includes(topic))

    const isValid = Boolean(
      record
      && typeof record.id === 'string'
      && record.id.trim()
      && !seenIds.has(record.id)
      && isSupportedAnswer(record.answer)
      && !seenAnswers.has(normalizedAnswer)
      && typeof record.clue === 'string'
      && record.clue.trim().length >= 8
      && validTopics
      && [1, 2, 3].includes(record.difficulty)
      && record.enabled !== false
      && record.language === 'en'
    )

    if (!isValid) {
      continue
    }

    seenIds.add(record.id)
    seenAnswers.add(normalizedAnswer)
    prepared.push({
      ...record,
      id: record.id.trim(),
      clue: record.clue.trim(),
      normalizedAnswer
    })
  }

  return prepared
}

export function matchesDifficulty(record, difficultyId) {
  const allowed = DIFFICULTIES[difficultyId]?.preferredWordDifficulties ?? [1, 2, 3]
  return allowed.includes(record.difficulty)
}

export function getEligibleWords(words, topicId, difficultyId) {
  const difficulty = DIFFICULTIES[difficultyId]

  return prepareWordRecords(words).filter((record) => {
    const topicMatches = topicId === 'all' || record.topics.includes(topicId)
    const fitsGrid = !difficulty || record.normalizedAnswer.length <= difficulty.maxGridSize
    return topicMatches && fitsGrid && matchesDifficulty(record, difficultyId)
  })
}

export function getPuzzleAvailability(words, topics, difficulties = DIFFICULTIES) {
  const availability = {}

  for (const topic of topics) {
    availability[topic.id] = {}

    for (const [difficultyId, difficulty] of Object.entries(difficulties)) {
      const count = getEligibleWords(words, topic.id, difficultyId).length
      availability[topic.id][difficultyId] = {
        count,
        available: count >= difficulty.minimumWords
      }
    }
  }

  return availability
}
