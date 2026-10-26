'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { AudioLines, Menu, X } from 'lucide-react';
import { generateMeetingSummary } from './actions';
import { ThemeToggle } from './components/ThemeToggle';

// --- Types ---

interface SummaryResult {
  summary: string;
  mom: { type: 'action' | 'decision' | 'info'; content: string }[];
  tasks: string[];
  schedule: {
    event: string;
    time: string;
  }[];
}
// --- Sub-Components ---

const navLinks = [
  { href: '#problem', label: 'Why' },
  { href: '#features', label: 'Product' },
  { href: '#demo', label: 'Demo' },
  { href: 'https://github.com/Aniketgautam959/TaskifyMinutes', label: 'GitHub', external: true },
];

const problems = [
  {
    title: 'Notes get skipped',
    body: 'The call ends. You tell yourself you’ll write it up later. Later never comes, and the client asks what you agreed last Thursday.',
  },
  {
    title: 'Tasks slip away',
    body: 'A deadline buried in chat. A revision promised on the call. By invoice week, half of it has already leaked out of your head.',
  },
  {
    title: 'Language gets in the way',
    body: 'The Meet ran in Hindi or Hinglish. The client needs English minutes. Rewriting from memory is where the real mistakes start.',
  },
];

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-3">
          <Link href="/" className="flex items-center gap-2.5 pl-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight">TaskifyMinutes</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-muted/80 p-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/sign-in" className="hidden px-2 text-sm text-muted-foreground hover:text-foreground sm:inline">
              Log in
            </Link>
            <Link href="/sign-up" className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Start
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="flex flex-col gap-1 border-t border-border px-3 py-3 md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
            <Link href="/sign-in" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted sm:hidden">
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

const features = [
  {
    kicker: 'Client thread',
    title: 'Same client, same page',
    description: 'Last week’s decision and the open revision sit above today’s call. You do not restart the brief from a blank ChatGPT box.',
    example: 'Earlier with Acme · Send the revised quote',
  },
  {
    kicker: 'Moment',
    title: 'Share 00:18, not the whole Meet',
    description: 'Send the exact line where the client locked the scope. The link opens on that second; the rest of the minutes stay under it.',
    example: 'Client · 00:18 · Ship by Friday EOD',
  },
  {
    kicker: 'No language wall',
    title: 'Hindi in. English out.',
    description: 'Record the call as it happened — Hindi, Hinglish, or mixed. Minutes, decisions, and tasks come back in clear English.',
    example: 'Hinglish Meet → English MOM + tasks',
  },
  {
    kicker: 'Board',
    title: 'Tasks leave the call alive',
    description: 'Action items land on your board with priority. What the client asked for does not die in a forgotten recording.',
    example: 'High · Send draft · Due after this call',
  },
];

const spoken = [
  { name: 'Client', time: '6m', width: '60%' },
  { name: 'You', time: '4m', width: '40%' },
];

const sourceApps = [
  { name: 'Meet', mark: <MeetMark /> },
  { name: 'Zoom', mark: <ZoomMark /> },
  { name: 'Teams', mark: <TeamsMark /> },
  { name: 'Slack', mark: <SlackMark /> },
  { name: 'Webex', mark: <WebexMark /> },
];

const SourceRow: React.FC = () => (
  <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-sm text-muted-foreground">Record the Meet, Zoom, or Teams tab while you work. No language barrier on the write-up.</span>
    <div className="flex flex-wrap gap-2">
      {sourceApps.map((app) => (
        <span key={app.name} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {app.mark}
          {app.name}
        </span>
      ))}
    </div>
  </div>
);

function MeetMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#1a73e8" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path fill="#34a853" d="M16 10.2 20.2 7.6A1 1 0 0 1 21.8 8.5v7a1 1 0 0 1-1.6.8L16 13.7v-3.5Z" />
    </svg>
  );
}

function ZoomMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#2D8CFF" />
      <path fill="#fff" d="M6 8.5h7.2c.7 0 1.3.6 1.3 1.3v4.4c0 .7-.6 1.3-1.3 1.3H6.8c-.7 0-1.3-.6-1.3-1.3V9.8c0-.7.6-1.3 1.3-1.3H6Zm9.2 1.7 2.6-1.5c.3-.2.7 0 .7.4v5.8c0 .4-.4.6-.7.4l-2.6-1.5v-3.6Z" />
    </svg>
  );
}

function TeamsMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#5059C9" />
      <path fill="#fff" d="M9.2 8.2h5.2v1.5h-1.8V16h-1.6V9.7H9.2V8.2Z" />
      <circle cx="16.6" cy="8.2" r="1.3" fill="#7B83EB" />
    </svg>
  );
}

function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#E01E5A" d="M9.2 14.6a1.6 1.6 0 1 1-1.6-1.6h1.6v1.6Z" />
      <path fill="#E01E5A" d="M10 14.6a1.6 1.6 0 0 1 3.2 0v4a1.6 1.6 0 0 1-3.2 0v-4Z" />
      <path fill="#36C5F0" d="M11.6 9.2a1.6 1.6 0 1 1 1.6-1.6v1.6h-1.6Z" />
      <path fill="#36C5F0" d="M11.6 10a1.6 1.6 0 0 1 0-3.2h4a1.6 1.6 0 0 1 0 3.2h-4Z" />
      <path fill="#2EB67D" d="M16.8 11.6a1.6 1.6 0 1 1 1.6 1.6h-1.6v-1.6Z" />
      <path fill="#2EB67D" d="M16 11.6a1.6 1.6 0 0 1-3.2 0v-4a1.6 1.6 0 0 1 3.2 0v4Z" />
      <path fill="#ECB22E" d="M14.4 16.8a1.6 1.6 0 1 1-1.6 1.6v-1.6h1.6Z" />
      <path fill="#ECB22E" d="M14.4 16a1.6 1.6 0 0 1 0 3.2h-4a1.6 1.6 0 0 1 0-3.2h4Z" />
    </svg>
  );
}

function WebexMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#00A0D2" />
      <path fill="#fff" d="M7.2 13.4c1.2-2.2 2.6-3.8 4.8-4.8 2.2 1 3.6 2.6 4.8 4.8-1.2 2.2-2.6 3.8-4.8 4.8-2.2-1-3.6-2.6-4.8-4.8Z" />
    </svg>
  );
}

const Footer: React.FC = () => (
  <footer className="px-4 pb-8 pt-16">
    <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card px-6 py-8 md:px-8">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span className="text-sm font-semibold">TaskifyMinutes</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Built for freelancers whose client calls slip away. Minutes, decisions, and tasks — with no language barrier.
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href="#problem" className="hover:text-foreground">The problem</a>
            <a href="#features" className="hover:text-foreground">Client threads</a>
            <a href="#features" className="hover:text-foreground">No language wall</a>
            <a href="#demo" className="hover:text-foreground">Try a sample call</a>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Account</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/sign-in" className="hover:text-foreground">Log in</Link>
            <Link href="/sign-up" className="hover:text-foreground">Create account</Link>
            <Link href="/meetings" className="hover:text-foreground">Your meetings</Link>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Elsewhere</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href="https://github.com/Aniketgautam959/TaskifyMinutes" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
            <a href="https://taskify-minutes.vercel.app" className="hover:text-foreground">Live app</a>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {new Date().getFullYear()} TaskifyMinutes</span>
        <span>No language barrier — Hindi and Hinglish come back in English.</span>
      </div>
    </div>
  </footer>
);

// --- Main Application ---

const sampleResult: SummaryResult = {
  summary: "The team will close the Q3 budget by Thursday morning. Sarah is sending the draft tomorrow, and everyone reviews it Wednesday at 4 PM. Kevin takes resource allocation.",
  mom: [
    { type: 'decision', content: 'Finalize the Q3 budget by Thursday morning.' },
    { type: 'action', content: 'Sarah sends the budget draft tomorrow afternoon.' },
    { type: 'info', content: 'Follow-up review is Wednesday at 4 PM.' },
  ],
  tasks: [
    'Sarah: send the Q3 budget draft by tomorrow afternoon',
    'Review Sarah’s draft on Wednesday at 4 PM',
    'Kevin: own resource allocation',
  ],
  schedule: [{ event: 'Budget draft review', time: 'Wednesday at 4 PM' }],
};

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>("John: We need to finalize the Q3 budget by Thursday morning.\nSarah: I can have the draft ready by tomorrow afternoon.\nJohn: Let's schedule a follow-up for Wednesday at 4 PM.\nSarah: Perfect. I will assign the resource allocation to Kevin.");
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showingSample, setShowingSample] = useState(true);
  const [result, setResult] = useState<SummaryResult | null>(sampleResult);
  const [error, setError] = useState<string | null>(null);

  const selectRecording = (file: File | null) => {
    if (!file) return;
    const allowed = /\.(mp3|wav|m4a|aac|ogg|opus|webm|mp4|m4v|mov|mpeg|mpg)$/i.test(file.name) || file.type.startsWith('audio/') || file.type.startsWith('video/');
    if (!allowed) {
      setError('Use an audio or video file such as MP3, WAV, MP4, MOV, or WebM.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Recording must be 50 MB or smaller.');
      return;
    }
    setError(null);
    setMediaFile(file);
  };

  const handleSummarize = async () => {
    if (inputMode === 'text' && !transcript.trim()) return;
    if (inputMode === 'audio' && !mediaFile) return;
    setLoading(true);
    setError(null);
    setShowingSample(false);
    setResult(null);

    try {
      if (inputMode === 'audio' && mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const response = await fetch('/api/summarize-media', { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to summarize this recording.');
        }
        setResult(data);
      } else {
        const data = await generateMeetingSummary(transcript);
        setResult(data);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setError(err instanceof Error ? err.message : "Unable to process this meeting. Please ensure the API key is active and configured correctly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto max-w-5xl">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="lg:pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">For freelancers</p>
            <h1
              className="mt-4 max-w-lg text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Client calls that don’t slip away.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              When notes get skipped and tasks vanish after a Meet — keep minutes, decisions, and board tasks in one place. No language barrier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Start free
              </Link>
              <a href="#problem" className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                See the problem
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-4 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.55)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acme · Client call</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">Website revision sync</p>
              </div>
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">28m</span>
            </div>

            <div className="mt-4 rounded-2xl bg-background p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Earlier with Acme</p>
              <p className="mt-1 text-sm font-medium">Kickoff · Scope lock</p>
              <p className="mt-2 text-xs leading-relaxed text-foreground">Decision: homepage redesign ships before the blog.</p>
              <p className="mt-1 text-xs text-muted-foreground">Still open · Send the revised quote</p>
            </div>

            <div className="mt-3 rounded-2xl border border-border px-3.5 py-3">
              <p className="text-[11px] text-muted-foreground">Shared moment · 00:18</p>
              <p className="mt-1.5 text-sm font-medium">Client</p>
              <p className="mt-1 text-sm leading-relaxed">Can you ship the draft by Friday EOD?</p>
            </div>

            <div className="mt-4 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Who spoke</p>
              {spoken.map((person) => (
                <div key={person.name} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-xs">
                  <span className="font-medium">{person.name}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: person.width }} />
                  </span>
                  <span className="text-right text-muted-foreground">{person.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SourceRow />
        </div>
      </section>

      <section id="problem" className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">The problem</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Freelancer meetings that quietly disappear.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              You’re on back-to-back client Meets. The recording sits in Drive. The WhatsApp follow-up never gets written. Scope, deadlines, and “what we decided” leak out before the next invoice.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {problems.map((problem) => (
              <article key={problem.title} className="rounded-3xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold tracking-tight">{problem.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{problem.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">What TaskifyMinutes does</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
              From a skipped call to minutes you can send.
            </h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{feature.kicker}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <p className="mt-4 rounded-xl bg-muted/70 px-3 py-2 font-mono text-[11px] text-foreground/80">{feature.example}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Try it on a client call</p>
          <h2 className="mb-6 mt-3 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>Paste notes, or drop a recording.</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:h-[560px]">
            <div className="flex h-full flex-col lg:col-span-5">
              <div className="mb-4 inline-flex rounded-full border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => { setInputMode('text'); setError(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Transcript
                </button>
                <button
                  type="button"
                  onClick={() => { setInputMode('audio'); setError(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${inputMode === 'audio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Audio / Video
                </button>
              </div>
              <div className="flex-1 flex flex-col p-1 rounded-3xl bg-card border border-border shadow-sm overflow-hidden relative group transition-colors">
                {inputMode === 'text' ? (
                  <textarea
                    className="flex-1 w-full bg-transparent p-6 text-foreground resize-none outline-none font-mono text-sm leading-relaxed scrollbar-hide "
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste a client call. Hindi or Hinglish comes back in English — no language barrier."
                  />
                ) : (
                  <label
                    className="flex-1 m-3 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-background/40 px-6 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      selectRecording(e.dataTransfer.files?.[0] || null);
                    }}
                  >
                    <input
                      type="file"
                      accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.mp4,.m4v,.mov,.mpeg,.mpg"
                      className="sr-only"
                      onChange={(e) => {
                        selectRecording(e.target.files?.[0] || null);
                        e.target.value = '';
                      }}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground">
                      <AudioLines className="w-5 h-5" />
                    </div>
                    {mediaFile ? (
                      <div className="flex items-center gap-2 max-w-full">
                        <span className="text-sm font-semibold text-foreground truncate">{mediaFile.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMediaFile(null); }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Remove recording"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">Drop a meeting audio or video</p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, MP4, MOV, or WebM up to 50 MB</p>
                      </>
                    )}
                  </label>
                )}
                <div className="p-4 backdrop-blur-md flex items-center justify-end">
                  <button
                    onClick={handleSummarize}
                    disabled={loading || (inputMode === 'text' ? !transcript.trim() : !mediaFile)}
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Writing the minutes...' : inputMode === 'audio' ? 'Write minutes from this recording' : 'Write the minutes'}
                    {!loading && <span className="text-xs">→</span>}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Unable to analyze text, please try again later.
                </div>
              )}
            </div>

            {/* Right Col: Output */}
            <div className="lg:col-span-7 h-full min-h-[500px] flex flex-col">
              <div className="h-full rounded-3xl bg-card border border-border shadow-sm p-1 relative overflow-hidden">

                {!result && !loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <p className="text-sm font-medium">Minutes land here</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Reading the meeting</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {showingSample && (
                        <div className="rounded-2xl border border-border bg-muted/40 p-4">
                        <p className="text-xs text-muted-foreground">Finance · Q3 Budget Review</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">Q3 Budget Review</p>
                        <audio src="/sample-meeting.m4a" controls preload="metadata" className="mt-3 w-full" />
                      </div>
                    )}
                    {/* Summary Block */}
                    <div className="animate-fade-in">
                      <h3 className="mb-2 text-sm font-medium text-foreground">Summary</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed font-light">{result.summary}</p>
                    </div>

                    <div className="h-px bg-border w-full"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in delay-75">
                      {/* MOM */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-foreground">Minutes</h3>
                        <div className="space-y-2">
                          {result.mom.map((item, i) => (
                            <div key={i} className="flex gap-3 text-xs p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
                              <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-sm ${item.type === 'decision' ? 'bg-indigo-400' :
                                item.type === 'action' ? 'bg-emerald-400' : 'bg-muted-foreground'
                                }`} />
                              <span className="text-muted-foreground leading-snug">{item.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tasks */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-foreground">Tasks</h3>
                        <div className="space-y-2">
                          {result.tasks.map((task, i) => (
                            <div key={i} className="group flex items-start justify-between gap-3 text-xs p-3 rounded-lg bg-card border border-border hover:border-border/80 transition-all cursor-default">
                              <div className="flex gap-2">
                                <div className="mt-0.5 w-3 h-3 rounded border border-muted-foreground group-hover:border-emerald-500 transition-colors flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-muted-foreground line-clamp-2">{task}</span>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default App;
