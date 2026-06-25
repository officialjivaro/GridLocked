import { reactive, watch } from 'vue'
import { loadSettings, saveSettings } from '../services/gameStorage.js'

// Game Preferences | Exposes a small persisted settings object to the crossword UI
export function useGameSettings() {
  const settings = reactive(loadSettings())

  watch(
    settings,
    (value) => saveSettings({ ...value }),
    { deep: true }
  )

  function updateSetting(key, value) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      settings[key] = Boolean(value)
    }
  }

  return {
    settings,
    updateSetting
  }
}
