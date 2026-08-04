// Worship Pad Pro audio engine.
//
// A module-level singleton so playback survives React route changes: pads keep
// looping while the user navigates the rest of Groovik. The engine exposes a
// tiny pub/sub API consumed by `useWorshipEngine`, keeping UI and DSP separate
// and leaving room for MIDI / pedal / remote controllers to drive the same
// commands later.

import { getBlob } from "./store";
import type { NoteName, PadDefinition, PadFx } from "./types";
import { NOTE_NAMES } from "./types";

export type VoiceKey = string; // `${padId}:${midi}`

type Voice = {
  key: VoiceKey;
  padId: string;
  midi: number;
  stop: (releaseTime: number) => void;
  gain: GainNode;
};

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;
let reverbBus: GainNode | null = null;
let delayBus: GainNode | null = null;
let convolver: ConvolverNode | null = null;

const voices = new Map<VoiceKey, Voice>();
const buffers = new Map<string, AudioBuffer>();
const listeners = new Set<() => void>();
let silentEl: HTMLAudioElement | null = null;

export function midiFromNote(note: NoteName, octave: number) {
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(note);
}
export function freqFromMidi(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
export function noteLabel(midi: number) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Snapshot of what is currently sounding, for UI badges and the mini player. */
export function getActive(): { padId: string; midi: number }[] {
  return [...voices.values()].map((v) => ({ padId: v.padId, midi: v.midi }));
}

function impulse(context: AudioContext, seconds = 3.2, decay = 2.6) {
  const len = Math.floor(context.sampleRate * seconds);
  const buf = context.createBuffer(2, len, context.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export function ensureContext(): AudioContext {
  if (!ac) {
    ac = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: "interactive" });
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 20;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;

    master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ac.destination);

    convolver = ac.createConvolver();
    convolver.buffer = impulse(ac);
    reverbBus = ac.createGain();
    reverbBus.gain.value = 1;
    reverbBus.connect(convolver).connect(master);

    const fb = ac.createGain();
    fb.gain.value = 0.35;
    const dly = ac.createDelay(2);
    dly.delayTime.value = 0.42;
    delayBus = ac.createGain();
    delayBus.gain.value = 1;
    delayBus.connect(dly);
    dly.connect(fb).connect(dly);
    dly.connect(master);
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

export function setMasterVolume(v: number) {
  ensureContext();
  master!.gain.value = Math.max(0, Math.min(1.5, v));
}

/**
 * Keeps the audio session alive when the PWA is backgrounded on Android/iOS.
 * Browsers only guarantee this for media elements, so a silent looping element
 * is paired with the Media Session metadata.
 */
export function enableBackgroundPlayback(title: string) {
  if (typeof window === "undefined") return;
  if (!silentEl) {
    silentEl = document.createElement("audio");
    silentEl.loop = true;
    silentEl.setAttribute("playsinline", "");
    // 1-frame silent wav, keeps the media session registered
    silentEl.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";
    silentEl.volume = 0.0001;
  }
  void silentEl.play().catch(() => void 0);
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Groovik — Worship Pad Pro",
      album: "Pads ao vivo",
    });
    navigator.mediaSession.playbackState = "playing";
    try {
      navigator.mediaSession.setActionHandler("pause", () => stopAll());
      navigator.mediaSession.setActionHandler("stop", () => stopAll());
    } catch {
      /* unsupported action */
    }
  }
}

function releaseBackgroundPlayback() {
  silentEl?.pause();
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
}

async function loadBuffer(blobId: string): Promise<AudioBuffer | null> {
  if (buffers.has(blobId)) return buffers.get(blobId)!;
  const entry = await getBlob(blobId);
  if (!entry) return null;
  const context = ensureContext();
  const buf = await context.decodeAudioData(entry.data.slice(0));
  buffers.set(blobId, buf);
  return buf;
}

export async function decodeAndCache(blobId: string, data: ArrayBuffer) {
  const context = ensureContext();
  const buf = await context.decodeAudioData(data.slice(0));
  buffers.set(blobId, buf);
  return buf;
}

export function getCachedBuffer(blobId: string) {
  return buffers.get(blobId) ?? null;
}

/** Per-pad processing chain: EQ -> pan -> dry/wet sends. */
function buildChain(context: AudioContext, fxs: PadFx) {
  const input = context.createGain();
  input.gain.value = 1;

  const low = context.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 220;
  low.gain.value = fxs.eqLow;

  const mid = context.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.9;
  mid.gain.value = fxs.eqMid;

  const high = context.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 4200;
  high.gain.value = fxs.eqHigh;

  const panner = context.createStereoPanner();
  panner.pan.value = fxs.pan;

  const out = context.createGain();
  out.gain.value = fxs.volume;

  input.connect(low).connect(mid).connect(high).connect(panner).connect(out);
  out.connect(master!);

  if (fxs.reverb > 0) {
    const send = context.createGain();
    send.gain.value = fxs.reverb;
    out.connect(send).connect(reverbBus!);
  }
  if (fxs.delay > 0) {
    const send = context.createGain();
    send.gain.value = fxs.delay;
    out.connect(send).connect(delayBus!);
  }
  return { input, out };
}

function startSynthVoice(pad: PadDefinition, midi: number): Voice | null {
  const context = ensureContext();
  if (pad.source.kind !== "synth") return null;
  const r = pad.source.recipe;
  const fxs = pad.fx;
  const now = context.currentTime;
  const freq = freqFromMidi(midi + fxs.transpose);

  const { input } = buildChain(context, fxs);

  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.9, now + Math.max(0.01, fxs.attack));

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = r.cutoff * (freq / 261.63) ** 0.35;
  filter.Q.value = r.resonance;

  env.connect(filter).connect(input);

  const lfo = context.createOscillator();
  lfo.frequency.value = r.lfoRate;
  const lfoGain = context.createGain();
  lfoGain.gain.value = r.lfoDepth;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start(now);

  const oscs: OscillatorNode[] = [];
  for (const layer of r.layers) {
    const osc = context.createOscillator();
    osc.type = layer.type;
    osc.frequency.value = freq * Math.pow(2, layer.octave);
    osc.detune.value = layer.detune + fxs.pitch;
    const g = context.createGain();
    g.gain.value = layer.gain;
    osc.connect(g).connect(env);
    osc.start(now);
    oscs.push(osc);
  }

  let noise: AudioBufferSourceNode | null = null;
  if (r.air > 0) {
    const len = Math.floor(context.sampleRate * 2);
    const buf = context.createBuffer(1, len, context.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    noise = context.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const nf = context.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = freq * 4;
    nf.Q.value = 0.7;
    const ng = context.createGain();
    ng.gain.value = r.air * 0.25;
    noise.connect(nf).connect(ng).connect(env);
    noise.start(now);
  }

  const stop = (release: number) => {
    const t = context.currentTime;
    env.gain.cancelScheduledValues(t);
    env.gain.setValueAtTime(Math.max(0.0001, env.gain.value), t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, release));
    const at = t + Math.max(0.05, release) + 0.1;
    oscs.forEach((o) => o.stop(at));
    noise?.stop(at);
    lfo.stop(at);
  };

  return { key: `${pad.id}:${midi}`, padId: pad.id, midi, stop, gain: env };
}

async function startSampleVoice(pad: PadDefinition, midi: number): Promise<Voice | null> {
  if (pad.source.kind !== "sample") return null;
  const context = ensureContext();
  const buf = await loadBuffer(pad.source.blobId);
  if (!buf) return null;
  const fxs = pad.fx;
  const now = context.currentTime;

  const { input } = buildChain(context, fxs);
  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.9, now + Math.max(0.01, fxs.attack));
  env.connect(input);

  const src = context.createBufferSource();
  src.buffer = buf;
  const semis = fxs.transpose + (midi - 60);
  src.playbackRate.value = fxs.speed * Math.pow(2, semis / 12) * Math.pow(2, fxs.pitch / 1200);
  if (pad.loopMode === "loop") {
    src.loop = true;
    src.loopStart = Math.max(0, pad.source.loopStart);
    src.loopEnd = pad.source.loopEnd > 0 ? Math.min(buf.duration, pad.source.loopEnd) : buf.duration;
  }
  src.connect(env);
  const offset = Math.max(0, pad.source.trimStart);
  src.start(now, offset);

  const key = `${pad.id}:${midi}`;
  if (pad.loopMode === "one-shot") {
    src.onended = () => {
      voices.delete(key);
      if (voices.size === 0) releaseBackgroundPlayback();
      notify();
    };
  }

  const stop = (release: number) => {
    const t = context.currentTime;
    env.gain.cancelScheduledValues(t);
    env.gain.setValueAtTime(Math.max(0.0001, env.gain.value), t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, release));
    try {
      src.stop(t + Math.max(0.05, release) + 0.1);
    } catch {
      /* already stopped */
    }
  };

  return { key, padId: pad.id, midi, stop, gain: env };
}

export async function playNote(pad: PadDefinition, midi: number) {
  ensureContext();
  const key = `${pad.id}:${midi}`;
  if (voices.has(key)) return;
  const voice =
    pad.source.kind === "synth" ? startSynthVoice(pad, midi) : await startSampleVoice(pad, midi);
  if (!voice) return;
  voices.set(key, voice);
  enableBackgroundPlayback(`${pad.name} — ${noteLabel(midi)}`);
  notify();
}

export function stopNote(padId: string, midi: number, release?: number) {
  const key = `${padId}:${midi}`;
  const v = voices.get(key);
  if (!v) return;
  v.stop(release ?? 1.5);
  voices.delete(key);
  if (voices.size === 0) releaseBackgroundPlayback();
  notify();
}

export function stopPad(padId: string, release = 2) {
  [...voices.values()]
    .filter((v) => v.padId === padId)
    .forEach((v) => {
      v.stop(release);
      voices.delete(v.key);
    });
  if (voices.size === 0) releaseBackgroundPlayback();
  notify();
}

export function stopAll(release = 1.2) {
  [...voices.values()].forEach((v) => v.stop(release));
  voices.clear();
  releaseBackgroundPlayback();
  notify();
}

export function isPadPlaying(padId: string) {
  return [...voices.values()].some((v) => v.padId === padId);
}

/** Smooth pad change: fades the previous pad out while the new one fades in. */
export async function crossfadeTo(pad: PadDefinition, midi: number, seconds: number) {
  const previous = [...new Set([...voices.values()].map((v) => v.padId))].filter((id) => id !== pad.id);
  await playNote(pad, midi);
  previous.forEach((id) => stopPad(id, seconds));
}

/** Preview helper used by the pad editor (auto-stops after `seconds`). */
export async function previewPad(pad: PadDefinition, midi = 60, seconds = 4) {
  await playNote(pad, midi);
  window.setTimeout(() => stopNote(pad.id, midi, 0.6), seconds * 1000);
}
