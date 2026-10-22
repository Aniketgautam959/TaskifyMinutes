import { Readable } from "node:stream";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";

const BUCKET_NAME = "recordings";

export type StoredRecording = {
  fileName: string;
  storageId: string;
  contentType: string;
};

export type OpenRecording = {
  fileName: string;
  contentType: string;
  size: number;
  ownerId: string;
  stream: (start?: number, endExclusive?: number) => Readable;
};

function cleanFileName(name: string) {
  const base = name.split(/[/\\]/).pop() || "recording";
  const cleaned = base.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 180);
  return cleaned || "recording";
}

async function recordingsBucket() {
  const connection = await connectToDatabase();
  const db = connection.connection.db;
  if (!db) {
    throw new Error("Database is not connected");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export function recordingMediaUrl(fileId: string) {
  return `/api/documents/content?fileId=${encodeURIComponent(fileId)}`;
}

export async function saveRecording(
  buffer: Buffer,
  originalFileName: string,
  contentType: string,
  ownerId?: string
): Promise<StoredRecording> {
  const fileName = `${Date.now()}-${cleanFileName(originalFileName)}`;
  const type = contentType || "application/octet-stream";
  const bucket = await recordingsBucket();
  const id = new mongoose.Types.ObjectId();

  await new Promise<void>((resolve, reject) => {
    const upload = bucket.openUploadStreamWithId(id, fileName, {
      contentType: type,
      metadata: { ownerId: ownerId || "", contentType: type },
    });
    upload.on("error", reject);
    upload.on("finish", () => resolve());
    upload.end(buffer);
  });

  return { fileName, storageId: id.toHexString(), contentType: type };
}

export async function openRecording(storageId: string): Promise<OpenRecording | null> {
  if (!mongoose.Types.ObjectId.isValid(storageId)) return null;
  const id = new mongoose.Types.ObjectId(storageId);
  const bucket = await recordingsBucket();
  const [file] = await bucket.find({ _id: id }).toArray();
  if (!file) return null;

  const metadata = (file.metadata || {}) as { ownerId?: string; contentType?: string };
  const contentType = metadata.contentType || file.contentType || "application/octet-stream";

  return {
    fileName: file.filename,
    contentType,
    size: file.length,
    ownerId: metadata.ownerId || "",
    stream: (start = 0, endExclusive = file.length) =>
      bucket.openDownloadStream(id, { start, end: endExclusive }),
  };
}
