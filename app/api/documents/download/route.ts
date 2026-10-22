import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/app/lib/db";
import { FileModel } from "@/app/models/File";
import { User } from "@/app/models/User";
import { recordingMediaUrl } from "@/app/services/logic/recording_store";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = req.nextUrl.searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc || String(fileDoc.user) !== String(user._id) || !fileDoc.storageId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ url: recordingMediaUrl(fileId) }, { status: 200 });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json({ error: "Could not open the recording" }, { status: 500 });
  }
}
