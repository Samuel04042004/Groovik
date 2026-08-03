// Web Audio synthesis engine for Groovik.
// Provides the worship-style snare plus a set of metronome click voices and
// a synthesized drum kit used by the drum pad module. All voices are
// scheduled on the shared AudioContext for sample-accurate timing.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: "interactive",
    });
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

export function setMasterVolume(v: number) {
  getAudioCtx();
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1.5, v));
}

function bus(): AudioNode {
  return masterGain ?? getAudioCtx()!.destination;
}

function noiseBuffer(ac: AudioContext, dur: number, curve = 2.2) {
  const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    const t = i / ch.length;
    ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, curve);
  }
  return buf;
}

/** Schedule a warm worship-style snare hit at `when` (audio time). */
export function scheduleSnare(when: number, accent = false, gain = 1) {
  const ac = getAudioCtx();
  if (!ac) return;
  const out = bus();
  const vel = (accent ? 1.0 : 0.78) * gain;

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

  const dur = 0.16;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer(ac, dur);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = accent ? 3200 : 2600;
  bp.Q.value = 0.9;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 600;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = accent ? 6500 : 5500;
  const noiseG = ac.createGain();
  noiseG.gain.setValueAtTime(0.0001, when);
  noiseG.gain.exponentialRampToValueAtTime(0.42 * vel, when + 0.002);
  noiseG.gain.exponentialRampToValueAtTime(0.001, when + dur);
  noise.connect(hp).connect(bp).connect(lp).connect(noiseG).connect(out);
  noise.start(when);
  noise.stop(when + dur);

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

/* ------------------------------------------------------------------ */
/*  Metronome click voices                                             */
/* ------------------------------------------------------------------ */

export type ClickSound = "snare" | "click" | "woodblock" | "cowbell" | "beep" | "rimshot";
export type ClickLevel = "accent" | "normal" | "sub";

export const CLICK_SOUNDS: { id: ClickSound; label: string }[] = [
  { id: "snare", label: "Caixa (worship)" },
  { id: "click", label: "Click clássico" },
  { id: "woodblock", label: "Woodblock" },
  { id: "cowbell", label: "Cowbell" },
  { id: "beep", label: "Beep digital" },
  { id: "rimshot", label: "Aro (rimshot)" },
];

function simpleTone(
  when: number,
  freq: number,
  type: OscillatorType,
  decay: number,
  gain: number,
) {
  const ac = getAudioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  osc.connect(g).connect(bus());
  osc.start(when);
  osc.stop(when + decay + 0.02);
}

/** Schedule a metronome click of the given voice and emphasis level. */
export function scheduleClick(when: number, sound: ClickSound, level: ClickLevel, volume = 1) {
  const ac = getAudioCtx();
  if (!ac) return;
  const v = (level === "accent" ? 1 : level === "normal" ? 0.7 : 0.42) * volume;
  const up = level === "accent" ? 1.32 : level === "sub" ? 0.86 : 1;

  switch (sound) {
    case "snare":
      scheduleSnare(when, level === "accent", level === "sub" ? 0.55 : 1);
      return;
    case "click": {
      simpleTone(when, 1000 * up, "square", 0.035, 0.22 * v);
      const noise = ac.createBufferSource();
      noise.buffer = noiseBuffer(ac, 0.02, 4);
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3000;
      const g = ac.createGain();
      g.gain.value = 0.25 * v;
      noise.connect(hp).connect(g).connect(bus());
      noise.start(when);
      noise.stop(when + 0.03);
      return;
    }
    case "woodblock":
      simpleTone(when, 1180 * up, "triangle", 0.06, 0.38 * v);
      simpleTone(when, 2360 * up, "sine", 0.03, 0.14 * v);
      return;
    case "cowbell":
      simpleTone(when, 540 * up, "square", 0.12, 0.2 * v);
      simpleTone(when, 800 * up, "square", 0.12, 0.18 * v);
      return;
    case "beep":
      simpleTone(when, (level === "accent" ? 1600 : 900) * 1, "sine", 0.05, 0.3 * v);
      return;
    case "rimshot": {
      simpleTone(when, 420 * up, "triangle", 0.05, 0.3 * v);
      const noise = ac.createBufferSource();
      noise.buffer = noiseBuffer(ac, 0.05, 3);
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2400;
      const g = ac.createGain();
      g.gain.value = 0.3 * v;
      noise.connect(bp).connect(g).connect(bus());
      noise.start(when);
      noise.stop(when + 0.06);
      return;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Drum kit voices (drum pad module)                                  */
/* ------------------------------------------------------------------ */

export type KitVoice =
  | "kick"
  | "snare"
  | "rim"
  | "clap"
  | "hihat"
  | "openhat"
  | "tom-low"
  | "tom-mid"
  | "tom-high"
  | "crash"
  | "ride"
  | "shaker"
  | "pad-warm"
  | "pad-air"
  | "sub-drop";

export type KitFlavor = "acoustic" | "electronic" | "worship";

/** Play one kit voice immediately (or at `when`). */
export function playVoice(voice: KitVoice, flavor: KitFlavor = "acoustic", when?: number) {
  const ac = getAudioCtx();
  if (!ac) return;
  const t = when ?? ac.currentTime + 0.001;
  const out = bus();
  const electronic = flavor === "electronic";
  const worship = flavor === "worship";

  const noiseHit = (dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = "bandpass") => {
    const n = ac.createBufferSource();
    n.buffer = noiseBuffer(ac, dur, 2.4);
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(out);
    n.start(t);
    n.stop(t + dur + 0.02);
  };

  const body = (f0: number, f1: number, dur: number, gain: number, type: OscillatorType = "sine") => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.03);
  };

  switch (voice) {
    case "kick":
      body(electronic ? 140 : 110, electronic ? 38 : 48, electronic ? 0.5 : 0.34, 0.9);
      noiseHit(0.03, 1800, 1, 0.12, "highpass");
      return;
    case "snare":
      scheduleSnare(t, !worship);
      return;
    case "rim":
      body(420, 260, 0.05, 0.35, "triangle");
      noiseHit(0.05, 2400, 2, 0.3);
      return;
    case "clap":
      [0, 0.012, 0.024].forEach((o) => {
        const n = ac.createBufferSource();
        n.buffer = noiseBuffer(ac, 0.09, 3);
        const f = ac.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1500;
        f.Q.value = 1.2;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.32, t + o);
        g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.09);
        n.connect(f).connect(g).connect(out);
        n.start(t + o);
        n.stop(t + o + 0.1);
      });
      return;
    case "hihat":
      noiseHit(electronic ? 0.05 : 0.07, 8000, 0.8, 0.24, "highpass");
      return;
    case "openhat":
      noiseHit(0.36, 7200, 0.7, 0.22, "highpass");
      return;
    case "tom-low":
      body(150, 82, 0.42, 0.6);
      return;
    case "tom-mid":
      body(210, 118, 0.36, 0.58);
      return;
    case "tom-high":
      body(290, 168, 0.3, 0.55);
      return;
    case "crash":
      noiseHit(1.4, 6000, 0.5, 0.26, "highpass");
      noiseHit(1.2, 3400, 0.6, 0.14);
      return;
    case "ride":
      noiseHit(0.7, 9000, 1.2, 0.14, "highpass");
      body(880, 820, 0.5, 0.08, "triangle");
      return;
    case "shaker":
      noiseHit(0.08, 6500, 1.4, 0.18, "highpass");
      return;
    case "pad-warm": {
      // Soft sustained worship pad chord (root + fifth + octave).
      const freqs = [110, 164.81, 220];
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + 3.2);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      g.connect(lp).connect(out);
      freqs.forEach((f) => {
        const o = ac.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        const d = ac.createGain();
        d.gain.value = 0.3;
        o.connect(d).connect(g);
        o.start(t);
        o.stop(t + 3.3);
      });
      return;
    }
    case "pad-air": {
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.9);
      g.gain.linearRampToValueAtTime(0.0001, t + 4);
      const bpf = ac.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 1200;
      bpf.Q.value = 0.7;
      g.connect(bpf).connect(out);
      [329.63, 493.88, 659.25].forEach((f) => {
        const o = ac.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        const d = ac.createGain();
        d.gain.value = 0.3;
        o.connect(d).connect(g);
        o.start(t);
        o.stop(t + 4.1);
      });
      return;
    }
    case "sub-drop":
      body(90, 28, 1.1, 0.8);
      return;
  }
}

/* ------------------------------------------------------------------ */
/*  User-imported samples                                              */
/* ------------------------------------------------------------------ */

const decoded = new Map<string, AudioBuffer>();

export async function decodeSample(id: string, data: ArrayBuffer) {
  const ac = getAudioCtx();
  if (!ac) return null;
  const buf = await ac.decodeAudioData(data.slice(0));
  decoded.set(id, buf);
  return buf;
}

export function hasSample(id: string) {
  return decoded.has(id);
}

export function playSample(id: string, when?: number) {
  const ac = getAudioCtx();
  const buf = decoded.get(id);
  if (!ac || !buf) return false;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = 0.9;
  src.connect(g).connect(bus());
  src.start(when ?? ac.currentTime + 0.001);
  return true;
}

export function removeSample(id: string) {
  decoded.delete(id);
}
