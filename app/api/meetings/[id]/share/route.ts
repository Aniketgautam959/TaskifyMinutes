import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";
import { Meeting } from "@/app/models/Meeting";
import { ensureUserSynced } from "@/app/lib/syncUser";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    await connectToDatabase();
    const meeting = await Meeting.findOne({ _id: id, user: user._id });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!meeting.shareToken) {
      meeting.shareToken = randomBytes(24).toString("base64url");
      await meeting.save();
    }

    const url = new URL(`/share/${meeting.shareToken}`, req.url).toString();
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
