import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testDirectory, '../..')
const wordsDirectory = path.join(projectRoot, 'src/features/crossword/data/words')

export async function loadTestWords() {
  const filenames = (await readdir(wordsDirectory))
    .filter((filename) => /^words_[a-z]\.json$/.test(filename))
    .sort()

  const records = []
  for (const filename of filenames) {
    records.push(...JSON.parse(await readFile(path.join(wordsDirectory, filename), 'utf8')))
  }
  return records
}
