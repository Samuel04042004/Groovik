// Lightweight Web Audio snare-ish synth. No assets needed, low latency.
let ctx: AudioContext | null = null;
export function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/** Schedule a snare hit at `when` (audio time, seconds). accent makes it louder/brighter. */
export function scheduleSnare(when: number, accent = false) {
  const ac = getAudioCtx();
  if (!ac) return;
  const dur = 0.09;

  // Noise burst
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    const t = i / ch.length;
    ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.8);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = accent ? 1600 : 1200;
  const ng = ac.createGain();
  ng.gain.value = accent ? 0.85 : 0.5;
  noise.connect(hp).connect(ng).connect(ac.destination);
  noise.start(when);
  noise.stop(when + dur);

  // Body tone (tight tonal snap)
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(accent ? 240 : 200, when);
  osc.frequency.exponentialRampToValueAtTime(110, when + 0.05);
  const og = ac.createGain();
  og.gain.setValueAtTime(accent ? 0.45 : 0.28, when);
  og.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
  osc.connect(og).connect(ac.destination);
  osc.start(when);
  osc.stop(when + 0.1);
}
