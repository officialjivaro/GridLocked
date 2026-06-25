<template>
  <!-- Game HUD Status | Compresses puzzle identity, progress, time, and reveals into the top bar -->
  <section class="cw-hud-status" aria-label="Puzzle status">
    <div class="cw-hud-status__identity">
      <strong>{{ topicLabel }}</strong>
      <span>{{ difficultyLabel }}</span>
    </div>

    <div class="cw-hud-status__metrics">
      <span v-if="showTimer" title="Active play time">⏱ {{ formattedTime }}</span>
      <span title="Revealed letters">💡 {{ revealCount }}</span>
    </div>

    <div class="cw-hud-progress" :aria-label="`${progressPercent}% of cells filled`">
      <span aria-hidden="true" :style="{ width: `${progressPercent}%` }"></span>
      <small>{{ filledCellCount }}/{{ totalCells }}</small>
    </div>
  </section>
</template>

<script setup>
defineProps({
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
</script>
