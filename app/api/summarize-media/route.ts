import { NextResponse } from "next/server";
import { MAX_RECORDING_BYTES, resolveMediaMime, summarizeMeetingMedia } from "@/app/services/logic/summarize_media";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Upload a meeting recording or audio file." }, { status: 400 });
    }

    const mimeType = resolveMediaMime(file.name, file.type);
    if (!mimeType) {
      return NextResponse.json(
        { error: "Use an audio or video file such as MP3, WAV, M4A, MP4, WebM, or MOV." },
        { status: 400 }
      );
    }

    if (file.size > MAX_RECORDING_BYTES) {
      return NextResponse.json({ error: "Recording must be 50 MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await summarizeMeetingMedia(buffer, mimeType, file.name);

    return NextResponse.json({
      summary: result.summary,
      mom: result.mom,
      tasks: result.tasks,
      schedule: result.schedule,
    });
  } catch (error) {
    console.error("Error summarizing recording:", error);
    const message = error instanceof Error ? error.message : "Failed to summarize recording.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
