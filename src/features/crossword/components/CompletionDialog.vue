<template>
  <!-- Completion Stage | Celebrates the result and offers clear next destinations -->
  <div
    v-if="open && result"
    class="cw-modal-backdrop cw-modal-backdrop--celebrate"
    role="presentation"
    @keydown.esc="$emit('home')"
  >
    <section class="cw-modal cw-completion" role="dialog" aria-modal="true" aria-labelledby="completion-title">
      <div class="cw-completion__aurora" aria-hidden="true"></div>
      <div class="cw-confetti" aria-hidden="true">
        <span v-for="index in 24" :key="index"></span>
      </div>

      <header class="cw-completion__header">
        <div class="cw-completion__trophy" aria-hidden="true">
          <span>🏆</span>
          <i></i><i></i><i></i>
        </div>
        <div>
          <p class="cw-kicker">Level cleared</p>
          <h2 id="completion-title">Puzzle complete!</h2>
          <p class="cw-completion__subtitle">{{ topicLabel }} · {{ result.difficultyLabel }}</p>
        </div>
      </header>

      <div class="cw-completion__score-card">
        <span>Final score</span>
        <strong aria-live="polite">{{ displayedScore.toLocaleString() }}</strong>
        <div class="cw-completion__rank" :aria-label="`${starCount} star clear rank`">
          <span
            v-for="star in 3"
            :key="star"
            :class="{ 'cw-completion__star--earned': star <= starCount }"
            aria-hidden="true"
          >
            ★
          </span>
          <small>{{ rankLabel }}</small>
        </div>
      </div>

      <div class="cw-result-grid cw-result-grid--completion">
        <div><span aria-hidden="true">◷</span><strong>{{ formatTime(result.elapsedSeconds) }}</strong><small>Time</small></div>
        <div><span aria-hidden="true">▦</span><strong>{{ result.words }}</strong><small>Words</small></div>
        <div><span aria-hidden="true">✓</span><strong>{{ result.checks }}</strong><small>Checks</small></div>
        <div><span aria-hidden="true">💡</span><strong>{{ result.reveals }}</strong><small>Reveals</small></div>
      </div>

      <p v-if="result.perfect" class="cw-perfect-banner">
        <span aria-hidden="true">✨</span>
        Perfect clear — bonus earned!
      </p>
      <p v-else class="cw-completion__encouragement">Every solved grid powers up your local arcade record.</p>

      <div class="cw-completion__actions">
        <button class="cw-completion-action cw-completion-action--home" type="button" @click="$emit('home')">
          <span aria-hidden="true">⌂</span>
          <strong>Home</strong>
          <small>Game menu</small>
        </button>

        <button ref="primaryButton" class="cw-completion-action cw-completion-action--play" type="button" @click="$emit('play-again')">
          <span aria-hidden="true">▶</span>
          <strong>Play again</strong>
          <small>Same channel</small>
        </button>

        <button class="cw-completion-action cw-completion-action--store" type="button" @click="$emit('open-store')">
          <span aria-hidden="true">🛒</span>
          <strong>Store</strong>
          <small>Coming soon</small>
        </button>
      </div>

      <a class="cw-completion__games-link" :href="gamesUrl">
        <span aria-hidden="true">←</span>
        Return to all Jivaro games
      </a>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  result: {
    type: Object,
    default: null
  },
  gamesUrl: {
    type: String,
    required: true
  },
  topicLabel: {
    type: String,
    default: 'All Topics'
  },
  reducedMotion: Boolean
})

defineEmits(['play-again', 'home', 'open-store'])

const displayedScore = ref(0)
const primaryButton = ref(null)
let animationFrame = null
let previousFocus = null

const starCount = computed(() => {
  if (props.result?.perfect) {
    return 3
  }
  if ((props.result?.reveals ?? 0) <= 2) {
    return 2
  }
  return 1
})

const rankLabel = computed(() => (
  starCount.value === 3 ? 'Perfect clear' : starCount.value === 2 ? 'Bright clear' : 'Puzzle clear'
))

function formatTime(value) {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function stopScoreAnimation() {
  if (animationFrame !== null) {
    globalThis.cancelAnimationFrame?.(animationFrame)
    animationFrame = null
  }
}

function animateScore() {
  stopScoreAnimation()
  const target = Number(props.result?.score) || 0

  if (props.reducedMotion || !globalThis.requestAnimationFrame) {
    displayedScore.value = target
    return
  }

  const start = globalThis.performance?.now?.() ?? Date.now()
  const duration = 900

  const update = (now) => {
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayedScore.value = Math.round(target * eased)

    if (progress < 1) {
      animationFrame = globalThis.requestAnimationFrame(update)
    } else {
      animationFrame = null
    }
  }

  animationFrame = globalThis.requestAnimationFrame(update)
}

watch(
  () => [props.open, props.result?.score, props.reducedMotion],
  async ([isOpen]) => {
    if (isOpen) {
      previousFocus = globalThis.document?.activeElement ?? null
      displayedScore.value = 0
      animateScore()
      await nextTick()
      primaryButton.value?.focus()
      return
    }

    stopScoreAnimation()
    await nextTick()
    previousFocus?.focus?.()
    previousFocus = null
  },
  { immediate: true }
)

onBeforeUnmount(stopScoreAnimation)
</script>
