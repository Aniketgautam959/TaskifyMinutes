const MAX_RECORDING_BYTES = 50 * 1024 * 1024;

export type MeetingSnap = {
  file: File;
  seconds: number;
};

export type MeetingCapture = {
  hadMicrophone: boolean;
  stop: () => void;
  snap: () => Promise<MeetingSnap | null>;
  done: Promise<File>;
};

const MAX_SNAP_WIDTH = 1280;

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

  const videoTracks = display.getVideoTracks();
  const preview = document.createElement("video");
  preview.muted = true;
  preview.playsInline = true;
  preview.srcObject = new MediaStream(videoTracks);
  preview.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
  document.body.appendChild(preview);
  if (videoTracks.length > 0) {
    await preview.play().catch(() => undefined);
  }

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
    preview.pause();
    preview.srcObject = null;
    preview.remove();
    display.getTracks().forEach((track) => track.stop());
    microphone?.getTracks().forEach((track) => track.stop());
    void audioContext.close().catch(() => undefined);
  };

  const startedAt = Date.now();
  const snap = async (): Promise<MeetingSnap | null> => {
    if (preview.readyState < 2 || preview.videoWidth < 2) return null;
    const scale = Math.min(1, MAX_SNAP_WIDTH / preview.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(preview.videoWidth * scale);
    canvas.height = Math.round(preview.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(preview, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return null;
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return {
      file: new File([blob], `screen-${seconds}.jpg`, { type: "image/jpeg" }),
      seconds,
    };
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

  return { hadMicrophone: Boolean(microphone), stop, snap, done };
}
