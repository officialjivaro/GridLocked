<template>
  <!-- Crossword Board | Fits normal puzzles and pans larger grids without scrolling the page -->
  <div ref="viewportRef" class="cw-board-viewport" tabindex="-1">
    <div class="cw-board-pan">
      <div
        ref="boardRef"
        class="cw-board"
        role="grid"
        aria-label="Crossword puzzle grid"
        :aria-rowcount="puzzle.rows"
        :aria-colcount="puzzle.cols"
        :style="{
          '--cw-columns': puzzle.cols,
          '--cw-cell-size': `${cellSize}px`
        }"
      >
        <template v-for="slot in matrix" :key="slot.key">
          <CrosswordCell
            v-if="slot.cell"
            :cell="slot.cell"
            :letter="playerLetters[slot.cell.key] || ''"
            :selected="selectedKey === slot.cell.key"
            :active-word="activeCellKeys.has(slot.cell.key)"
            :checked="Boolean(checkedCells[slot.cell.key])"
            :incorrect="Boolean(incorrectCells[slot.cell.key])"
            :revealed="Boolean(revealedCells[slot.cell.key])"
            :completed="completedCellKeys.has(slot.cell.key)"
            @select="$emit('select-cell', $event)"
            @cell-keydown="handleKeydown"
          />
          <span v-else class="cw-cell cw-cell--blocked" role="presentation"></span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CrosswordCell from './CrosswordCell.vue'

const props = defineProps({
  puzzle: {
    type: Object,
    required: true
  },
  playerLetters: {
    type: Object,
    required: true
  },
  selectedKey: {
    type: String,
    default: ''
  },
  activeCellKeys: {
    type: Set,
    required: true
  },
  completedEntryIds: {
    type: Set,
    required: true
  },
  checkedCells: {
    type: Object,
    required: true
  },
  incorrectCells: {
    type: Object,
    required: true
  },
  revealedCells: {
    type: Object,
    required: true
  },
  reducedMotion: Boolean
})

const emit = defineEmits([
  'select-cell',
  'input-letter',
  'delete-letter',
  'move-selection',
  'toggle-direction'
])

const boardRef = ref(null)
const viewportRef = ref(null)
const cellSize = ref(38)
let resizeObserver = null

const matrix = computed(() => {
  const cells = new Map(props.puzzle.cells.map((cell) => [cell.key, cell]))
  const slots = []

  for (let row = 0; row < props.puzzle.rows; row += 1) {
    for (let col = 0; col < props.puzzle.cols; col += 1) {
      const key = `${row},${col}`
      slots.push({ key, cell: cells.get(key) ?? null })
    }
  }

  return slots
})

const completedCellKeys = computed(() => {
  const keys = new Set()

  for (const entry of props.puzzle.entries) {
    if (!props.completedEntryIds.has(entry.id)) {
      continue
    }

    for (const key of entry.cells) {
      keys.add(key)
    }
  }

  return keys
})

function updateCellSize() {
  const viewport = viewportRef.value
  if (!viewport) {
    return
  }

  const rect = viewport.getBoundingClientRect()
  const gap = 2
  const padding = 24
  const widthFit = (rect.width - padding - gap * (props.puzzle.cols - 1)) / props.puzzle.cols
  const heightFit = (rect.height - padding - gap * (props.puzzle.rows - 1)) / props.puzzle.rows
  const fit = Math.floor(Math.min(widthFit, heightFit))
  const minimum = rect.width <= 360 ? 28 : 30
  const maximum = rect.width >= 760 ? 52 : 46

  cellSize.value = Math.max(minimum, Math.min(maximum, Number.isFinite(fit) ? fit : minimum))
}

function handleKeydown(event) {
  if (/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault()
    emit('input-letter', event.key)
    return
  }

  const actions = {
    Backspace: () => emit('delete-letter'),
    Delete: () => emit('delete-letter'),
    ArrowUp: () => emit('move-selection', -1, 0),
    ArrowDown: () => emit('move-selection', 1, 0),
    ArrowLeft: () => emit('move-selection', 0, -1),
    ArrowRight: () => emit('move-selection', 0, 1),
    Enter: () => emit('toggle-direction')
  }

  const action = actions[event.key]
  if (action) {
    event.preventDefault()
    action()
  }
}

function keepSelectedCellVisible(selected) {
  const viewport = viewportRef.value
  if (!viewport || !selected) {
    return
  }

  const viewportRect = viewport.getBoundingClientRect()
  const cellRect = selected.getBoundingClientRect()
  const edgePadding = 20
  let nextLeft = viewport.scrollLeft
  let nextTop = viewport.scrollTop

  if (cellRect.left < viewportRect.left + edgePadding) {
    nextLeft += cellRect.left - viewportRect.left - edgePadding
  } else if (cellRect.right > viewportRect.right - edgePadding) {
    nextLeft += cellRect.right - viewportRect.right + edgePadding
  }

  if (cellRect.top < viewportRect.top + edgePadding) {
    nextTop += cellRect.top - viewportRect.top - edgePadding
  } else if (cellRect.bottom > viewportRect.bottom - edgePadding) {
    nextTop += cellRect.bottom - viewportRect.bottom + edgePadding
  }

  viewport.scrollTo({
    left: Math.max(0, nextLeft),
    top: Math.max(0, nextTop),
    behavior: props.reducedMotion ? 'auto' : 'smooth'
  })
}

async function focusSelectedCell() {
  await nextTick()
  const selected = boardRef.value?.querySelector('[data-selected="true"]')
  selected?.focus({ preventScroll: true })
  keepSelectedCellVisible(selected)
}

watch(
  () => props.selectedKey,
  focusSelectedCell,
  { flush: 'post' }
)

watch(
  () => [props.puzzle.rows, props.puzzle.cols],
  async () => {
    await nextTick()
    updateCellSize()
  }
)

onMounted(() => {
  updateCellSize()
  focusSelectedCell()

  if (typeof globalThis.ResizeObserver === 'function') {
    resizeObserver = new globalThis.ResizeObserver(updateCellSize)
    if (viewportRef.value) {
      resizeObserver.observe(viewportRef.value)
    }
  } else {
    globalThis.window?.addEventListener('resize', updateCellSize)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  globalThis.window?.removeEventListener('resize', updateCellSize)
})
</script>
