const MAX_RECORDING_BYTES = 50 * 1024 * 1024;

export type MeetingCapture = {
  hadMicrophone: boolean;
  stop: () => void;
  done: Promise<File>;
};

function pickRecorderMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function buildRecordingFile(chunks: Blob[], mimeType: string) {
  const baseType = (mimeType.split(";")[0] || "audio/webm").trim();
  const extension = baseType.includes("mp4") ? "m4a" : "webm";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob(chunks, { type: baseType });
  return new File([blob], `meeting-${stamp}.${extension}`, { type: baseType });
}

export async function startMeetingCapture(): Promise<MeetingCapture> {
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Tab recording needs Chrome or Edge.");
  }

  let microphone: MediaStream | null = null;
  try {
    microphone = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    microphone = null;
  }

  let display: MediaStream;
  try {
    display = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  } catch (error) {
    microphone?.getTracks().forEach((track) => track.stop());
    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError")) {
      throw new Error("Recording cancelled. Pick the Google Meet tab and turn on Share tab audio.");
    }
    throw error instanceof Error ? error : new Error("Could not start tab recording.");
  }

  const tabAudio = display.getAudioTracks();
  if (tabAudio.length === 0) {
    display.getTracks().forEach((track) => track.stop());
    microphone?.getTracks().forEach((track) => track.stop());
    throw new Error("No meeting audio found. Share a browser tab and turn on Share tab audio.");
  }

  display.getVideoTracks().forEach((track) => track.stop());

  const audioContext = new AudioContext();
  await audioContext.resume();
  const destination = audioContext.createMediaStreamDestination();
  audioContext.createMediaStreamSource(new MediaStream(tabAudio)).connect(destination);
  if (microphone) {
    audioContext.createMediaStreamSource(microphone).connect(destination);
  }

  const mimeType = pickRecorderMime();
  const recorder = new MediaRecorder(
    destination.stream,
    mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined
  );
  const chunks: Blob[] = [];
  let settled = false;
  let resolveDone: (file: File) => void = () => undefined;
  let rejectDone: (error: Error) => void = () => undefined;
  const done = new Promise<File>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const release = () => {
    display.getTracks().forEach((track) => track.stop());
    microphone?.getTracks().forEach((track) => track.stop());
    void audioContext.close().catch(() => undefined);
  };

  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    release();
    if (error) {
      rejectDone(error);
      return;
    }
    const file = buildRecordingFile(chunks, recorder.mimeType || mimeType || "audio/webm");
    if (file.size < 1024) {
      rejectDone(new Error("Recording is too short. Record a little longer, then stop."));
      return;
    }
    if (file.size > MAX_RECORDING_BYTES) {
      rejectDone(new Error("Recording is over 50 MB. Record a shorter meeting."));
      return;
    }
    resolveDone(file);
  };

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
    const recordedBytes = chunks.reduce((total, chunk) => total + chunk.size, 0);
    if (recordedBytes > MAX_RECORDING_BYTES && recorder.state === "recording") {
      recorder.stop();
    }
  };
  recorder.onstop = () => finish();
  recorder.onerror = () => finish(new Error("Recording failed."));

  const stop = () => {
    if (recorder.state === "recording") recorder.stop();
  };

  tabAudio[0].addEventListener("ended", stop);
  recorder.start(1000);

  return { hadMicrophone: Boolean(microphone), stop, done };
}
