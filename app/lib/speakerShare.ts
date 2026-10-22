import { timestampToSeconds } from "./timestamp";

export type SpeakerShare = {
  name: string;
  seconds: number;
  share: number;
};

const MAX_TURN_SECONDS = 180;

export function speakerShare(
  transcript: { speakername?: string; timestamp?: string }[]
): SpeakerShare[] {
  const turns = transcript.map((item) => ({
    name: (item.speakername || "Speaker").trim() || "Speaker",
    at: timestampToSeconds(item.timestamp || ""),
  }));

  const totals = new Map<string, number>();
  for (let index = 0; index < turns.length; index += 1) {
    const next = turns.slice(index + 1).find((turn) => turn.at !== null);
    let seconds = 8;
    if (turns[index].at !== null && next?.at != null) {
      const gap = next.at - (turns[index].at as number);
      if (gap > 0) seconds = Math.min(gap, MAX_TURN_SECONDS);
    }
    totals.set(turns[index].name, (totals.get(turns[index].name) || 0) + seconds);
  }

  const sum = [...totals.values()].reduce((total, seconds) => total + seconds, 0) || 1;
  return [...totals.entries()]
    .map(([name, seconds]) => ({ name, seconds, share: seconds / sum }))
    .sort((left, right) => right.seconds - left.seconds);
}

export function formatSpokenTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes <= 0) return `${rest}s`;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}
