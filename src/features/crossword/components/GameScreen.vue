<template>
  <!-- Active Game | Uses fixed arcade regions instead of a scrolling page -->
  <main
    class="cw-game"
    :class="{
      'cw-game--keyboard-visible': showKeyboard,
      'cw-game--clues-open': clueSheetOpen
    }"
  >
    <section class="cw-active-clue" aria-live="polite">
      <div class="cw-active-clue__badge">
        <span>{{ activeEntry?.number || '—' }}</span>
        <small>{{ activeEntry?.direction || 'across' }}</small>
      </div>

      <div class="cw-active-clue__copy">
        <p v-if="activeEntry">{{ activeEntry.clue }}</p>
        <p v-else>Select a square to begin.</p>
        <small v-if="activeEntry">{{ activeEntry.length }} letters</small>
      </div>

      <div v-if="isMobile" class="cw-view-switch" aria-label="Mobile game view">
        <button
          type="button"
          :aria-pressed="!clueSheetOpen"
          :class="{ 'cw-view-switch__button--active': !clueSheetOpen }"
          @click="closeClueSheet"
        >
          Board
        </button>
        <button
          type="button"
          :aria-pressed="clueSheetOpen"
          :class="{ 'cw-view-switch__button--active': clueSheetOpen }"
          @click="openClueSheet"
        >
          Clues
        </button>
      </div>
    </section>

    <div class="cw-game-stage">
      <section class="cw-board-shell" aria-label="Crossword board">
        <CrosswordBoard
          :puzzle="puzzle"
          :player-letters="playerLetters"
          :selected-key="selection?.key || ''"
          :active-cell-keys="activeCellKeys"
          :completed-entry-ids="completedEntryIds"
          :checked-cells="checkedCells"
          :incorrect-cells="incorrectCells"
          :revealed-cells="revealedCells"
          :reduced-motion="reducedMotion"
          @select-cell="$emit('select-cell', $event)"
          @input-letter="$emit('input-letter', $event)"
          @delete-letter="$emit('delete-letter')"
          @move-selection="handleMoveSelection"
          @toggle-direction="$emit('toggle-direction')"
        />
      </section>

      <CluePanel
        v-if="!isMobile"
        mode="desktop"
        :puzzle="puzzle"
        :player-letters="playerLetters"
        :active-entry-id="activeEntry?.id || ''"
        :reduced-motion="reducedMotion"
        @select-entry="$emit('select-entry', $event)"
      />

      <div
        v-if="isMobile && clueSheetOpen"
        class="cw-clue-sheet-backdrop"
        role="presentation"
        @click.self="closeClueSheet"
      >
        <CluePanel
          mode="sheet"
          :puzzle="puzzle"
          :player-letters="playerLetters"
          :active-entry-id="activeEntry?.id || ''"
          :reduced-motion="reducedMotion"
          @select-entry="handleSelectEntry"
          @close="closeClueSheet"
        />
      </div>
    </div>

    <GameControls
      ref="controlsRef"
      :can-undo="canUndo"
      @undo="$emit('undo')"
      @check-word="$emit('check-word')"
      @reveal-letter="$emit('reveal-letter')"
      @open-more="moreOpen = true"
    />

    <OnScreenKeyboard
      v-if="showKeyboard"
      @input-letter="$emit('input-letter', $event)"
      @delete-letter="$emit('delete-letter')"
    />

    <GameActionsDialog
      :open="moreOpen"
      :keyboard-visible="keyboardVisible"
      :show-keyboard-toggle="!isMobile"
      @close="moreOpen = false"
      @check-cell="$emit('check-cell')"
      @check-puzzle="$emit('check-puzzle')"
      @request-reveal-word="$emit('request-reveal-word')"
      @request-reveal-puzzle="$emit('request-reveal-puzzle')"
      @request-new-game="$emit('request-new-game')"
      @toggle-keyboard="toggleKeyboard"
    />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import CluePanel from './CluePanel.vue'
import CrosswordBoard from './CrosswordBoard.vue'
import GameActionsDialog from './GameActionsDialog.vue'
import GameControls from './GameControls.vue'
import OnScreenKeyboard from './OnScreenKeyboard.vue'

const props = defineProps({
  puzzle: {
    type: Object,
    required: true
  },
  playerLetters: {
    type: Object,
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
  selection: {
    type: Object,
    default: null
  },
  activeEntry: {
    type: Object,
    default: null
  },
  activeCellKeys: {
    type: Set,
    required: true
  },
  completedEntryIds: {
    type: Set,
    required: true
  },
  canUndo: Boolean,
  reducedMotion: Boolean
})

const emit = defineEmits([
  'select-cell',
  'select-entry',
  'input-letter',
  'delete-letter',
  'move-selection',
  'toggle-direction',
  'undo',
  'check-cell',
  'check-word',
  'check-puzzle',
  'reveal-letter',
  'request-reveal-word',
  'request-reveal-puzzle',
  'request-new-game'
])

const controlsRef = ref(null)
const isMobile = ref(false)
const keyboardVisible = ref(true)
const clueSheetOpen = ref(false)
const moreOpen = ref(false)
let mobileQuery = null
let finePointerQuery = null
let mediaInitialized = false

const showKeyboard = computed(() => keyboardVisible.value && !clueSheetOpen.value)

function syncMediaState() {
  const nextMobile = Boolean(mobileQuery?.matches)
  const hasFinePointer = Boolean(finePointerQuery?.matches)

  if (!mediaInitialized) {
    keyboardVisible.value = nextMobile || !hasFinePointer
    mediaInitialized = true
  } else if (nextMobile && !isMobile.value) {
    keyboardVisible.value = true
  } else if (!nextMobile && isMobile.value && hasFinePointer) {
    keyboardVisible.value = false
  }

  isMobile.value = nextMobile
  if (!nextMobile) {
    clueSheetOpen.value = false
  }
}

function handleMoveSelection(rowDelta, colDelta) {
  emit('move-selection', rowDelta, colDelta)
}

function openClueSheet() {
  clueSheetOpen.value = true
}

async function closeClueSheet() {
  clueSheetOpen.value = false
  await nextTick()
  globalThis.document?.querySelector('[data-selected="true"]')?.focus({ preventScroll: true })
}

function handleSelectEntry(entryId) {
  emit('select-entry', entryId)
}

function toggleKeyboard() {
  keyboardVisible.value = !keyboardVisible.value
}

function focusMoreControl() {
  controlsRef.value?.focusMore()
}

onMounted(() => {
  mobileQuery = globalThis.window?.matchMedia('(max-width: 760px), (max-height: 520px) and (pointer: coarse)') ?? null
  finePointerQuery = globalThis.window?.matchMedia('(hover: hover) and (pointer: fine)') ?? null
  syncMediaState()
  mobileQuery?.addEventListener?.('change', syncMediaState)
  finePointerQuery?.addEventListener?.('change', syncMediaState)
})

onBeforeUnmount(() => {
  mobileQuery?.removeEventListener?.('change', syncMediaState)
  finePointerQuery?.removeEventListener?.('change', syncMediaState)
})

defineExpose({ focusMoreControl })
</script>
