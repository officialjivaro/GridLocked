// Grid Coordinates | Keeps sparse-grid keys consistent across generator and UI
export function cellKey(row, col) {
  return `${row},${col}`
}

export function getDirectionStep(direction) {
  return direction === 'down'
    ? { row: 1, col: 0 }
    : { row: 0, col: 1 }
}

export function getPlacementCells(answer, startRow, startCol, direction) {
  const step = getDirectionStep(direction)

  return [...answer].map((letter, index) => ({
    row: startRow + step.row * index,
    col: startCol + step.col * index,
    letter,
    index
  }))
}

export function getGridBounds(grid, extraCells = []) {
  const cells = [
    ...[...grid.values()].map(({ row, col }) => ({ row, col })),
    ...extraCells
  ]

  if (!cells.length) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, rows: 0, cols: 0, area: 0 }
  }

  const rows = cells.map((cell) => cell.row)
  const cols = cells.map((cell) => cell.col)
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)
  const rowCount = maxRow - minRow + 1
  const colCount = maxCol - minCol + 1

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    rows: rowCount,
    cols: colCount,
    area: rowCount * colCount
  }
}

// Placement Validation | Enforces matching crossings and prevents accidental adjacent words
export function canPlaceWord({
  grid,
  answer,
  startRow,
  startCol,
  direction,
  maxGridSize,
  requireIntersection = true
}) {
  const cells = getPlacementCells(answer, startRow, startCol, direction)
  const step = getDirectionStep(direction)
  const beforeKey = cellKey(startRow - step.row, startCol - step.col)
  const afterCell = cells[cells.length - 1]
  const afterKey = cellKey(afterCell.row + step.row, afterCell.col + step.col)

  if (grid.has(beforeKey) || grid.has(afterKey)) {
    return { valid: false, intersections: 0, newCells: 0 }
  }

  let intersections = 0
  let newCells = 0

  for (const placementCell of cells) {
    const key = cellKey(placementCell.row, placementCell.col)
    const existing = grid.get(key)

    if (existing) {
      if (existing.letter !== placementCell.letter || existing[direction]) {
        return { valid: false, intersections: 0, newCells: 0 }
      }

      intersections += 1
      continue
    }

    const neighbors = direction === 'across'
      ? [cellKey(placementCell.row - 1, placementCell.col), cellKey(placementCell.row + 1, placementCell.col)]
      : [cellKey(placementCell.row, placementCell.col - 1), cellKey(placementCell.row, placementCell.col + 1)]

    if (neighbors.some((neighborKey) => grid.has(neighborKey))) {
      return { valid: false, intersections: 0, newCells: 0 }
    }

    newCells += 1
  }

  if (requireIntersection && intersections === 0) {
    return { valid: false, intersections: 0, newCells: 0 }
  }

  const bounds = getGridBounds(grid, cells)
  if (bounds.rows > maxGridSize || bounds.cols > maxGridSize) {
    return { valid: false, intersections: 0, newCells: 0 }
  }

  return { valid: true, intersections, newCells, bounds, cells }
}

// Grid Mutation | Adds one validated word to the sparse grid
export function applyPlacement(grid, entryId, answer, startRow, startCol, direction) {
  const cells = getPlacementCells(answer, startRow, startCol, direction)

  for (const placementCell of cells) {
    const key = cellKey(placementCell.row, placementCell.col)
    const existing = grid.get(key)

    if (existing) {
      existing[direction] = entryId
      continue
    }

    grid.set(key, {
      row: placementCell.row,
      col: placementCell.col,
      letter: placementCell.letter,
      across: direction === 'across' ? entryId : null,
      down: direction === 'down' ? entryId : null
    })
  }

  return cells
}
