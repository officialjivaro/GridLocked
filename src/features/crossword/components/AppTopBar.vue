<template>
  <!-- Arcade Header | Provides external navigation, setup branding, and the compact active-game HUD -->
  <header class="cw-topbar" :class="`cw-topbar--${phase}`">
    <a class="cw-topbar__games" :href="gamesUrl" aria-label="Return to Jivaro games">
      <span aria-hidden="true">←</span>
      <span class="cw-topbar__games-label">Games</span>
    </a>

    <div v-if="phase === 'setup'" class="cw-topbar__brand" aria-label="Jivaro Crossword">
      <span class="cw-topbar__logo" aria-hidden="true">✦</span>
      <div>
        <p class="cw-topbar__eyebrow">Jivaro Arcade</p>
        <h1>Crossword</h1>
      </div>
    </div>

    <GameStatusBar
      v-else
      :topic-label="topicLabel"
      :difficulty-label="difficultyLabel"
      :progress-percent="progressPercent"
      :filled-cell-count="filledCellCount"
      :total-cells="totalCells"
      :formatted-time="formattedTime"
      :show-timer="showTimer"
      :reveal-count="revealCount"
    />

    <div class="cw-topbar__actions">
      <button
        v-if="phase === 'setup'"
        class="cw-store-button"
        type="button"
        aria-label="Open placeholder arcade store"
        @click="$emit('open-store')"
      >
        <span aria-hidden="true">🛒</span>
        <span class="cw-store-button__label">Store</span>
        <small>Soon</small>
      </button>
      <button
        v-if="phase === 'setup'"
        class="cw-icon-button"
        type="button"
        aria-label="Open crossword statistics"
        @click="$emit('open-stats')"
      >
        <span aria-hidden="true">🏆</span>
      </button>
      <button class="cw-icon-button" type="button" aria-label="Open settings" @click="$emit('open-settings')">
        <span aria-hidden="true">⚙</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import GameStatusBar from './GameStatusBar.vue'

defineProps({
  gamesUrl: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    default: 'setup'
  },
  topicLabel: {
    type: String,
    default: ''
  },
  difficultyLabel: {
    type: String,
    default: ''
  },
  progressPercent: {
    type: Number,
    default: 0
  },
  filledCellCount: {
    type: Number,
    default: 0
  },
  totalCells: {
    type: Number,
    default: 0
  },
  formattedTime: {
    type: String,
    default: '00:00'
  },
  showTimer: Boolean,
  revealCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['open-settings', 'open-stats', 'open-store'])
</script>
