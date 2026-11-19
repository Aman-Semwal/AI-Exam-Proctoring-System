/**
 * Asks for the student's ENTIRE screen. A window or tab is refused. Resolves the
 * MediaStream (video only) or throws an Error with a message to show the student.
 */
export async function requestEntireScreen() {
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" }, audio: false });
  } catch {
    throw new Error("Screen sharing is required for this exam");
  }
  const surface = stream.getVideoTracks()[0]?.getSettings?.().displaySurface;
  if (surface && surface !== "monitor") {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("Please choose Entire screen, not a window or tab");
  }
  return stream;
}
