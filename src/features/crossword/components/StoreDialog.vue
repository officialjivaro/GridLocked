<template>
  <!-- Store Placeholder | Provides a polished destination without implying purchases are available -->
  <div
    v-if="open"
    class="cw-modal-backdrop cw-store-backdrop"
    role="presentation"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <section class="cw-modal cw-store-dialog" role="dialog" aria-modal="true" aria-labelledby="store-title">
      <div class="cw-modal__header">
        <div>
          <p class="cw-kicker">Coming soon</p>
          <h2 id="store-title">Arcade store</h2>
          <p class="cw-store-dialog__intro">Future cosmetic rewards will live here. Nothing can be purchased yet.</p>
        </div>
        <button
          ref="closeButton"
          class="cw-icon-button cw-icon-button--panel"
          type="button"
          aria-label="Close arcade store"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <div class="cw-store-preview" aria-label="Planned store items">
        <article>
          <span aria-hidden="true">🎨</span>
          <div><strong>Board themes</strong><small>Swap neon palettes and tile styles.</small></div>
          <b>Soon</b>
        </article>
        <article>
          <span aria-hidden="true">🎵</span>
          <div><strong>Sound packs</strong><small>Choose different arcade feedback sets.</small></div>
          <b>Soon</b>
        </article>
        <article>
          <span aria-hidden="true">🏅</span>
          <div><strong>Player badges</strong><small>Show off puzzle milestones locally.</small></div>
          <b>Soon</b>
        </article>
      </div>

      <button ref="primaryButton" class="cw-button cw-button--primary cw-button--wide" type="button" @click="$emit('close')">
        Back to the arcade
      </button>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean
})

defineEmits(['close'])

const closeButton = ref(null)
const primaryButton = ref(null)
let previousFocus = null

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = globalThis.document?.activeElement ?? null
      await nextTick()
      primaryButton.value?.focus()
      return
    }

    await nextTick()
    previousFocus?.focus?.()
    previousFocus = null
  }
)
</script>
