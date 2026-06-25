import assert from 'node:assert/strict'
import test from 'node:test'
import { TOPIC_IDS } from '../../src/features/crossword/data/topics.js'
import { prepareWordRecords } from '../../src/features/crossword/services/wordRepository.js'
import { loadTestWords } from './testHelpers.mjs'

test('the collection contains 225 valid unique records', async () => {
  const words = await loadTestWords()
  const prepared = prepareWordRecords(words)

  assert.equal(words.length, 225)
  assert.equal(prepared.length, 225)
  assert.equal(new Set(prepared.map((word) => word.id)).size, 225)
  assert.equal(new Set(prepared.map((word) => word.normalizedAnswer)).size, 225)
})

test('every topic has a useful candidate pool', async () => {
  const words = await loadTestWords()

  for (const topic of TOPIC_IDS) {
    const count = words.filter((word) => word.topics.includes(topic)).length
    assert.ok(count >= 30, `${topic} only has ${count} records`)
  }
})
