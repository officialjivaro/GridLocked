let audioContext = null

function getAudioContext() {
  if (typeof globalThis.window === 'undefined') {
    return null
  }

  const AudioContextClass = globalThis.window.AudioContext || globalThis.window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }

  audioContext ??= new AudioContextClass()
  return audioContext
}

function connectOutput(context, node, pan = 0) {
  if (typeof context.createStereoPanner !== 'function') {
    node.connect(context.destination)
    return
  }

  const panner = context.createStereoPanner()
  panner.pan.value = Math.max(-1, Math.min(1, pan))
  node.connect(panner)
  panner.connect(context.destination)
}

function tone(context, {
  frequency,
  endFrequency = frequency,
  duration = 0.06,
  volume = 0.026,
  delay = 0,
  attack = 0.006,
  type = 'square',
  pan = 0
}) {
  const start = context.currentTime + delay
  const stop = start + duration
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(Math.max(1, frequency), start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), stop)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + Math.min(attack, duration / 2))
  gain.gain.exponentialRampToValueAtTime(0.0001, stop)
  oscillator.connect(gain)
  connectOutput(context, gain, pan)
  oscillator.start(start)
  oscillator.stop(stop + 0.02)
}

function noiseBurst(context, {
  duration = 0.045,
  volume = 0.008,
  delay = 0,
  pan = 0
} = {}) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const samples = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    const fade = 1 - index / frameCount
    samples[index] = (Math.random() * 2 - 1) * fade
  }

  const source = context.createBufferSource()
  const gain = context.createGain()
  const start = context.currentTime + delay
  source.buffer = buffer
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(gain)
  connectOutput(context, gain, pan)
  source.start(start)
  source.stop(start + duration + 0.02)
}

function playPattern({ notes = [], noise = [] }) {
  const context = getAudioContext()
  if (!context) {
    return
  }

  const play = () => {
    notes.forEach((note) => tone(context, note))
    noise.forEach((burst) => noiseBurst(context, burst))
  }

  if (context.state === 'suspended') {
    context.resume().then(play).catch(() => {})
  } else {
    play()
  }
}

// Arcade Sound Feedback | Uses layered synthesized effects without bundled audio files
export function playCrosswordSound(kind, enabled = true) {
  if (!enabled) {
    return
  }

  try {
    if (kind === 'menu') {
      playPattern({
        notes: [
          { frequency: 520, endFrequency: 680, duration: 0.045, volume: 0.014, type: 'square', pan: -0.18 },
          { frequency: 920, endFrequency: 1100, duration: 0.04, volume: 0.009, delay: 0.025, type: 'sine', pan: 0.2 }
        ]
      })
    } else if (kind === 'start') {
      playPattern({
        notes: [
          { frequency: 330, duration: 0.08, volume: 0.02, type: 'triangle', pan: -0.3 },
          { frequency: 440, duration: 0.08, volume: 0.022, delay: 0.065, type: 'triangle', pan: -0.1 },
          { frequency: 660, duration: 0.1, volume: 0.024, delay: 0.13, type: 'triangle', pan: 0.15 },
          { frequency: 990, endFrequency: 1320, duration: 0.16, volume: 0.02, delay: 0.2, type: 'sine', pan: 0.35 }
        ],
        noise: [{ duration: 0.07, volume: 0.004, delay: 0.19, pan: 0.2 }]
      })
    } else if (kind === 'input') {
      playPattern({
        notes: [
          { frequency: 700, endFrequency: 930, duration: 0.035, volume: 0.016, type: 'square', pan: -0.08 },
          { frequency: 1180, endFrequency: 920, duration: 0.028, volume: 0.006, delay: 0.012, type: 'sine', pan: 0.1 }
        ],
        noise: [{ duration: 0.024, volume: 0.003 }]
      })
    } else if (kind === 'error') {
      playPattern({
        notes: [
          { frequency: 230, endFrequency: 150, duration: 0.095, volume: 0.028, type: 'sawtooth', pan: -0.18 },
          { frequency: 155, endFrequency: 105, duration: 0.11, volume: 0.024, delay: 0.075, type: 'square', pan: 0.18 }
        ],
        noise: [{ duration: 0.07, volume: 0.006, delay: 0.02 }]
      })
    } else if (kind === 'reveal') {
      playPattern({
        notes: [
          { frequency: 420, endFrequency: 620, duration: 0.075, volume: 0.018, type: 'sine', pan: -0.35 },
          { frequency: 650, endFrequency: 910, duration: 0.08, volume: 0.018, delay: 0.055, type: 'triangle', pan: 0 },
          { frequency: 980, endFrequency: 1480, duration: 0.12, volume: 0.014, delay: 0.11, type: 'sine', pan: 0.35 }
        ],
        noise: [{ duration: 0.06, volume: 0.003, delay: 0.1, pan: 0.3 }]
      })
    } else if (kind === 'word-complete') {
      playPattern({
        notes: [
          { frequency: 620, duration: 0.085, volume: 0.022, type: 'triangle', pan: -0.32 },
          { frequency: 830, duration: 0.095, volume: 0.024, delay: 0.07, type: 'triangle' },
          { frequency: 1040, duration: 0.13, volume: 0.021, delay: 0.145, type: 'sine', pan: 0.32 },
          { frequency: 1560, endFrequency: 1180, duration: 0.11, volume: 0.009, delay: 0.16, type: 'sine', pan: 0.45 }
        ]
      })
    } else if (kind === 'store') {
      playPattern({
        notes: [
          { frequency: 988, duration: 0.07, volume: 0.018, type: 'square', pan: -0.22 },
          { frequency: 1318, duration: 0.09, volume: 0.02, delay: 0.06, type: 'triangle', pan: 0.22 },
          { frequency: 1975, endFrequency: 1480, duration: 0.13, volume: 0.012, delay: 0.125, type: 'sine' }
        ],
        noise: [{ duration: 0.035, volume: 0.0035, delay: 0.045 }]
      })
    } else if (kind === 'home') {
      playPattern({
        notes: [
          { frequency: 720, endFrequency: 560, duration: 0.07, volume: 0.016, type: 'triangle', pan: 0.18 },
          { frequency: 440, endFrequency: 520, duration: 0.09, volume: 0.018, delay: 0.06, type: 'sine', pan: -0.18 }
        ]
      })
    } else if (kind === 'complete') {
      playPattern({
        notes: [
          { frequency: 262, duration: 0.18, volume: 0.022, type: 'square', pan: -0.35 },
          { frequency: 523, duration: 0.12, volume: 0.028, type: 'triangle', pan: -0.3 },
          { frequency: 659, duration: 0.12, volume: 0.029, delay: 0.105, type: 'triangle', pan: -0.08 },
          { frequency: 784, duration: 0.14, volume: 0.03, delay: 0.21, type: 'triangle', pan: 0.12 },
          { frequency: 1046, duration: 0.24, volume: 0.027, delay: 0.325, type: 'sine', pan: 0.34 },
          { frequency: 1568, endFrequency: 2093, duration: 0.28, volume: 0.014, delay: 0.42, type: 'sine', pan: 0.45 },
          { frequency: 392, endFrequency: 523, duration: 0.3, volume: 0.012, delay: 0.36, type: 'triangle', pan: -0.4 }
        ],
        noise: [
          { duration: 0.16, volume: 0.006, delay: 0.31, pan: -0.4 },
          { duration: 0.18, volume: 0.006, delay: 0.44, pan: 0.4 }
        ]
      })
    }
  } catch {
    // Audio is optional and may be blocked by browser policy.
  }
}
