import { connectToDatabase } from "./db";
import { Meeting } from "../models/Meeting";

export type SharedMeeting = {
  title: string;
  date: string;
  duration: string;
  summary: string;
  category: string;
  tags: string[];
  mom: { type: "action" | "decision" | "info"; content: string }[];
  transcript: { speakername: string; content: string; timestamp: string }[];
};

export async function getSharedMeeting(token: string): Promise<SharedMeeting | null> {
  if (!token || token.length < 16) return null;

  await connectToDatabase();
  const meeting = await Meeting.findOne({ shareToken: token }).lean();
  if (!meeting) return null;

  return {
    title: meeting.title,
    date: new Date(meeting.date).toISOString(),
    duration: meeting.duration || "",
    summary: meeting.summary || "",
    category: meeting.category || "",
    tags: meeting.tags || [],
    mom: (meeting.mom || [])
      .filter((item) => item?.content)
      .map((item) => ({
        type: item.type === "action" || item.type === "decision" || item.type === "info" ? item.type : "info",
        content: item.content || "",
      })),
    transcript: (meeting.transcript || [])
      .filter((item) => item?.content)
      .map((item) => ({
        speakername: item.speakername || "Speaker",
        content: item.content || "",
        timestamp: item.timestamp || "",
      })),
  };
}
