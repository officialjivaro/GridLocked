<template>
  <!-- Touch Keyboard | Uses three compact rows with Backspace inside the final row -->
  <section class="cw-keyboard" aria-label="On-screen keyboard">
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="cw-keyboard__row">
      <button
        v-for="key in row"
        :key="key"
        :class="{ 'cw-keyboard__backspace': key === backspaceKey }"
        type="button"
        :aria-label="key === backspaceKey ? 'Delete letter' : `Enter ${key}`"
        @click="pressKey(key)"
      >
        <template v-if="key === backspaceKey">
          <span aria-hidden="true">⌫</span>
          <span class="cw-keyboard__backspace-label">Delete</span>
        </template>
        <template v-else>{{ key }}</template>
      </button>
    </div>
  </section>
</template>

<script setup>
const backspaceKey = 'BACKSPACE'
const rows = [
  [...'QWERTYUIOP'],
  [...'ASDFGHJKL'],
  [...'ZXCVBNM', backspaceKey]
]

const emit = defineEmits(['input-letter', 'delete-letter'])

function pressKey(key) {
  if (key === backspaceKey) {
    emit('delete-letter')
  } else {
    emit('input-letter', key)
  }
}
</script>
