// Worship Pad Pro audio engine.
//
// A module-level singleton so playback survives React route changes: pads keep
// looping while the user navigates the rest of Groovik.
//
// IMPORTANT: this engine only plays real recorded audio (imported files or
// microphone recordings). There is no oscillator/synthesis path — an unmapped
// chord stays silent.

import { getBlob } from "./store";
import type { NoteName, PadDefinition } from "./types";
import { NOTE_NAMES } from "./types";

export type VoiceKey = string; // `${padId}` or `${padId}@${chordId}`

type Voice = {
  key: VoiceKey;
  padId: string;
  /** Chord slot that triggered this voice, when played from the chord grid. */
  chordId: string | null;
  label: string;
  stop: (releaseTime: number) => void;
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

export type ActiveVoice = { padId: string; chordId: string | null; label: string };

/** Snapshot of what is currently sounding, for UI badges and the mini player. */
export function getActive(): ActiveVoice[] {
  return [...voices.values()].map((v) => ({ padId: v.padId, chordId: v.chordId, label: v.label }));
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

    // Convolution reverb: the impulse response is a decaying noise tail used as
    // an FX send only. It never generates a musical tone by itself.
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
function buildChain(context: AudioContext, pad: PadDefinition) {
  const fxs = pad.fx;
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

type PlayOptions = {
  /** Chord slot that triggered playback (for UI + voice identity). */
  chordId?: string | null;
  /** Human label shown in the now-playing bar. */
  label?: string;
  /** Extra semitone shift on top of the pad transpose (auto-pitch). */
  semitoneShift?: number;
};

function voiceKey(padId: string, chordId?: string | null) {
  return chordId ? `${padId}@${chordId}` : padId;
}

async function startVoice(pad: PadDefinition, opts: PlayOptions): Promise<Voice | null> {
  const context = ensureContext();
  const buf = await loadBuffer(pad.source.blobId);
  if (!buf) return null;
  const fxs = pad.fx;
  const now = context.currentTime;

  const { input } = buildChain(context, pad);
  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.9, now + Math.max(0.01, fxs.attack));
  env.connect(input);

  const src = context.createBufferSource();
  src.buffer = buf;
  const semis = fxs.transpose + (opts.semitoneShift ?? 0);
  src.playbackRate.value = fxs.speed * Math.pow(2, semis / 12) * Math.pow(2, fxs.pitch / 1200);
  if (pad.loopMode === "loop") {
    src.loop = true;
    src.loopStart = Math.max(0, pad.source.loopStart);
    src.loopEnd = pad.source.loopEnd > 0 ? Math.min(buf.duration, pad.source.loopEnd) : buf.duration;
  }
  src.connect(env);
  src.start(now, Math.max(0, pad.source.trimStart));

  const key = voiceKey(pad.id, opts.chordId);
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

  return {
    key,
    padId: pad.id,
    chordId: opts.chordId ?? null,
    label: opts.label ?? pad.name,
    stop,
  };
}

/** Starts a pad. No-op when that exact voice is already sounding. */
export async function playPad(pad: PadDefinition, opts: PlayOptions = {}) {
  ensureContext();
  const key = voiceKey(pad.id, opts.chordId);
  if (voices.has(key)) return;
  const voice = await startVoice(pad, opts);
  if (!voice) return;
  voices.set(key, voice);
  enableBackgroundPlayback(voice.label);
  notify();
}

export function stopVoice(padId: string, chordId?: string | null, release?: number) {
  const v = voices.get(voiceKey(padId, chordId));
  if (!v) return;
  v.stop(release ?? 2);
  voices.delete(v.key);
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

export function isChordPlaying(chordId: string) {
  return [...voices.values()].some((v) => v.chordId === chordId);
}

/**
 * Smooth chord change: the new pad fades in while every other voice fades out
 * over `seconds`, so nothing ever restarts abruptly.
 */
export async function crossfadeTo(pad: PadDefinition, opts: PlayOptions, seconds: number) {
  const previous = [...voices.values()].filter((v) => v.key !== voiceKey(pad.id, opts.chordId));
  await playPad(pad, opts);
  previous.forEach((v) => {
    v.stop(seconds);
    voices.delete(v.key);
  });
  if (voices.size === 0) releaseBackgroundPlayback();
  notify();
}

/** Preview helper used by the pad editor (auto-stops after `seconds`). */
export async function previewPad(pad: PadDefinition, seconds = 5) {
  await playPad(pad, { label: `Prévia — ${pad.name}` });
  window.setTimeout(() => stopVoice(pad.id, null, 0.8), seconds * 1000);
}
