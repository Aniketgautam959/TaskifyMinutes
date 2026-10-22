import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedMeeting } from "@/app/lib/sharedMeeting";
import { REDACTED_LINE } from "@/app/lib/redact";
import { timestampToSeconds } from "@/app/lib/timestamp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const meeting = await getSharedMeeting(token);
  return {
    title: meeting ? `${meeting.title} · Minutes` : "Shared minutes",
    description: meeting?.summary || "Meeting minutes shared from TaskifyMinutes",
  };
}

export default async function SharedMinutesPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { token } = await params;
  const { t } = await searchParams;
  const meeting = await getSharedMeeting(token);
  if (!meeting) notFound();

  const target = t ? Number(t) : NaN;
  const moment = Number.isFinite(target)
    ? meeting.transcript
        .map((item) => ({ item, at: timestampToSeconds(item.timestamp) }))
        .filter((entry) => entry.at !== null)
        .sort((left, right) => Math.abs((left.at as number) - target) - Math.abs((right.at as number) - target))[0]?.item
    : undefined;

  const dateLabel = new Date(meeting.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 py-10 sm:py-12 text-foreground">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Shared minutes</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight break-words" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {meeting.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateLabel}
            {meeting.duration ? ` · ${meeting.duration}` : ""}
            {meeting.category ? ` · ${meeting.category}` : ""}
          </p>
          {meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meeting.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {moment && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Shared moment · {moment.timestamp}</p>
            <p className="mt-2 text-sm font-medium">{moment.speakername}</p>
            <p className="mt-2 text-base leading-relaxed">{moment.content}</p>
            {moment.content === REDACTED_LINE && (
              <p className="mt-2 text-xs text-muted-foreground">The rest of this line is not on the public link.</p>
            )}
          </section>
        )}

        {meeting.summary && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <h2 className="mb-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Summary</h2>
            <p className="text-sm leading-relaxed">{meeting.summary}</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Minutes</h2>
          {meeting.mom.length === 0 && <p className="text-sm text-muted-foreground">No minutes were captured.</p>}
          <div className="grid gap-2">
            {meeting.mom.map((item, index) => (
              <div key={`${item.type}-${index}`} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-black uppercase text-muted-foreground">
                  {item.type.charAt(0)}
                </span>
                <p className="text-sm">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Transcript</h2>
          {meeting.transcript.length === 0 && <p className="text-sm text-muted-foreground">No transcript was captured.</p>}
          <div className="space-y-3">
            {meeting.transcript.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-1 flex items-baseline gap-3">
                  <span className="text-xs font-bold">{item.speakername}</span>
                  {item.timestamp && <span className="font-mono text-[10px] text-muted-foreground">{item.timestamp}</span>}
                </div>
                <p className="text-sm leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">Shared from TaskifyMinutes</footer>
      </article>
    </main>
  );
}
