let ctx: AudioContext | null = null
let muted = false

function ac(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(v: boolean): void {
  muted = v
  if (v && ctx) void ctx.suspend()
  else if (!v) ac()
}

export function unlock(): void {
  ac()
}

function env(c: AudioContext, t: number, attack: number, decay: number, peak: number): GainNode {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

function tone(c: AudioContext, t: number, freq: number, type: OscillatorType, attack: number, decay: number, peak: number, dest?: AudioNode): void {
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  const g = env(c, t, attack, decay, peak)
  o.connect(g)
  g.connect(dest ?? c.destination)
  o.start(t)
  o.stop(t + attack + decay + 0.02)
}

function noise(c: AudioContext, t: number, dur: number, peak: number, hp: number, lp: number): void {
  const n = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const hi = c.createBiquadFilter()
  hi.type = 'highpass'
  hi.frequency.value = hp
  const lo = c.createBiquadFilter()
  lo.type = 'lowpass'
  lo.frequency.value = lp
  const g = env(c, t, 0.004, dur, peak)
  src.connect(hi)
  hi.connect(lo)
  lo.connect(g)
  g.connect(c.destination)
  src.start(t)
  src.stop(t + dur + 0.03)
}

export function paper(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  noise(c, t, 0.07, 0.09, 900, 4200)
}

export function wood(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  tone(c, t, 170, 'sine', 0.004, 0.12, 0.16)
  tone(c, t, 92, 'triangle', 0.004, 0.16, 0.08)
  noise(c, t, 0.04, 0.05, 200, 1800)
}

export function toru(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  tone(c, t, 420, 'triangle', 0.003, 0.07, 0.11)
  tone(c, t + 0.03, 210, 'sine', 0.003, 0.11, 0.1)
  noise(c, t, 0.045, 0.06, 400, 2500)
}

export function miru(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  tone(c, t, 523.25, 'sine', 0.02, 0.35, 0.07)
  tone(c, t + 0.08, 783.99, 'sine', 0.03, 0.42, 0.05)
}

export function utsu(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  noise(c, t, 0.05, 0.12, 200, 1600)
  tone(c, t, 80, 'sine', 0.004, 0.18, 0.18)
}

export function hit(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime + 0.08
  tone(c, t, 659.25, 'sine', 0.01, 0.28, 0.09)
  tone(c, t + 0.04, 987.77, 'sine', 0.01, 0.32, 0.05)
}

export function miss(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime + 0.06
  noise(c, t, 0.14, 0.08, 120, 700)
  tone(c, t, 140, 'triangle', 0.01, 0.22, 0.06)
}

export function collide(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime + 0.05
  tone(c, t, 260, 'triangle', 0.003, 0.08, 0.1)
  tone(c, t + 0.05, 190, 'triangle', 0.003, 0.1, 0.09)
  noise(c, t, 0.06, 0.05, 300, 2000)
}

export function sky(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  noise(c, t, 0.35, 0.035, 80, 900)
  tone(c, t, 196, 'sine', 0.08, 0.55, 0.04)
}

export function stamp(): void {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  noise(c, t, 0.06, 0.1, 250, 1800)
  tone(c, t, 110, 'sine', 0.004, 0.2, 0.14)
  tone(c, t + 0.05, 330, 'sine', 0.01, 0.18, 0.05)
}
