<template>
  <!-- Statistics Overlay | Keeps progress details off the focused arcade home screen -->
  <div
    v-if="open"
    class="cw-modal-backdrop"
    role="presentation"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <section class="cw-modal cw-stats-dialog" role="dialog" aria-modal="true" aria-labelledby="stats-title">
      <div class="cw-modal__header">
        <div>
          <p class="cw-kicker">Local high scores</p>
          <h2 id="stats-title">Player stats</h2>
        </div>
        <button
          ref="closeButton"
          class="cw-icon-button cw-icon-button--panel"
          type="button"
          aria-label="Close statistics"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <div class="cw-stat-grid">
        <div>
          <span class="cw-stat-grid__icon" aria-hidden="true">✓</span>
          <strong>{{ stats.completed }}</strong>
          <span>Completed</span>
        </div>
        <div>
          <span class="cw-stat-grid__icon" aria-hidden="true">★</span>
          <strong>{{ stats.perfect }}</strong>
          <span>Perfect</span>
        </div>
        <div>
          <span class="cw-stat-grid__icon" aria-hidden="true">⚡</span>
          <strong>{{ stats.bestScores.normal || '—' }}</strong>
          <span>Best normal score</span>
        </div>
        <div>
          <span class="cw-stat-grid__icon" aria-hidden="true">◷</span>
          <strong>{{ formatTime(stats.bestTimes.normal) }}</strong>
          <span>Best normal time</span>
        </div>
      </div>

      <button class="cw-button cw-button--primary cw-button--wide" type="button" @click="$emit('close')">
        Back to the arcade
      </button>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  stats: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const closeButton = ref(null)
let previousFocus = null

function formatTime(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = globalThis.document?.activeElement ?? null
      await nextTick()
      closeButton.value?.focus()
      return
    }

    await nextTick()
    previousFocus?.focus?.()
    previousFocus = null
  }
)
</script>
