<template>
  <!-- Settings Modal | Controls local accessibility and feedback preferences -->
  <div v-if="open" class="cw-modal-backdrop" role="presentation" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section class="cw-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="cw-modal__header">
        <div>
          <p class="cw-kicker">Preferences</p>
          <h2 id="settings-title">Game settings</h2>
        </div>
        <button ref="closeButton" class="cw-icon-button cw-icon-button--light" type="button" aria-label="Close settings" @click="$emit('close')">×</button>
      </div>

      <div class="cw-settings-list">
        <label>
          <span><strong>Sound effects</strong><small>Play small tones for input and feedback.</small></span>
          <input type="checkbox" :checked="settings.soundEnabled" @change="update('soundEnabled', $event)">
        </label>
        <label>
          <span><strong>Show timer</strong><small>Display active play time in the status bar.</small></span>
          <input type="checkbox" :checked="settings.showTimer" @change="update('showTimer', $event)">
        </label>
        <label>
          <span><strong>Easy error highlighting</strong><small>Mark wrong letters immediately in Easy mode.</small></span>
          <input type="checkbox" :checked="settings.easyAutoCheck" @change="update('easyAutoCheck', $event)">
        </label>
        <label>
          <span><strong>Reduce motion</strong><small>Turn off nonessential transitions and celebrations.</small></span>
          <input type="checkbox" :checked="settings.reducedMotion" @change="update('reducedMotion', $event)">
        </label>
      </div>

      <button class="cw-button cw-button--primary cw-button--wide" type="button" @click="$emit('close')">Done</button>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update-setting'])
const closeButton = ref(null)
let previousFocus = null

function update(key, event) {
  emit('update-setting', key, event.target.checked)
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
