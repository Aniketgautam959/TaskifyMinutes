import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/app/lib/db";
import { Meeting } from "@/app/models/Meeting";
import { ensureUserSynced } from "@/app/lib/syncUser";
import "@/app/models/Task";
import { formatSpokenTime, speakerShare } from "@/app/lib/speakerShare";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(
  _req: Request,
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
    const current = await Meeting.findOne({ _id: id, user: user._id }).select("category");
    if (!current) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const category = (current.category || "").trim();
    if (!category) {
      return NextResponse.json({ category: "", meetings: [] });
    }

    const related = await Meeting.find({
      user: user._id,
      _id: { $ne: current._id },
      category: new RegExp(`^${escapeRegex(category)}$`, "i"),
    })
      .sort({ date: -1 })
      .limit(6)
      .populate("tasks", "title status");

    const meetings = related.map((meeting) => {
      const tasks = Array.isArray(meeting.tasks) ? meeting.tasks : [];
      return {
        id: String(meeting._id),
        title: meeting.title,
        date: meeting.date,
        decisions: (meeting.mom || [])
          .filter((item) => item?.type === "decision" && item.content)
          .map((item) => item.content),
        openTasks: tasks.flatMap((task) => {
          if (!task || typeof task !== "object" || !("title" in task)) return [];
          const item = task as unknown as { title?: string; status?: string };
          if (!item.title || item.status === "Completed") return [];
          return [{ title: item.title, status: item.status || "Backlog" }];
        }),
        speakers: speakerShare(meeting.transcript || []).slice(0, 2).map((speaker) => ({
          name: speaker.name,
          time: formatSpokenTime(speaker.seconds),
        })),
      };
    });

    return NextResponse.json({ category, meetings });
  } catch (error) {
    console.error("Error loading meeting series:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
