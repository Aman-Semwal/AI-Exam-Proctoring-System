// Pre-exam system checks. Only the health ping and the speed test talk to the backend;
// results stay in the browser and only gate the Start button.

const BLACK_FRAME_MEAN = 8; // 0–255; below this the camera is covered or not sending
const MIC_RMS_THRESHOLD = 0.02; // 0–1; above this something was said into the mic
const NETWORK_OK_MS = 1500;
// Each 5 s exam tick uploads a webcam frame + screenshot + audio chunk (~300 KB ≈ 0.5 Mbps);
// 1 Mbps leaves headroom. Below it is a warning, not a block.
const SPEED_OK_MBPS = 1;
const SPEED_TEST_KB = 512;
// A stalled request must not leave the check "running" forever (Start would never enable)
const REQUEST_TIMEOUT_MS = 10000;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** True when the camera track is live and a sampled frame is not (almost) all black. */
export async function checkCamera(stream) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track || track.readyState !== "live") return false;

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
    for (let i = 0; i < 20 && !video.videoWidth; i++) await wait(100);
    if (!video.videoWidth) return false;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (data.length / 4) >= BLACK_FRAME_MEAN;
  } catch {
    return false;
  } finally {
    video.srcObject = null;
  }
}

/**
 * Resolves true once the microphone picks up sound above silence within timeoutMs.
 * onLevel(0–1) is called while listening so the UI can show a meter.
 */
export async function checkMicLevel(stream, timeoutMs = 5000, onLevel) {
  const track = stream?.getAudioTracks?.()[0];
  if (!track || track.readyState !== "live") return false;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;
  const ctx = new AudioCtx();
  try {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      analyser.getFloatTimeDomainData(buf);
      let sq = 0;
      for (const v of buf) sq += v * v;
      const rms = Math.sqrt(sq / buf.length);
      onLevel?.(Math.min(1, rms * 10));
      if (rms > MIC_RMS_THRESHOLD) return true;
      await wait(100);
    }
    return false;
  } finally {
    ctx.close().catch(() => {});
  }
}

/** Average of 3 health pings; ok when under 1500 ms. A slow network is a warning, not a block. */
export async function checkNetwork(api) {
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    try {
      await api.get("/health", { timeout: REQUEST_TIMEOUT_MS });
    } catch {
      return { ok: false, avgMs: null };
    }
    times.push(performance.now() - t0);
  }
  const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  return { ok: avgMs < NETWORK_OK_MS, avgMs };
}

const toMbps = (bytes, ms) => Math.round(((bytes * 8) / (ms / 1000) / 1_000_000) * 10) / 10;

/**
 * Measures download and upload speed against the backend with a 512 KB payload each way.
 * Resolves { ok, downMbps, upMbps }; ok is false when either is under 1 Mbps or the test fails.
 */
export async function checkSpeed(api) {
  try {
    let t0 = performance.now();
    const down = await api.get(`/speedtest/download?kb=${SPEED_TEST_KB}&t=${Date.now()}`, {
      responseType: "arraybuffer",
      timeout: REQUEST_TIMEOUT_MS,
    });
    const downMbps = toMbps(down.data.byteLength, performance.now() - t0);

    const payload = new Uint8Array(SPEED_TEST_KB * 1024);
    crypto.getRandomValues(payload.subarray(0, 65536)); // random head: defeats compression enough
    t0 = performance.now();
    await api.post("/speedtest/upload", payload, {
      headers: { "Content-Type": "application/octet-stream" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const upMbps = toMbps(payload.byteLength, performance.now() - t0);

    return { ok: downMbps >= SPEED_OK_MBPS && upMbps >= SPEED_OK_MBPS, downMbps, upMbps };
  } catch {
    return { ok: false, downMbps: null, upMbps: null };
  }
}

/** Screen sharing and full screen need a desktop Chrome/Edge-class browser. */
export function checkBrowser({ needScreen }) {
  const hasFullscreen = !!document.documentElement.requestFullscreen;
  const hasScreen = !!navigator.mediaDevices?.getDisplayMedia;
  if (!hasFullscreen || (needScreen && !hasScreen)) {
    return { ok: false, message: "Use Chrome or Edge on a desktop computer" };
  }
  return { ok: true };
}
