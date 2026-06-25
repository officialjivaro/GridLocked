<template>
  <!-- Crossword App | Owns the complete fixed-screen neon arcade experience -->
  <div class="cw-app" :class="{ 'cw-reduced-motion': settings.reducedMotion }">
    <AppTopBar
      :games-url="config.gamesUrl"
      :phase="phase"
      :topic-label="topicLabel"
      :difficulty-label="difficultyLabel"
      :progress-percent="progressPercent"
      :filled-cell-count="filledCellCount"
      :total-cells="puzzle?.cells.length ?? 0"
      :formatted-time="formattedTime"
      :show-timer="settings.showTimer"
      :reveal-count="revealCount"
      @open-settings="openSettings"
      @open-stats="openStats"
      @open-store="openStore"
    />

    <GameSetup
      v-if="phase === 'setup'"
      :topics="topics"
      :difficulties="difficultyOptions"
      :availability="availability"
      :has-saved-game="hasSavedGame"
      :error-message="errorMessage"
      :is-generating="isGenerating"
      :sound-enabled="settings.soundEnabled"
      :reduced-motion="settings.reducedMotion"
      @start="startNewGame"
      @resume="resumeGame"
    />

    <GameScreen
      v-else-if="puzzle"
      ref="gameScreenRef"
      :puzzle="puzzle"
      :player-letters="playerLetters"
      :checked-cells="checkedCells"
      :incorrect-cells="incorrectCells"
      :revealed-cells="revealedCells"
      :selection="selection"
      :active-entry="activeEntry"
      :active-cell-keys="activeCellKeys"
      :completed-entry-ids="completedEntryIds"
      :can-undo="canUndo"
      :reduced-motion="settings.reducedMotion"
      @select-cell="selectCell"
      @select-entry="selectEntry"
      @input-letter="inputLetter"
      @delete-letter="deleteLetter"
      @move-selection="moveSelectionBy"
      @toggle-direction="toggleDirection"
      @undo="undo"
      @check-cell="checkCell"
      @check-word="checkWord"
      @check-puzzle="checkPuzzle"
      @reveal-letter="revealLetter"
      @request-reveal-word="requestConfirmation('reveal-word')"
      @request-reveal-puzzle="requestConfirmation('reveal-puzzle')"
      @request-new-game="requestConfirmation('new-game')"
    />

    <StatsDialog :open="statsOpen" :stats="stats" @close="statsOpen = false" />

    <SettingsDialog
      :open="settingsOpen"
      :settings="settings"
      @close="settingsOpen = false"
      @update-setting="updateSetting"
    />

    <ConfirmDialog
      :open="Boolean(confirmAction)"
      :title="confirmationDetails.title"
      :message="confirmationDetails.message"
      :confirm-label="confirmationDetails.confirmLabel"
      :symbol="confirmationDetails.symbol"
      :danger="confirmationDetails.danger"
      @close="closeConfirmation"
      @confirm="runConfirmedAction"
    />

    <CompletionDialog
      :open="phase === 'completed'"
      :result="completionResult"
      :games-url="config.gamesUrl"
      :topic-label="completionTopicLabel"
      :reduced-motion="settings.reducedMotion"
      @home="returnToGameHome"
      @play-again="replayCompletedPuzzle"
      @open-store="openStore"
    />

    <StoreDialog :open="storeOpen" @close="storeOpen = false" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import '../assets/crossword.css'
import AppTopBar from '../components/AppTopBar.vue'
import CompletionDialog from '../components/CompletionDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import GameScreen from '../components/GameScreen.vue'
import GameSetup from '../components/GameSetup.vue'
import SettingsDialog from '../components/SettingsDialog.vue'
import StatsDialog from '../components/StatsDialog.vue'
import StoreDialog from '../components/StoreDialog.vue'
import { useCrosswordGame } from '../composables/useCrosswordGame.js'
import { useGameSettings } from '../composables/useGameSettings.js'
import { CROSSWORD_CONFIG, DIFFICULTIES } from '../data/gameConfig.js'
import { TOPICS, getTopicById } from '../data/topics.js'
import { CROSSWORD_WORDS } from '../data/words/index.js'
import { playCrosswordSound } from '../services/soundService.js'
import { getPuzzleAvailability } from '../services/wordRepository.js'

const config = CROSSWORD_CONFIG
const topics = TOPICS
const difficultyOptions = Object.values(DIFFICULTIES)
const availability = getPuzzleAvailability(CROSSWORD_WORDS, topics)
const settingsOpen = ref(false)
const statsOpen = ref(false)
const storeOpen = ref(false)
const confirmAction = ref(null)
const gameScreenRef = ref(null)
const { settings, updateSetting } = useGameSettings()

const game = useCrosswordGame({ words: CROSSWORD_WORDS, settings })
const {
  phase,
  puzzle,
  playerLetters,
  checkedCells,
  incorrectCells,
  revealedCells,
  selection,
  activeEntry,
  activeCellKeys,
  completedEntryIds,
  progressPercent,
  filledCellCount,
  revealCount,
  undoStack,
  completionResult,
  errorMessage,
  isGenerating,
  stats,
  hasSavedGame,
  timer,
  startNewGame,
  resumeGame,
  abandonGame,
  finishAndReturnToSetup,
  selectCell,
  selectEntry,
  moveSelectionBy,
  toggleDirection,
  inputLetter,
  deleteLetter,
  undo,
  checkCell,
  checkWord,
  checkPuzzle,
  revealLetter,
  revealWord,
  revealPuzzle,
  persistGame
} = game

const formattedTime = timer.formattedTime
const canUndo = computed(() => undoStack.value.length > 0)
const topicLabel = computed(() => getTopicById(puzzle.value?.topicId).label)
const completionTopicLabel = computed(() => getTopicById(completionResult.value?.topicId).label)
const difficultyLabel = computed(() => DIFFICULTIES[puzzle.value?.difficultyId]?.label ?? '')

const confirmationDetails = computed(() => {
  const details = {
    'reveal-word': {
      title: 'Reveal this word?',
      message: `The letters in ${activeEntry.value?.number ?? ''} ${activeEntry.value?.direction ?? ''} will be filled in and will not earn points.`,
      confirmLabel: 'Reveal word',
      symbol: '💡',
      danger: false
    },
    'reveal-puzzle': {
      title: 'Reveal the whole puzzle?',
      message: 'Every remaining answer will be filled in. The puzzle will complete, but revealed letters will not earn points.',
      confirmLabel: 'Reveal puzzle',
      symbol: '◆',
      danger: true
    },
    'new-game': {
      title: 'Start over?',
      message: 'Your current puzzle and its saved progress will be deleted.',
      confirmLabel: 'Delete and continue',
      symbol: '↻',
      danger: true
    }
  }

  return details[confirmAction.value] ?? {
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    symbol: '?',
    danger: false
  }
})

function closeOtherOverlays() {
  settingsOpen.value = false
  statsOpen.value = false
  storeOpen.value = false
}

function openSettings() {
  statsOpen.value = false
  storeOpen.value = false
  playCrosswordSound('menu', settings.soundEnabled)
  settingsOpen.value = true
}

function openStats() {
  settingsOpen.value = false
  storeOpen.value = false
  playCrosswordSound('menu', settings.soundEnabled)
  statsOpen.value = true
}

function openStore() {
  settingsOpen.value = false
  statsOpen.value = false
  playCrosswordSound('store', settings.soundEnabled)
  storeOpen.value = true
}

function requestConfirmation(action) {
  confirmAction.value = action
}

async function returnFocusToMore() {
  if (phase.value !== 'playing') {
    return
  }

  await nextTick()
  gameScreenRef.value?.focusMoreControl()
}

function closeConfirmation() {
  confirmAction.value = null
  returnFocusToMore()
}

function runConfirmedAction() {
  const action = confirmAction.value
  confirmAction.value = null

  if (action === 'reveal-word') {
    revealWord()
  } else if (action === 'reveal-puzzle') {
    revealPuzzle()
  } else if (action === 'new-game') {
    abandonGame()
  }

  returnFocusToMore()
}

function returnToGameHome() {
  closeOtherOverlays()
  playCrosswordSound('home', settings.soundEnabled)
  finishAndReturnToSetup()
}

async function replayCompletedPuzzle() {
  const topicId = completionResult.value?.topicId ?? 'all'
  const difficultyId = completionResult.value?.difficulty ?? 'normal'
  closeOtherOverlays()
  playCrosswordSound('start', settings.soundEnabled)
  await startNewGame({ topicId, difficultyId })
}

const previousTitle = globalThis.document?.title ?? ''

function handleBeforeUnload() {
  persistGame()
}

onMounted(() => {
  if (globalThis.document) {
    globalThis.document.title = config.appName
  }
  globalThis.window?.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  persistGame()
  if (globalThis.document) {
    globalThis.document.title = previousTitle
  }
  globalThis.window?.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
