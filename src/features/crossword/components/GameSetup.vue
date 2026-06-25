<template>
  <!-- Arcade Start Screen | Keeps every primary choice inside one seamless viewport -->
  <main class="cw-setup">
    <div class="cw-setup__scanline" aria-hidden="true"></div>

    <section class="cw-arcade-home" aria-labelledby="arcade-title">
      <div class="cw-arcade-hero">
        <div class="cw-arcade-hero__copy">
          <p class="cw-kicker">Insert curiosity</p>
          <h2 id="arcade-title">
            <span>Neon</span>
            Crossword
          </h2>
          <p class="cw-arcade-hero__tagline">Connect the clues. Light up the grid.</p>
        </div>

        <div class="cw-arcade-logo-grid" aria-hidden="true">
          <span>C</span><span>R</span><span>O</span><span>S</span><span>S</span>
          <span></span><span></span><span>W</span><span></span><span></span>
          <span></span><span></span><span>O</span><span></span><span></span>
          <span></span><span></span><span>R</span><span></span><span></span>
          <span></span><span></span><span>D</span><span></span><span></span>
        </div>
      </div>

      <p v-if="errorMessage" class="cw-alert" role="alert">{{ errorMessage }}</p>

      <div class="cw-arcade-menu">
        <section class="cw-menu-section" aria-labelledby="topic-heading">
          <div class="cw-menu-heading">
            <div>
              <span class="cw-menu-heading__number" aria-hidden="true">01</span>
              <h3 id="topic-heading">Choose your channel</h3>
            </div>
            <span class="cw-menu-heading__value">{{ selectedTopicLabel }}</span>
          </div>

          <div
            class="cw-topic-carousel"
            :class="{
              'cw-topic-carousel--can-left': canScrollLeft,
              'cw-topic-carousel--can-right': canScrollRight,
              'cw-topic-carousel--dragging': isDragging
            }"
          >
            <button
              class="cw-topic-scroll-button cw-topic-scroll-button--left"
              type="button"
              :disabled="!canScrollLeft"
              aria-label="Scroll puzzle channels left"
              @click="scrollTopics(-1)"
            >
              ‹
            </button>

            <div
              ref="topicRail"
              class="cw-topic-rail"
              role="radiogroup"
              aria-label="Puzzle topic"
              tabindex="0"
              @scroll="updateTopicRailState"
              @wheel="handleTopicWheel"
              @pointerdown="beginTopicDrag"
              @pointermove="moveTopicDrag"
              @pointerup="endTopicDrag"
              @pointercancel="endTopicDrag"
              @keydown.left.prevent="scrollTopics(-1)"
              @keydown.right.prevent="scrollTopics(1)"
              @keydown.home.prevent="scrollToEdge('start')"
              @keydown.end.prevent="scrollToEdge('end')"
            >
              <button
                v-for="topic in topics"
                :key="topic.id"
                class="cw-topic-chip"
                :class="{ 'cw-topic-chip--selected': selectedTopicId === topic.id }"
                :data-topic-id="topic.id"
                type="button"
                role="radio"
                :aria-checked="selectedTopicId === topic.id"
                @click="selectTopic(topic.id)"
              >
                <span class="cw-topic-chip__icon" aria-hidden="true">{{ topic.icon }}</span>
                <span>{{ topic.label }}</span>
              </button>
            </div>

            <button
              class="cw-topic-scroll-button cw-topic-scroll-button--right"
              type="button"
              :disabled="!canScrollRight"
              aria-label="Scroll puzzle channels right"
              @click="scrollTopics(1)"
            >
              ›
            </button>
          </div>

          <p class="cw-topic-guide">
            <span aria-hidden="true">↔</span>
            Drag, swipe, or use the arrows to see every channel.
          </p>
        </section>

        <section class="cw-menu-section" aria-labelledby="difficulty-heading">
          <div class="cw-menu-heading">
            <div>
              <span class="cw-menu-heading__number" aria-hidden="true">02</span>
              <h3 id="difficulty-heading">Set the level</h3>
            </div>
            <span class="cw-menu-heading__value">{{ selectedDifficultyLabel }}</span>
          </div>

          <div class="cw-difficulty-selector" role="radiogroup" aria-label="Puzzle difficulty">
            <button
              v-for="difficulty in difficulties"
              :key="difficulty.id"
              class="cw-difficulty-option"
              :class="{ 'cw-difficulty-option--selected': selectedDifficultyId === difficulty.id }"
              type="button"
              role="radio"
              :disabled="!isAvailable(difficulty.id)"
              :aria-checked="selectedDifficultyId === difficulty.id"
              @click="selectDifficulty(difficulty.id)"
            >
              <span aria-hidden="true">{{ difficulty.icon }}</span>
              <strong>{{ difficulty.label }}</strong>
              <small>{{ wordCount(difficulty.id) }} words</small>
            </button>
          </div>

          <p class="cw-difficulty-hint">{{ selectedDifficultyDescription }}</p>
          <p v-if="!isAvailable(selectedDifficultyId)" class="cw-help-text" role="status">
            This topic needs more words at that level. Try another setting.
          </p>
        </section>

        <div class="cw-start-actions">
          <button
            class="cw-play-button"
            type="button"
            :disabled="isGenerating || !isAvailable(selectedDifficultyId)"
            @click="startGame"
          >
            <span v-if="isGenerating" class="cw-spinner" aria-hidden="true"></span>
            <span v-else class="cw-play-button__icon" aria-hidden="true">▶</span>
            <span>
              <small>{{ isGenerating ? 'Generating board' : 'Ready player one' }}</small>
              <strong>{{ isGenerating ? 'Building…' : 'Play crossword' }}</strong>
            </span>
          </button>

          <button
            v-if="hasSavedGame"
            class="cw-resume-button"
            type="button"
            @click="resumeGame"
          >
            <span aria-hidden="true">↳</span>
            Resume saved game
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { playCrosswordSound } from '../services/soundService.js'

const props = defineProps({
  topics: {
    type: Array,
    required: true
  },
  difficulties: {
    type: Array,
    required: true
  },
  availability: {
    type: Object,
    required: true
  },
  hasSavedGame: Boolean,
  errorMessage: {
    type: String,
    default: ''
  },
  isGenerating: Boolean,
  soundEnabled: Boolean,
  reducedMotion: Boolean
})

const emit = defineEmits(['start', 'resume'])
const selectedTopicId = ref('all')
const selectedDifficultyId = ref('normal')
const topicRail = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isDragging = ref(false)
let resizeObserver = null
let dragPointerId = null
let dragStartX = 0
let dragStartScrollLeft = 0
let dragMoved = false
let suppressClickUntil = 0

const selectedTopicLabel = computed(() => (
  props.topics.find((topic) => topic.id === selectedTopicId.value)?.label ?? 'All Topics'
))

const selectedDifficulty = computed(() => (
  props.difficulties.find((difficulty) => difficulty.id === selectedDifficultyId.value)
))

const selectedDifficultyLabel = computed(() => selectedDifficulty.value?.label ?? 'Normal')
const selectedDifficultyDescription = computed(() => (
  selectedDifficulty.value?.description ?? 'A balanced puzzle with manual checking.'
))

function isAvailable(difficultyId) {
  return Boolean(props.availability[selectedTopicId.value]?.[difficultyId]?.available)
}

function wordCount(difficultyId) {
  return props.availability[selectedTopicId.value]?.[difficultyId]?.count ?? 0
}

function updateTopicRailState() {
  const rail = topicRail.value
  if (!rail) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }

  canScrollLeft.value = rail.scrollLeft > 3
  canScrollRight.value = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 3
}

function playMenuSound() {
  playCrosswordSound('menu', props.soundEnabled)
}

function scrollTopics(direction) {
  const rail = topicRail.value
  if (!rail) {
    return
  }

  playMenuSound()
  rail.scrollBy({
    left: direction * Math.max(180, rail.clientWidth * 0.72),
    behavior: props.reducedMotion ? 'auto' : 'smooth'
  })
}

function scrollToEdge(edge) {
  const rail = topicRail.value
  if (!rail) {
    return
  }

  rail.scrollTo({
    left: edge === 'end' ? rail.scrollWidth : 0,
    behavior: props.reducedMotion ? 'auto' : 'smooth'
  })
}

function handleTopicWheel(event) {
  const rail = topicRail.value
  if (!rail || rail.scrollWidth <= rail.clientWidth) {
    return
  }

  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault()
    rail.scrollLeft += event.deltaY
  }
}

function beginTopicDrag(event) {
  if (event.pointerType === 'touch' || event.button !== 0 || !topicRail.value) {
    return
  }

  dragPointerId = event.pointerId
  dragStartX = event.clientX
  dragStartScrollLeft = topicRail.value.scrollLeft
  dragMoved = false
  isDragging.value = true
  topicRail.value.setPointerCapture?.(event.pointerId)
}

function moveTopicDrag(event) {
  if (event.pointerId !== dragPointerId || !topicRail.value) {
    return
  }

  const distance = event.clientX - dragStartX
  if (Math.abs(distance) > 5) {
    dragMoved = true
  }
  topicRail.value.scrollLeft = dragStartScrollLeft - distance
}

function endTopicDrag(event) {
  if (event.pointerId !== dragPointerId) {
    return
  }

  topicRail.value?.releasePointerCapture?.(event.pointerId)
  if (dragMoved) {
    suppressClickUntil = Date.now() + 140
  }
  dragPointerId = null
  dragMoved = false
  isDragging.value = false
}

async function revealSelectedTopic() {
  await nextTick()
  const rail = topicRail.value
  const selected = Array.from(rail?.querySelectorAll('[data-topic-id]') ?? [])
    .find((element) => element.dataset.topicId === selectedTopicId.value)

  selected?.scrollIntoView({
    behavior: props.reducedMotion ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'nearest'
  })
}

function selectTopic(topicId) {
  if (Date.now() < suppressClickUntil) {
    return
  }

  selectedTopicId.value = topicId
  playMenuSound()

  if (!isAvailable(selectedDifficultyId.value)) {
    const fallback = props.difficulties.find((difficulty) => isAvailable(difficulty.id))
    selectedDifficultyId.value = fallback?.id ?? 'normal'
  }

  revealSelectedTopic()
}

function selectDifficulty(difficultyId) {
  if (!isAvailable(difficultyId)) {
    return
  }

  selectedDifficultyId.value = difficultyId
  playMenuSound()
}

function startGame() {
  if (!isAvailable(selectedDifficultyId.value)) {
    return
  }

  playCrosswordSound('start', props.soundEnabled)
  emit('start', {
    topicId: selectedTopicId.value,
    difficultyId: selectedDifficultyId.value
  })
}

function resumeGame() {
  playCrosswordSound('start', props.soundEnabled)
  emit('resume')
}

onMounted(() => {
  updateTopicRailState()

  if (globalThis.ResizeObserver) {
    resizeObserver = new globalThis.ResizeObserver(updateTopicRailState)
    resizeObserver.observe(topicRail.value)
  }
  globalThis.window?.addEventListener('resize', updateTopicRailState)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  globalThis.window?.removeEventListener('resize', updateTopicRailState)
})
</script>
