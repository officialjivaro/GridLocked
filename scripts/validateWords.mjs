import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TOPIC_IDS } from '../src/features/crossword/data/topics.js'
import { normalizeAnswer } from '../src/features/crossword/utils/normalizeAnswer.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const wordsDirectory = path.join(projectRoot, 'src/features/crossword/data/words')

// Word Data Validation | Stops malformed records from reaching production builds
async function validateWords() {
  const filenames = (await readdir(wordsDirectory))
    .filter((filename) => /^words_[a-z]\.json$/.test(filename))
    .sort()

  assert.equal(filenames.length, 25, 'Expected exactly 25 alphabetized word JSON files.')

  const allRecords = []
  const ids = new Set()
  const answers = new Set()

  for (const filename of filenames) {
    const letter = filename.match(/^words_([a-z])\.json$/)[1]
    const filePath = path.join(wordsDirectory, filename)
    const records = JSON.parse(await readFile(filePath, 'utf8'))

    assert.ok(Array.isArray(records), `${filename} must contain a JSON array.`)
    assert.equal(records.length, 9, `${filename} must contain exactly nine records.`)

    for (const [index, record] of records.entries()) {
      const label = `${filename} record ${index + 1}`
      const normalized = normalizeAnswer(record.answer)

      assert.ok(record && typeof record === 'object', `${label} must be an object.`)
      assert.ok(typeof record.id === 'string' && record.id.trim(), `${label} needs an id.`)
      assert.ok(!ids.has(record.id), `${label} duplicates id "${record.id}".`)
      assert.ok(normalized.length >= 3 && normalized.length <= 15, `${label} has an unsupported answer.`)
      assert.equal(normalized[0].toLowerCase(), letter, `${label} is in the wrong alphabet file.`)
      assert.ok(!answers.has(normalized), `${label} duplicates answer "${record.answer}".`)
      assert.ok(typeof record.clue === 'string' && record.clue.trim().length >= 8, `${label} needs a useful clue.`)
      assert.ok(Array.isArray(record.topics) && record.topics.length > 0, `${label} needs at least one topic.`)
      assert.ok(record.topics.every((topic) => TOPIC_IDS.includes(topic)), `${label} contains an unknown topic.`)
      assert.ok([1, 2, 3].includes(record.difficulty), `${label} difficulty must be 1, 2, or 3.`)
      assert.equal(typeof record.enabled, 'boolean', `${label} enabled must be a boolean.`)
      assert.equal(record.language, 'en', `${label} language must be "en".`)

      ids.add(record.id)
      answers.add(normalized)
      allRecords.push(record)
    }
  }

  assert.equal(allRecords.length, 225, 'The collection must contain exactly 225 records.')

  for (const topic of TOPIC_IDS) {
    const count = allRecords.filter((record) => record.enabled && record.topics.includes(topic)).length
    assert.ok(count >= 30, `Topic "${topic}" needs at least 30 enabled records.`)
  }

  console.log(`Validated ${allRecords.length} crossword records across ${filenames.length} files.`)
}

validateWords().catch((error) => {
  console.error(`Crossword word validation failed: ${error.message}`)
  process.exitCode = 1
})
