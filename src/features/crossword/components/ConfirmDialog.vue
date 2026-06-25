<template>
  <!-- Confirmation Modal | Guards reveals and destructive new-game actions -->
  <div v-if="open" class="cw-modal-backdrop" role="presentation" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section class="cw-modal cw-modal--small" role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="messageId">
      <span class="cw-modal__symbol" aria-hidden="true">{{ symbol }}</span>
      <h2 :id="titleId">{{ title }}</h2>
      <p :id="messageId">{{ message }}</p>
      <div class="cw-modal__actions">
        <button ref="cancelButton" class="cw-button cw-button--ghost" type="button" @click="$emit('close')">Cancel</button>
        <button class="cw-button" :class="danger ? 'cw-button--danger' : 'cw-button--primary'" type="button" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmLabel: {
    type: String,
    default: 'Confirm'
  },
  symbol: {
    type: String,
    default: '?'
  },
  danger: Boolean
})

defineEmits(['close', 'confirm'])

const cancelButton = ref(null)
const titleId = 'cw-confirm-title'
const messageId = 'cw-confirm-message'

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      cancelButton.value?.focus()
    }
  }
)
</script>
