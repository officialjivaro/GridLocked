function isEntrySolved(entry, letters = {}) {
  if (!entry || !Array.isArray(entry.cells) || typeof entry.answer !== 'string') {
    return false
  }

  return entry.cells.every((key, index) => letters[key] === entry.answer[index])
}

// Entry Completion | Finds answers that changed from unsolved to correctly solved
export function findNewlyCompletedEntries({ entries, previousLetters, nextLetters } = {}) {
  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .filter((entry) => (
      !isEntrySolved(entry, previousLetters)
      && isEntrySolved(entry, nextLetters)
    ))
    .map((entry) => entry.id)
}
