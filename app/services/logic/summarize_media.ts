import { GoogleGenAI, FileState, Type, createPartFromText, createPartFromUri } from "@google/genai";

export interface MediaSummaryResult {
  title: string;
  summary: string;
  mom: { type: "action" | "decision" | "info"; content: string }[];
  tasks: string[];
  detailedTasks: { title: string; description: string; priority: string; tags: string[] }[];
  schedule: { event: string; time: string }[];
  transcript: { speakername: string; content: string; timestamp: string }[];
  tags: string[];
  category: string;
  confidence_level: number;
}

const MEDIA_MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
  mpga: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "video/webm",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  mpg: "video/mpeg",
};

const MEDIA_MIME_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/mp4": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/aac": "audio/aac",
  "audio/webm": "audio/webm",
  "audio/ogg": "audio/ogg",
  "video/mp4": "video/mp4",
  "video/webm": "video/webm",
  "video/quicktime": "video/quicktime",
  "video/mpeg": "video/mpeg",
  "video/x-m4v": "video/mp4",
};

export function isVideoMime(mimeType: string) {
  return mimeType.startsWith("video/");
}

export const MAX_RECORDING_BYTES = 50 * 1024 * 1024;

export function resolveMediaMime(filename: string, mimeType?: string): string | null {
  const normalizedType = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (MEDIA_MIME_BY_TYPE[normalizedType]) {
    return MEDIA_MIME_BY_TYPE[normalizedType];
  }
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  return MEDIA_MIME_BY_EXTENSION[extension] || null;
}

function asMomType(value: unknown): "action" | "decision" | "info" {
  const type = String(value || "").toLowerCase();
  if (type === "action" || type === "decision" || type === "info") return type;
  if (type.includes("decision")) return "decision";
  if (type.includes("action") || type.includes("task")) return "action";
  return "info";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    mom: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["action", "decision", "info"] },
          content: { type: Type.STRING },
        },
        required: ["type", "content"],
      },
    },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "priority"],
      },
    },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          event: { type: Type.STRING },
          time: { type: Type.STRING },
        },
        required: ["event", "time"],
      },
    },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speakername: { type: Type.STRING },
          content: { type: Type.STRING },
          timestamp: { type: Type.STRING },
        },
        required: ["speakername", "content", "timestamp"],
      },
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    category: { type: Type.STRING },
    confidence_level: { type: Type.NUMBER },
  },
  required: ["title", "summary", "mom", "tasks", "schedule", "transcript", "tags", "category", "confidence_level"],
};

function normalizeResult(parsed: Record<string, unknown>): MediaSummaryResult {
  const detailedTasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map((task) => {
        const item = (task || {}) as Record<string, unknown>;
        const priority = String(item.priority || "Medium");
        return {
          title: String(item.title || "Untitled task"),
          description: String(item.description || ""),
          priority: ["High", "Medium", "Low"].includes(priority) ? priority : "Medium",
          tags: asStringArray(item.tags),
        };
      })
    : [];

  const mom = Array.isArray(parsed.mom)
    ? parsed.mom
        .map((item) => {
          const point = (item || {}) as Record<string, unknown>;
          return { type: asMomType(point.type), content: String(point.content || "").trim() };
        })
        .filter((item) => item.content)
    : [];

  const transcript = Array.isArray(parsed.transcript)
    ? parsed.transcript
        .map((item) => {
          const segment = (item || {}) as Record<string, unknown>;
          return {
            speakername: String(segment.speakername || "Speaker"),
            content: String(segment.content || "").trim(),
            timestamp: String(segment.timestamp || ""),
          };
        })
        .filter((item) => item.content)
    : [];

  const schedule = Array.isArray(parsed.schedule)
    ? parsed.schedule
        .map((item) => {
          const event = (item || {}) as Record<string, unknown>;
          return { event: String(event.event || "").trim(), time: String(event.time || "").trim() };
        })
        .filter((item) => item.event)
    : [];

  return {
    title: String(parsed.title || "Meeting recording"),
    summary: String(parsed.summary || "").trim(),
    mom,
    detailedTasks,
    tasks: detailedTasks.map((task) => (task.description ? `${task.title}: ${task.description}` : task.title)),
    schedule,
    transcript,
    tags: asStringArray(parsed.tags),
    category: String(parsed.category || "General"),
    confidence_level: Number(parsed.confidence_level || 0),
  };
}

async function waitUntilActive(ai: GoogleGenAI, uploaded: { name?: string; uri?: string; mimeType?: string; state?: FileState; error?: { message?: string } }) {
  let current = uploaded;
  const deadline = Date.now() + 90_000;

  while (current.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      throw new Error("The recording is taking too long to process. Try a shorter file.");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!current.name) break;
    current = await ai.files.get({ name: current.name });
  }

  if (current.state === FileState.FAILED || !current.uri) {
    throw new Error(current.error?.message || "Could not process this recording.");
  }

  return current;
}

export async function summarizeMeetingMedia(buffer: Buffer, mimeType: string, filename: string): Promise<MediaSummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `${isVideoMime(mimeType)
    ? "Watch this meeting video and extract structured notes from what was said and shown. Use speech, slides, and shared screens."
    : "Listen to this meeting recording and extract structured notes from what was actually said."}
Do not invent attendees, decisions, or tasks that are not in the recording.

Return:
- a short title
- a concise executive summary
- minutes of meeting, each typed exactly as action, decision, or info
- actionable tasks with High, Medium, or Low priority
- scheduled events and their time, if any were mentioned
- a speaker-wise transcript with approximate timestamps
- tags, a category, and a confidence score from 0 to 100`;

  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const uploaded = await ai.files.upload({
    file: blob,
    config: { mimeType, displayName: filename },
  });

  try {
    const ready = await waitUntilActive(ai, uploaded);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        createPartFromText(prompt),
        createPartFromUri(ready.uri || "", ready.mimeType || mimeType),
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const rawText = response.text;
    const jsonString = typeof rawText === "function" ? (rawText as () => string)() : String(rawText || "");
    if (!jsonString) {
      throw new Error("Empty response from AI");
    }

    return normalizeResult(JSON.parse(jsonString) as Record<string, unknown>);
  } finally {
    if (uploaded.name) {
      await ai.files.delete({ name: uploaded.name }).catch(() => undefined);
    }
  }
}
