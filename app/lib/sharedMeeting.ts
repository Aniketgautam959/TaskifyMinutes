import { connectToDatabase } from "./db";
import { Meeting } from "../models/Meeting";
import { isSensitiveText, REDACTED_LINE } from "./redact";

function redactProse(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => (isSensitiveText(sentence) ? REDACTED_LINE : sentence))
    .join(" ");
}

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
    summary: meeting.summary ? redactProse(meeting.summary) : "",
    category: meeting.category || "",
    tags: meeting.tags || [],
    mom: (meeting.mom || [])
      .filter((item) => item?.content)
      .map((item) => ({
        type: item.type === "action" || item.type === "decision" || item.type === "info" ? item.type : "info",
        content: isSensitiveText(item.content || "") ? REDACTED_LINE : item.content || "",
      })),
    transcript: (meeting.transcript || [])
      .filter((item) => item?.content)
      .map((item) => ({
        speakername: item.speakername || "Speaker",
        content: isSensitiveText(item.content || "") ? REDACTED_LINE : item.content || "",
        timestamp: item.timestamp || "",
      })),
  };
}
