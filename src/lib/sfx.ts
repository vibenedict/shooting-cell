// Tiny procedural sound effects via Web Audio API — no audio files to fetch,
// license, or host. Context is created lazily on first call, which always
// happens from a real user gesture (pointerdown/keydown) or shortly after.
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!ctx) ctx = new AudioCtor()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Short descending laser blip — player fires. */
export function playFire() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(880, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(240, c.currentTime + 0.09)
  gain.gain.setValueAtTime(0.05, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.1)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.11)
}

/** Filtered noise burst — enemy blast / explosion. */
export function playBlast() {
  const c = getCtx()
  if (!c) return
  const dur = 0.25
  const bufferSize = Math.floor(c.sampleRate * dur)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const noise = c.createBufferSource()
  noise.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(100, c.currentTime + dur)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.16, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
  noise.connect(filter).connect(gain).connect(c.destination)
  noise.start()
}

/** Low sawtooth thud — player takes a hit. */
export function playHit() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.2)
  gain.gain.setValueAtTime(0.14, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.22)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.22)
}
