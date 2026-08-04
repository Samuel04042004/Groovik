// Non-destructive-ish audio editing helpers for imported / recorded pads.
// Trim + normalize are baked into a WAV render so playback stays glitch-free
// and fully offline; loop points remain adjustable at playback time.

export async function decodeFile(data: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const buf = await ctx.decodeAudioData(data.slice(0));
  void ctx.close();
  return buf;
}

export function trimBuffer(buf: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    buf.numberOfChannels,
    1,
    buf.sampleRate,
  );
  const start = Math.max(0, Math.floor(startSec * buf.sampleRate));
  const end = Math.min(buf.length, Math.floor((endSec > 0 ? endSec : buf.duration) * buf.sampleRate));
  const len = Math.max(1, end - start);
  const out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    out.copyToChannel(buf.getChannelData(c).slice(start, end), c);
  }
  return out;
}

export function normalizeBuffer(buf: AudioBuffer, targetPeak = 0.95): AudioBuffer {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
  }
  if (peak === 0) return buf;
  const gain = targetPeak / peak;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < ch.length; i++) ch[i] *= gain;
  }
  return buf;
}

/** Encode an AudioBuffer as 16-bit PCM WAV for durable local storage. */
export function encodeWav(buf: AudioBuffer): ArrayBuffer {
  const channels = buf.numberOfChannels;
  const len = buf.length * channels * 2;
  const out = new ArrayBuffer(44 + len);
  const view = new DataView(out);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + len, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, len, true);

  let off = 44;
  const data = Array.from({ length: channels }, (_, c) => buf.getChannelData(c));
  for (let i = 0; i < buf.length; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return out;
}

/** Downsampled peak data used to draw the waveform in the editor. */
export function waveformPeaks(buf: AudioBuffer, buckets = 220): number[] {
  const ch = buf.getChannelData(0);
  const size = Math.floor(ch.length / buckets) || 1;
  const peaks: number[] = [];
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    for (let j = 0; j < size; j++) max = Math.max(max, Math.abs(ch[i * size + j] ?? 0));
    peaks.push(max);
  }
  return peaks;
}
