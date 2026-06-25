import assert from 'node:assert/strict'
import test from 'node:test'
import { findNewlyCompletedEntries } from '../../src/features/crossword/utils/entryCompletion.js'

const across = {
  id: 'across-1',
  answer: 'CAT',
  cells: ['0,0', '0,1', '0,2']
}

const down = {
  id: 'down-1',
  answer: 'BAT',
  cells: ['1,1', '0,1', '2,1']
}

test('identifies one newly completed entry', () => {
  const result = findNewlyCompletedEntries({
    entries: [across],
    previousLetters: { '0,0': 'C', '0,1': 'A' },
    nextLetters: { '0,0': 'C', '0,1': 'A', '0,2': 'T' }
  })

  assert.deepEqual(result, ['across-1'])
})

test('identifies two crossing entries completed by one letter', () => {
  const previousLetters = {
    '0,0': 'C',
    '0,2': 'T',
    '1,1': 'B',
    '2,1': 'T'
  }
  const nextLetters = { ...previousLetters, '0,1': 'A' }

  assert.deepEqual(
    findNewlyCompletedEntries({ entries: [across, down], previousLetters, nextLetters }),
    ['across-1', 'down-1']
  )
})

test('ignores incomplete and incorrect entries', () => {
  assert.deepEqual(findNewlyCompletedEntries({
    entries: [across],
    previousLetters: { '0,0': 'C' },
    nextLetters: { '0,0': 'C', '0,1': 'A' }
  }), [])

  assert.deepEqual(findNewlyCompletedEntries({
    entries: [across],
    previousLetters: { '0,0': 'C', '0,1': 'A' },
    nextLetters: { '0,0': 'C', '0,1': 'A', '0,2': 'R' }
  }), [])
})

test('does not report an entry that was already solved', () => {
  const solvedLetters = { '0,0': 'C', '0,1': 'A', '0,2': 'T' }

  assert.deepEqual(findNewlyCompletedEntries({
    entries: [across],
    previousLetters: solvedLetters,
    nextLetters: solvedLetters
  }), [])
})

test('returns an empty list for invalid entry input', () => {
  assert.deepEqual(findNewlyCompletedEntries(), [])
  assert.deepEqual(findNewlyCompletedEntries({ entries: [null], nextLetters: {} }), [])
})
