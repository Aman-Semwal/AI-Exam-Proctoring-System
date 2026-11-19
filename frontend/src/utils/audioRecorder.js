// Records microphone audio and hands it out as base64 WAV chunks in the format the
// AI service's voice-activity detector expects: 16-bit PCM, mono, 16 kHz.
//
// The AudioContext runs at the device's native rate and we resample ourselves —
// Firefox refuses to connect a mic stream to a context with a different sample rate.

const TARGET_RATE = 16000;
// Keep at most this much unsent audio, so a stalled upload can't grow memory forever
const MAX_BUFFER_SECONDS = 10;

const downsample = (samples, fromRate) => {
  if (fromRate === TARGET_RATE) return samples;
  const ratio = fromRate / TARGET_RATE;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    // Average the source samples that fall into this output slot (cheap low-pass)
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
};

const encodeWav = (samples) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000; // avoid call-stack limits in String.fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

/** Float32 samples at `fromRate` → base64 16 kHz mono 16-bit WAV. */
export const encodeChunk = (samples, fromRate) => toBase64(encodeWav(downsample(samples, fromRate)));

/**
 * @param {MediaStream} stream a stream with at least one audio track
 * @returns {{ takeChunk: () => string | null, stop: () => void }}
 *   takeChunk() returns the audio recorded since the previous call (base64 WAV), or null.
 */
export const createAudioRecorder = (stream) => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but works everywhere without a separate worklet file
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  let buffers = [];
  let bufferedSamples = 0;
  const maxSamples = ctx.sampleRate * MAX_BUFFER_SECONDS;

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    buffers.push(new Float32Array(input));
    bufferedSamples += input.length;
    while (bufferedSamples > maxSamples && buffers.length > 1) {
      bufferedSamples -= buffers.shift().length;
    }
  };
  source.connect(processor);
  // Chrome only fires onaudioprocess when the node is connected; we never write output,
  // so nothing is played back
  processor.connect(ctx.destination);

  return {
    takeChunk() {
      if (bufferedSamples === 0) return null;
      const merged = new Float32Array(bufferedSamples);
      let offset = 0;
      buffers.forEach((b) => {
        merged.set(b, offset);
        offset += b.length;
      });
      buffers = [];
      bufferedSamples = 0;
      return encodeChunk(merged, ctx.sampleRate);
    },
    stop() {
      processor.disconnect();
      source.disconnect();
      ctx.close().catch(() => {});
    },
  };
};
