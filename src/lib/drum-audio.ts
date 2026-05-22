// Warm, immersive worship-style snare using Web Audio synthesis.
// Layered: low body (sine sub-thump) + mid tone (triangle) + filtered noise (snare wires).
// Tuned for warmth, clean attack, lower harsh frequencies.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(compressor).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function bus(): AudioNode {
  return masterGain ?? getAudioCtx()!.destination;
}

/** Schedule a warm snare hit at `when` (audio time). accent = louder, slightly brighter. */
export function scheduleSnare(when: number, accent = false) {
  const ac = getAudioCtx();
  if (!ac) return;
  const out = bus();
  const vel = accent ? 1.0 : 0.78;

  // ---------- 1. Sub body (warm low thump) ----------
  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(180, when);
  sub.frequency.exponentialRampToValueAtTime(70, when + 0.09);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.0001, when);
  subG.gain.exponentialRampToValueAtTime(0.55 * vel, when + 0.004);
  subG.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
  sub.connect(subG).connect(out);
  sub.start(when);
  sub.stop(when + 0.18);

  // ---------- 2. Mid tonal body (woody snare) ----------
  const tone = ac.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(330, when);
  tone.frequency.exponentialRampToValueAtTime(180, when + 0.07);
  const toneLP = ac.createBiquadFilter();
  toneLP.type = "lowpass";
  toneLP.frequency.value = accent ? 2200 : 1800;
  toneLP.Q.value = 0.7;
  const toneG = ac.createGain();
  toneG.gain.setValueAtTime(0.0001, when);
  toneG.gain.exponentialRampToValueAtTime(0.32 * vel, when + 0.003);
  toneG.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  tone.connect(toneLP).connect(toneG).connect(out);
  tone.start(when);
  tone.stop(when + 0.14);

  // ---------- 3. Snare wires (band-limited noise, no harsh top) ----------
  const dur = 0.16;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    const t = i / ch.length;
    // shaped decay envelope built into the noise
    ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = accent ? 3200 : 2600;
  bp.Q.value = 0.9;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 600;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  // cut harshness above 6 kHz
  lp.frequency.value = accent ? 6500 : 5500;
  const noiseG = ac.createGain();
  noiseG.gain.setValueAtTime(0.0001, when);
  noiseG.gain.exponentialRampToValueAtTime(0.42 * vel, when + 0.002);
  noiseG.gain.exponentialRampToValueAtTime(0.001, when + dur);
  noise.connect(hp).connect(bp).connect(lp).connect(noiseG).connect(out);
  noise.start(when);
  noise.stop(when + dur);

  // ---------- 4. Subtle click attack ----------
  const click = ac.createOscillator();
  click.type = "sine";
  click.frequency.setValueAtTime(2400, when);
  const clickG = ac.createGain();
  clickG.gain.setValueAtTime(0.18 * vel, when);
  clickG.gain.exponentialRampToValueAtTime(0.0001, when + 0.012);
  click.connect(clickG).connect(out);
  click.start(when);
  click.stop(when + 0.02);
}
