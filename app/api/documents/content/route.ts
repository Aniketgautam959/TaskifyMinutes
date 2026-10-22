import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/app/lib/db";
import { FileModel } from "@/app/models/File";
import { User } from "@/app/models/User";
import { openRecording } from "@/app/services/logic/recording_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return null;
  const [, startText, endText] = match;
  if (!startText && !endText) return null;

  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isFinite(suffix) || suffix <= 0) return "invalid" as const;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = Number(startText);
  const end = endText ? Number(endText) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size || end < start) {
    return "invalid" as const;
  }
  return { start, end: Math.min(end, size - 1) };
}

function disposition(filename: string) {
  const safe = filename.replace(/["\r\n]/g, "");
  return `inline; filename="${safe}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fileId = req.nextUrl.searchParams.get("fileId");
    const storageIdQuery = req.nextUrl.searchParams.get("storageId");
    let storageId = storageIdQuery || "";
    let fallbackType = "";

    if (fileId) {
      const fileDoc = await FileModel.findById(fileId);
      if (!fileDoc || String(fileDoc.user) !== String(user._id)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      if (!fileDoc.storageId) {
        return NextResponse.json({ error: "Recording is not available" }, { status: 404 });
      }
      storageId = fileDoc.storageId;
      fallbackType =
        fileDoc.filetype === "image"
          ? "image/jpeg"
          : fileDoc.filetype === "audio"
            ? "audio/webm"
            : fileDoc.filetype === "video"
              ? "video/webm"
              : "text/plain";
    }

    if (!storageId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const recording = await openRecording(storageId);
    if (!recording || (!fileId && recording.ownerId !== String(user._id))) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const contentType = recording.contentType || fallbackType || "application/octet-stream";
    const size = recording.size;
    if (size <= 0) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": "0",
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const rangeHeader = req.headers.get("range");
    const range = rangeHeader ? parseRange(rangeHeader, size) : null;

    if (range === "invalid") {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? size - 1;
    const nodeStream = recording.stream(start, end + 1);
    const body = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    const headers = {
      "Content-Type": contentType,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Content-Disposition": disposition(recording.fileName),
      "Cache-Control": "private, max-age=3600",
    };

    if (range) {
      return new NextResponse(body, {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.error("Recording content error:", error);
    return NextResponse.json({ error: "Could not open the recording" }, { status: 500 });
  }
}
