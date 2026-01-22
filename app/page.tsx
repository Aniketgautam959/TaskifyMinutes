'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { generateMeetingSummary } from './actions';

// --- Types ---

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

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

const Navbar: React.FC = () => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-[80%] max-w-7xl border border-border bg-background/80 backdrop-blur-xl rounded-full shadow-2xl transition-all">
    <div className="w-full px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">TaskifyMinutes</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/sign-in" className="text-green-500 hover:text-green-600 text-xs font-semibold transition-colors">
          Login
        </Link>
        <Link href="/sign-up" className="bg-green-500/30 text-green-500 hover:text-green-600 px-5 py-2 rounded-full text-xs font-semibold hover:bg-green-500 hover:text-white transition-colors">
          Sign Up
        </Link>
      </div>
    </div>
  </nav>
);

const FeatureCard: React.FC<FeatureProps> = ({ title, description, icon, className }) => (
  <div className={`relative p-8 rounded-3xl bg-muted/30 border border-border overflow-hidden group hover:bg-muted/50 transition-all duration-500 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div>
        <div className="mb-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-foreground/90 group-hover:scale-110 group-hover:text-foreground transition-all duration-500 shadow-lg shadow-black/5 dark:shadow-black/20">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">{title}</h3>
        <p className="text-muted-foreground group-hover:text-foreground/80 text-sm leading-relaxed font-medium transition-colors">{description}</p>
      </div>
    </div>
  </div>
);

const Footer: React.FC = () => (
  <footer className="border-t border-border py-12 px-6 bg-background">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-foreground/80">TaskifyMinutes</span>
      </div>
      <div className="flex items-center gap-8 text-xs font-medium text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
        <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
      </div>
      <p className="text-muted-foreground text-xs">
        &copy; {new Date().getFullYear()} TaskifyMinutes Inc.
      </p>
    </div>
  </footer>
);

// --- Main Application ---

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>("John: We need to finalize the Q3 budget by Thursday morning. \nSarah: I can have the draft ready by tomorrow afternoon. \nMike: Let's schedule a follow-up for Wednesday at 4 PM to review Sarah's draft. \nJohn: Perfect, I'll also assign the resource allocation task to Kevin.");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await generateMeetingSummary(transcript);
      setResult(data);
    } catch (err) {
      console.error("AI Error:", err);
      setError("Unable to process transcript. Please ensure the API key is active and configured correctly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dotted-bg selection:bg-neutral-500 selection:text-white bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-0 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-muted-foreground mb-8 bg-muted/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
            </span>
            Turn Your Meeting into Action.
          </div>
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-2 text-foreground md:px-20 pb-4">
            Meetings into Action.
          </h1>
          <p className="text-lg md:text-lg text-muted-foreground max-w-4xl mx-auto mb-5 leading-relaxed font-light">
            AI-powered summaries, automated MOM generation, and smart task extraction. Stop taking notes, start taking action.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/sign-up" className="w-full sm:w-auto px-8 py-3 bg-green-500/20 hover:bg-green-600/20 border border-green-500/40 rounded-full text-lg font-bold transition-all flex items-center justify-center gap-2 text-green-400 cursor-pointer">
              Try TaskifyMinutes <span className="text-lg">›</span>
            </Link>
            <Link href="https://github.com/Aniketgautam959/TaskifyMinutes" target="_blank" className="w-full sm:w-auto px-8 py-3 bg-indigo-500/20 hover:bg-indigo-600/20 border border-indigo-500/40 rounded-full text-lg font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 text-indigo-400 cursor-pointer">
              <Github className="w-5 h-5" />
              GitHub
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto max-w-6xl animate-fade-in">
            <div className="rounded-xl border border-border p-2 bg-muted/50 backdrop-blur-xl shadow-2xl">
              <img
                src="/dashboard-preview.png"
                alt="App Dashboard"
                className="rounded-lg w-full h-auto shadow-inner"
              />
            </div>
            {/* Fade gradient */}
            <div className="absolute -bottom-2 left-0 right-0 h-64 bg-gradient-to-t from-background via-background to-transparent z-20"></div>
          </div>
        </div>

        {/* Background glow for the dashboard */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      </section>

      {/* Features & Tech Stack */}
      <section id="features" className="py-20 px-10 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">Intelligence, refined.</h2>
              <p className="text-muted-foreground max-w-xl text-sm md:text-base leading-relaxed">
                Powered by <span className="text-foreground font-semibold">Gemini Flash</span> and built on <span className="text-foreground font-semibold">Next.js 16</span>,
                TaskifyMinutes transforms raw audio/video/transcript into structured insights and actionable items in seconds.
              </p>
            </div>
            {/* Tech Stack Badges */}
            <div className="flex gap-3 flex-wrap">
              {['Next.js 16', 'Gemini AI', 'Google Cloud Storage', 'Tailwind CSS', 'TypeScript'].map(tech => (
                <span key={tech} className="px-3 py-1 rounded-full border border-border bg-muted text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="MOM Generator"
              description="Instantly draft minutes with distinct separation of actions, decisions, and informational nodes."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <FeatureCard
              title="Transcript Generator"
              description="Generate high-quality transcripts from raw audio/video files in seconds."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>}
            />
            <FeatureCard
              title="Task Extraction"
              description="Zero-shot task identification and assignment from natural language conversations."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:h-[600px]">

            {/* Left Col: Input */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Demo
              </h3>
              <div className="flex-1 flex flex-col p-1 rounded-3xl bg-muted/30 border border-border shadow-2xl overflow-hidden relative group hover:border-border/80 transition-colors">
                <textarea
                  className="flex-1 w-full bg-transparent p-6 text-foreground resize-none outline-none font-mono text-sm leading-relaxed scrollbar-hide "
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your meeting transcript here..."
                />
                <div className="p-4 backdrop-blur-md flex items-center justify-end">
                  <button
                    onClick={handleSummarize}
                    disabled={loading || !transcript.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-green-500/20 hover:bg-green-600/20 border border-green-500/40 rounded-full text-sm font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 text-green-400 cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Analyze Text'}
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
              <div className="h-full rounded-3xl bg-muted/30 border border-border p-1 relative overflow-hidden">

                {!result && !loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <p className="text-sm font-medium">Awaiting Input</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-xs text-primary font-medium tracking-wide animate-pulse">EXTRACTING INSIGHTS</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Summary Block */}
                    <div className="animate-fade-in">
                      <h4 className="text-md items-center flex gap-2 font-bold text-foreground tracking-widest mb-3">
                        <span className="w-1 h-1 rounded-full bg-foreground"></span>
                        Executive Summary
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed font-light">{result.summary}</p>
                    </div>

                    <div className="h-px bg-border w-full"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in delay-75">
                      {/* MOM */}
                      <div>
                        <h4 className="text-md items-center flex gap-2 font-bold text-foreground mb-3">
                          <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                          Minutes & Points
                        </h4>
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
                        <h4 className="text-md items-center flex gap-2 font-bold text-foreground mb-3">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          Detected Tasks
                        </h4>
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
