<template>
  <!-- Arcade Action Dock | Keeps the four most useful actions within thumb reach -->
  <section class="cw-controls" aria-label="Crossword controls">
    <button class="cw-control-button" type="button" :disabled="!canUndo" @click="$emit('undo')">
      <span class="cw-control-button__icon" aria-hidden="true">↶</span>
      <span>Undo</span>
    </button>

    <button class="cw-control-button" type="button" @click="$emit('check-word')">
      <span class="cw-control-button__icon" aria-hidden="true">✓</span>
      <span>Check</span>
    </button>

    <button class="cw-control-button cw-control-button--hint" type="button" @click="$emit('reveal-letter')">
      <span class="cw-control-button__icon" aria-hidden="true">💡</span>
      <span>Hint</span>
    </button>

    <button ref="moreButton" class="cw-control-button" type="button" @click="$emit('open-more')">
      <span class="cw-control-button__icon" aria-hidden="true">•••</span>
      <span>More</span>
    </button>
  </section>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  canUndo: Boolean
})

defineEmits(['undo', 'check-word', 'reveal-letter', 'open-more'])

const moreButton = ref(null)

defineExpose({
  focusMore: () => moreButton.value?.focus()
})
</script>
