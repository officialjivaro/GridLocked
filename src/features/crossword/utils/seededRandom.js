// Seeded Randomness | Produces repeatable puzzles from a saved text seed
function hashSeed(seed) {
  let hash = 2166136261
  const text = String(seed)

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed) || 0x6d2b79f5

  return function random() {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(items, random = Math.random) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

export function randomItem(items, random = Math.random) {
  if (!items.length) {
    return undefined
  }

  return items[Math.floor(random() * items.length)]
}

export function createPuzzleSeed() {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(2)
    globalThis.crypto.getRandomValues(values)
    return `${Date.now().toString(36)}-${values[0].toString(36)}${values[1].toString(36)}`
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
