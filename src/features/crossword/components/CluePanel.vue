<template>
  <!-- Clue Lists | Reuses one accessible clue renderer for desktop and the mobile sheet -->
  <aside
    ref="panelRef"
    class="cw-clue-panel"
    :class="{ 'cw-clue-panel--sheet': isSheet }"
    aria-label="Crossword clues"
  >
    <div v-if="isSheet" class="cw-clue-sheet__header">
      <span class="cw-clue-sheet__handle" aria-hidden="true"></span>
      <div class="cw-clue-sheet__title-row">
        <div>
          <p class="cw-kicker">Clue deck</p>
          <h2>Across &amp; Down</h2>
        </div>
        <button class="cw-button cw-button--compact cw-button--ghost" type="button" @click="$emit('close')">
          Board
        </button>
      </div>

      <div class="cw-clue-tabs" role="tablist" aria-label="Clue direction">
        <button
          v-for="group in groups"
          :id="`cw-${group.direction}-tab`"
          :key="group.direction"
          type="button"
          role="tab"
          :aria-selected="activeTab === group.direction"
          :aria-controls="`cw-${group.direction}-clues`"
          :class="{ 'cw-clue-tab--active': activeTab === group.direction }"
          @click="activeTab = group.direction"
        >
          {{ group.label }}
          <span>{{ group.entries.length }}</span>
        </button>
      </div>
    </div>

    <div class="cw-clue-panel__scroll">
      <section
        v-for="group in visibleGroups"
        :id="`cw-${group.direction}-clues`"
        :key="group.direction"
        class="cw-clue-group"
        :role="isSheet ? 'tabpanel' : undefined"
        :aria-labelledby="isSheet ? `cw-${group.direction}-tab` : undefined"
      >
        <h2 v-if="!isSheet">{{ group.label }}</h2>
        <ol>
          <li v-for="entry in group.entries" :key="entry.id">
            <button
              class="cw-clue"
              :class="{
                'cw-clue--active': activeEntryId === entry.id,
                'cw-clue--solved': isSolved(entry)
              }"
              type="button"
              :data-entry-id="entry.id"
              @click="selectEntry(entry.id)"
            >
              <strong>{{ entry.number }}</strong>
              <span>{{ entry.clue }}</span>
              <small>({{ entry.length }})</small>
              <span v-if="isSolved(entry)" class="cw-clue__done" aria-label="Solved">✓</span>
            </button>
          </li>
        </ol>
      </section>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  puzzle: {
    type: Object,
    required: true
  },
  playerLetters: {
    type: Object,
    required: true
  },
  activeEntryId: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'desktop',
    validator: (value) => ['desktop', 'sheet'].includes(value)
  },
  reducedMotion: Boolean
})

const emit = defineEmits(['select-entry', 'close'])
const panelRef = ref(null)
const activeTab = ref('across')
const isSheet = computed(() => props.mode === 'sheet')

const groups = computed(() => [
  { direction: 'across', label: 'Across', entries: props.puzzle.acrossEntries },
  { direction: 'down', label: 'Down', entries: props.puzzle.downEntries }
])

const visibleGroups = computed(() => (
  isSheet.value
    ? groups.value.filter((group) => group.direction === activeTab.value)
    : groups.value
))

function isSolved(entry) {
  return entry.cells.every((key, index) => props.playerLetters[key] === entry.answer[index])
}

function selectEntry(entryId) {
  emit('select-entry', entryId)
  if (isSheet.value) {
    emit('close')
  }
}

async function centerActiveClue() {
  await nextTick()
  const activeClue = panelRef.value?.querySelector(`[data-entry-id="${props.activeEntryId}"]`)
  activeClue?.scrollIntoView({
    block: isSheet.value ? 'center' : 'nearest',
    inline: 'nearest',
    behavior: props.reducedMotion ? 'auto' : 'smooth'
  })
}

watch(
  () => props.activeEntryId,
  (entryId) => {
    const activeEntry = props.puzzle.entries.find((entry) => entry.id === entryId)
    if (activeEntry) {
      activeTab.value = activeEntry.direction
    }
    centerActiveClue()
  },
  { immediate: true }
)

watch(activeTab, centerActiveClue)
</script>
