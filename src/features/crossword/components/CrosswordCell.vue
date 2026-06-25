<template>
  <!-- Grid Cell | Presents one focusable neon square with non-color status cues -->
  <button
    class="cw-cell"
    :class="{
      'cw-cell--selected': selected,
      'cw-cell--active-word': activeWord,
      'cw-cell--incorrect': incorrect,
      'cw-cell--checked': checked && !incorrect,
      'cw-cell--revealed': revealed,
      'cw-cell--completed': completed
    }"
    type="button"
    role="gridcell"
    :tabindex="selected ? 0 : -1"
    :data-cell-key="cell.key"
    :data-selected="selected ? 'true' : 'false'"
    :aria-selected="selected"
    :aria-label="ariaLabel"
    @click="$emit('select', cell.key)"
    @keydown="$emit('cell-keydown', $event)"
  >
    <span v-if="cell.number" class="cw-cell__number">{{ cell.number }}</span>
    <span class="cw-cell__letter">{{ letter }}</span>
    <span v-if="incorrect" class="cw-cell__marker" aria-hidden="true">×</span>
    <span v-else-if="revealed" class="cw-cell__marker" aria-hidden="true">•</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cell: {
    type: Object,
    required: true
  },
  letter: {
    type: String,
    default: ''
  },
  selected: Boolean,
  activeWord: Boolean,
  checked: Boolean,
  incorrect: Boolean,
  revealed: Boolean,
  completed: Boolean
})

defineEmits(['select', 'cell-keydown'])

const ariaLabel = computed(() => {
  const number = props.cell.number ? `Number ${props.cell.number}. ` : ''
  const value = props.letter ? `Letter ${props.letter}.` : 'Empty.'
  const status = props.incorrect
    ? ' Marked incorrect.'
    : props.revealed
      ? ' Revealed letter.'
      : props.completed
        ? ' Word completed.'
        : ''

  return `${number}Row ${props.cell.row + 1}, column ${props.cell.col + 1}. ${value}${status}`
})
</script>
