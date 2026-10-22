import type { MeteorTone } from './types.ts'

let context: AudioContext | null = null
let live: AudioScheduledSourceNode[] = []

function audio(): AudioContext | null {
  const AudioCtx = window.AudioContext
  if (!AudioCtx) return null
  if (!context || context.state === 'closed') context = new AudioCtx()
  if (context.state === 'suspended') void context.resume()
  return context
}

export function stopWishSound(): void {
  for (const node of live) {
    try {
      node.stop()
    } catch {
      // 已经停过
    }
  }
  live = []
}

function bell(ctx: AudioContext, when: number, frequency: number, duration: number, gain: number, type: OscillatorType) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, when)
  amp.gain.setValueAtTime(0.0001, when)
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration + 0.03)
  live.push(osc)
}

function whoosh(ctx: AudioContext, when: number) {
  const length = Math.floor(ctx.sampleRate * 0.28)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(900, when)
  filter.frequency.exponentialRampToValueAtTime(2400, when + 0.22)
  filter.Q.value = 0.7
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, when)
  amp.gain.exponentialRampToValueAtTime(0.04, when + 0.04)
  amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.26)
  noise.connect(filter)
  filter.connect(amp)
  amp.connect(ctx.destination)
  noise.start(when)
  noise.stop(when + 0.28)
  live.push(noise)
}

export function playWishSounds(tones: MeteorTone[]): void {
  const ctx = audio()
  if (!ctx || tones.length === 0) return
  stopWishSound()
  const stagger = tones.length === 1 ? 0 : 0.115
  const now = ctx.currentTime + 0.02
  whoosh(ctx, now)
  tones.forEach((tone, index) => {
    const at = now + 0.16 + index * stagger
    if (tone === 'blue') {
      bell(ctx, at, 698, 0.18, 0.045, 'sine')
      return
    }
    if (tone === 'purple') {
      bell(ctx, at, 880, 0.28, 0.07, 'triangle')
      bell(ctx, at, 1320, 0.2, 0.024, 'sine')
      return
    }
    if (tone === 'gold') {
      bell(ctx, at, 784, 0.55, 0.08, 'triangle')
      bell(ctx, at + 0.05, 1175, 0.42, 0.04, 'sine')
      bell(ctx, at + 0.1, 1568, 0.36, 0.022, 'sine')
      return
    }
    bell(ctx, at, 784, 0.22, 0.07, 'sine')
    bell(ctx, at + 0.07, 988, 0.22, 0.055, 'sine')
    bell(ctx, at + 0.14, 1175, 0.34, 0.07, 'triangle')
    bell(ctx, at + 0.2, 1568, 0.28, 0.035, 'sine')
  })
}

export function playReveal(tones: MeteorTone[]): void {
  const ctx = audio()
  if (!ctx || tones.length === 0) return
  const best: MeteorTone = tones.includes('rainbow')
    ? 'rainbow'
    : tones.includes('gold')
      ? 'gold'
      : tones.includes('purple')
        ? 'purple'
        : 'blue'
  const now = ctx.currentTime + 0.02
  if (best === 'blue') {
    bell(ctx, now, 523, 0.16, 0.035, 'sine')
    return
  }
  if (best === 'purple') {
    bell(ctx, now, 659, 0.22, 0.055, 'triangle')
    bell(ctx, now + 0.06, 880, 0.2, 0.035, 'sine')
    return
  }
  if (best === 'gold') {
    bell(ctx, now, 784, 0.4, 0.065, 'triangle')
    bell(ctx, now + 0.08, 988, 0.36, 0.045, 'sine')
    bell(ctx, now + 0.16, 1175, 0.42, 0.05, 'sine')
    return
  }
  bell(ctx, now, 880, 0.2, 0.055, 'sine')
  bell(ctx, now + 0.08, 1175, 0.22, 0.045, 'sine')
  bell(ctx, now + 0.16, 1568, 0.36, 0.055, 'triangle')
}
