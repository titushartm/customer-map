// Gong für den Showcase (neuer Kunde), mit Web Audio erzeugt, ohne Tondatei.
// Browser spielen Ton erst nach einer Bedienung der Seite (Klick, Taste): unlockAudio() im Klick- bzw. Tasten-Handler
// aufrufen. Ohne Bedienung bleibt der AudioContext "suspended", resume() wartet dann bis zum ersten Klick; daher nie
// darauf warten, sondern den Zustand abfragen (audioReady) bzw. auf onAudioChange hören.

let ctx = null

/** Ton freischalten (im Klick- oder Tasten-Handler aufrufen); legt den AudioContext beim ersten Mal an */
export function unlockAudio() {
  ctx ??= new AudioContext()
  if (ctx.state !== 'running') ctx.resume().catch(() => {})
  return audioReady()
}

export const audioReady = () => ctx?.state === 'running'

/** Meldet jede Änderung, ob Ton spielen kann; gibt die Funktion zum Abmelden zurück */
export function onAudioChange(callback) {
  ctx ??= new AudioContext()
  const handler = () => callback(audioReady())
  ctx.addEventListener('statechange', handler)
  return () => ctx.removeEventListener('statechange', handler)
}

// Teiltöne eines Gongs: nicht harmonisch, die hohen klingen schneller ab. [Verhältnis, Lautstärke, Abklingzeit in s]
// Grundton D3: tiefer geben Laptop-Lautsprecher kaum wieder, dann bliebe vom Gong fast nichts.
const PARTIALS = [[1, 1, 6], [1.006, 0.7, 6], [1.48, 0.6, 4.5], [2.09, 0.5, 3.6], [2.56, 0.4, 3], [3.17, 0.32, 2.4], [4.12, 0.22, 1.8], [5.43, 0.14, 1.2], [6.8, 0.08, 0.8]]
const BASE_HZ = 147

/**
 * Einmal Gong. Ist der Ton noch nicht frei, kurz auf das Freischalten warten (gleiche Taste/derselbe Klick hat es
 * gerade angestoßen); sonst passiert nichts. true, wenn er gespielt wurde.
 */
export async function playGong({ volume = 0.9 } = {}) {
  ctx ??= new AudioContext()
  if (!audioReady()) {
    ctx.resume().catch(() => {})
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 800)
      ctx.addEventListener('statechange', () => { clearTimeout(timer); resolve() }, { once: true })
    })
    if (!audioReady()) return false
  }
  strike(ctx, ctx.destination, ctx.currentTime, volume)
  return true
}

/** Der Klang selbst, auf beliebigem Kontext (auch OfflineAudioContext zum Prüfen) */
export function strike(audio, destination, t, volume = 0.9) {
  // Kompressor hebt das Abklingen an, damit der Gong auch leise Lautsprecher füllt, ohne zu übersteuern
  const comp = audio.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 4
  const out = audio.createGain()
  out.gain.value = volume
  comp.connect(out).connect(destination)

  for (const [ratio, gain, decay] of PARTIALS) {
    const osc = audio.createOscillator()
    // Beim Anschlag minimal höher, dann gleitet der Ton auf die Grundfrequenz
    osc.frequency.setValueAtTime(BASE_HZ * ratio * 1.015, t)
    osc.frequency.exponentialRampToValueAtTime(BASE_HZ * ratio, t + 0.5)
    const env = audio.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain * 0.3, t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    osc.connect(env).connect(comp)
    osc.start(t)
    osc.stop(t + decay + 0.1)
  }

  // Anschlag des Klöppels: kurzes, metallisches Rauschen
  const len = Math.floor(audio.sampleRate * 0.12)
  const buffer = audio.createBuffer(1, len, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const noise = audio.createBufferSource()
  noise.buffer = buffer
  const band = audio.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2400
  band.Q.value = 0.8
  const hit = audio.createGain()
  hit.gain.value = 0.5
  noise.connect(band).connect(hit).connect(comp)
  noise.start(t)
}
