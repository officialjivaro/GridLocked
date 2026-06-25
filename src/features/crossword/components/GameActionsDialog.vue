<template>
  <!-- More Actions Overlay | Keeps secondary help and destructive actions out of the main dock -->
  <div
    v-if="open"
    class="cw-modal-backdrop"
    role="presentation"
    @click.self="close"
    @keydown.esc="close"
  >
    <section class="cw-modal cw-actions-dialog" role="dialog" aria-modal="true" aria-labelledby="actions-title">
      <div class="cw-modal__header">
        <div>
          <p class="cw-kicker">Power panel</p>
          <h2 id="actions-title">More actions</h2>
        </div>
        <button
          ref="closeButton"
          class="cw-icon-button cw-icon-button--panel"
          type="button"
          aria-label="Close more actions"
          @click="close"
        >
          ×
        </button>
      </div>

      <div class="cw-actions-dialog__section">
        <h3>Check</h3>
        <div class="cw-actions-grid">
          <button ref="firstAction" type="button" @click="run('check-cell')">
            <span aria-hidden="true">▣</span>
            <strong>Check cell</strong>
            <small>Verify this square</small>
          </button>
          <button type="button" @click="run('check-puzzle')">
            <span aria-hidden="true">✓</span>
            <strong>Check puzzle</strong>
            <small>Verify filled squares</small>
          </button>
        </div>
      </div>

      <div class="cw-actions-dialog__section">
        <h3>Reveal</h3>
        <div class="cw-actions-grid">
          <button type="button" @click="run('request-reveal-word', true)">
            <span aria-hidden="true">💡</span>
            <strong>Reveal word</strong>
            <small>Fill the active answer</small>
          </button>
          <button class="cw-action-tile--warning" type="button" @click="run('request-reveal-puzzle', true)">
            <span aria-hidden="true">◇</span>
            <strong>Reveal puzzle</strong>
            <small>Fill every answer</small>
          </button>
        </div>
      </div>

      <button
        v-if="showKeyboardToggle"
        class="cw-actions-dialog__wide-action"
        type="button"
        @click="run('toggle-keyboard')"
      >
        <span aria-hidden="true">⌨</span>
        {{ keyboardVisible ? 'Hide on-screen keyboard' : 'Show on-screen keyboard' }}
      </button>

      <button class="cw-actions-dialog__new" type="button" @click="run('request-new-game', true)">
        <span aria-hidden="true">↻</span>
        Start a new puzzle
      </button>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  keyboardVisible: Boolean,
  showKeyboardToggle: Boolean
})

const emit = defineEmits([
  'close',
  'check-cell',
  'check-puzzle',
  'request-reveal-word',
  'request-reveal-puzzle',
  'request-new-game',
  'toggle-keyboard'
])

const closeButton = ref(null)
const firstAction = ref(null)
let previousFocus = null
let restoreFocusOnClose = true

function close() {
  restoreFocusOnClose = true
  emit('close')
}

function run(eventName, opensConfirmation = false) {
  restoreFocusOnClose = !opensConfirmation
  emit(eventName)
  emit('close')
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = globalThis.document?.activeElement ?? null
      restoreFocusOnClose = true
      await nextTick()
      if (firstAction.value) {
        firstAction.value.focus()
      } else {
        closeButton.value?.focus()
      }
      return
    }

    await nextTick()
    if (restoreFocusOnClose) {
      previousFocus?.focus?.()
    }
    previousFocus = null
  }
)
</script>
