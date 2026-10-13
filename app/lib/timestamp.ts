export function timestampToSeconds(value: string): number | null {
  const text = value.trim().toLowerCase();
  if (!text) return null;

  const clock = text.match(/(?:(\d+):)?(\d+):(\d{2})(?!\d)/);
  if (clock) {
    const hours = clock[1] ? Number(clock[1]) : 0;
    const minutes = Number(clock[2]);
    const seconds = Number(clock[3]);
    if (Number.isFinite(hours) && Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  const spoken = text.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)/);
  if (spoken && (spoken[1] || spoken[2] || spoken[3])) {
    return Number(spoken[1] || 0) * 3600 + Number(spoken[2] || 0) * 60 + Number(spoken[3] || 0);
  }

  return null;
}
