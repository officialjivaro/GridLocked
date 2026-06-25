import { computed, onBeforeUnmount, ref } from 'vue'

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Active Timer | Counts visible play time and pauses when the page is hidden
export function useGameTimer({ onPersist } = {}) {
  const elapsedSeconds = ref(0)
  const isRunning = ref(false)
  let intervalId = null

  const formattedTime = computed(() => formatSeconds(elapsedSeconds.value))

  function stopInterval() {
    if (intervalId !== null) {
      globalThis.clearInterval(intervalId)
      intervalId = null
    }
  }

  function tick() {
    if (!isRunning.value || globalThis.document?.hidden) {
      return
    }

    elapsedSeconds.value += 1
    if (elapsedSeconds.value % 5 === 0) {
      onPersist?.()
    }
  }

  function start(initialSeconds = elapsedSeconds.value) {
    elapsedSeconds.value = Math.max(0, Number(initialSeconds) || 0)
    isRunning.value = true
    stopInterval()
    intervalId = globalThis.setInterval(tick, 1000)
  }

  function pause() {
    isRunning.value = false
    stopInterval()
    onPersist?.()
  }

  function reset() {
    pause()
    elapsedSeconds.value = 0
  }

  function handleVisibilityChange() {
    if (globalThis.document?.hidden) {
      onPersist?.()
    }
  }

  globalThis.document?.addEventListener('visibilitychange', handleVisibilityChange)

  onBeforeUnmount(() => {
    pause()
    globalThis.document?.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    formatSeconds
  }
}
