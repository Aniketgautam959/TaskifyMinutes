'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Meeting, Task } from '../types';
import SuggestedTask from '../microcomponents/SuggestedTask';
import { Calendar, Clock, Download, FileText, Loader, ArrowLeft, Trash2, Maximize2, MoreHorizontal, Sparkles, Video, Link2 } from 'lucide-react';
import { getMeetingById, deleteMeeting } from '../services/api/meetings';
import { timestampToSeconds } from '../lib/timestamp';
import { formatSpokenTime, speakerShare } from '../lib/speakerShare';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface MeetingViewProps {
  meetingId: string;
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
}

type SeriesMeeting = {
  id: string;
  title: string;
  date: string;
  decisions: string[];
  openTasks: { title: string; status: string }[];
  speakers?: { name: string; time: string }[];
};

const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, onAddTask }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<'Transcript' | 'MOM'>('Transcript');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [videoSignedUrl, setVideoSignedUrl] = useState<string | null>(null);
  const [transcriptSignedUrl, setTranscriptSignedUrl] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const soughtRef = useRef(false);
  const [series, setSeries] = useState<{ category: string; meetings: SeriesMeeting[] } | null>(null);
  const [screenShots, setScreenShots] = useState<{ url: string; seconds: number }[]>([]);

  const fetchMeeting = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await getMeetingById(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error('Failed to fetch meeting:', err);
      setError('Failed to load meeting details');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!meeting) return;
    setIsDeleting(true);
    try {
      await deleteMeeting(meeting.id);
      router.push('/meetings');
      router.refresh();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      alert('Failed to delete meeting. Please try again.');
      setIsDeleting(false);
    }
  };

  const seekToTimestamp = (timestamp: string, line: number) => {
    const seconds = timestampToSeconds(timestamp);
    const media = audioRef.current ?? videoRef.current;
    if (seconds === null || !media) return;
    media.currentTime = seconds;
    setActiveLine(line);
    void media.play().catch(() => undefined);
  };

  const handleShare = async () => {
    if (!meeting) return;
    setIsSharing(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/share`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not create a share link');
      }
      await navigator.clipboard.writeText(data.url);
      toast.success('Share link copied. Salaries, amounts, and passwords stay off the public page.');
    } catch (err) {
      console.error('Failed to share meeting:', err);
      toast.error(err instanceof Error ? err.message : 'Could not copy the share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareMoment = async (event: React.MouseEvent, timestamp: string) => {
    event.stopPropagation();
    if (!meeting) return;
    const seconds = timestampToSeconds(timestamp);
    if (seconds === null) {
      toast.error('This line has no timestamp to share.');
      return;
    }
    setIsSharing(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/share`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create a share link');
      const url = new URL(data.url);
      url.searchParams.set('t', String(seconds));
      await navigator.clipboard.writeText(url.toString());
      toast.success('Moment link copied. It opens on this line.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not copy the moment link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleExport = () => {
    if (!meeting) return;

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Helper function to add new page if needed
    const checkAndAddPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const addWrappedText = (text: string, x: number, fontSize: number, maxWidth: number, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        checkAndAddPage(10);
        doc.text(line, x, yPosition);
        yPosition += fontSize * 0.5;
      });
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(meeting.title, margin, yPosition);
    yPosition += 12;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date(meeting.date).toLocaleDateString()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Duration: ${meeting.duration}`, margin, yPosition);
    yPosition += 6;
    if (meeting.category) {
      doc.text(`Category: ${meeting.category}`, margin, yPosition);
      yPosition += 6;
    }
    if (meeting.tags && meeting.tags.length > 0) {
      doc.text(`Tags: ${meeting.tags.join(', ')}`, margin, yPosition);
      yPosition += 10;
    } else {
      yPosition += 4;
    }

    // AI Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    checkAndAddPage(20);
    doc.text('AI Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    addWrappedText(meeting.summary, margin, 10, maxWidth);
    yPosition += 10;

    // Transcript Section
    if (meeting.transcript && meeting.transcript.length > 0) {
      checkAndAddPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transcript', margin, yPosition);
      yPosition += 8;

      meeting.transcript.forEach((item, index) => {
        checkAndAddPage(15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 200);
        doc.text(`${item.speakername} [${item.timestamp}]`, margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        addWrappedText(item.content, margin, 9, maxWidth);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // MOM Section
    if (meeting.mom && meeting.mom.length > 0) {
      checkAndAddPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Minutes of Meeting', margin, yPosition);
      yPosition += 8;

      meeting.mom.forEach((item, index) => {
        checkAndAddPage(15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        if (item.type === 'decision') {
          doc.setTextColor(128, 0, 128); // Purple
          doc.text('[DECISION]', margin, yPosition);
        } else if (item.type === 'action') {
          doc.setTextColor(0, 150, 0); // Green
          doc.text('[ACTION]', margin, yPosition);
        } else {
          doc.setTextColor(100, 100, 100); // Gray
          doc.text('[NOTE]', margin, yPosition);
        }

        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        addWrappedText(item.content, margin, 9, maxWidth);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Tasks Section
    const suggestedTasks = meeting.tasks ? meeting.tasks.filter((t: any) => t.suggested === true) : [];
    if (suggestedTasks.length > 0) {
      checkAndAddPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Action Items', margin, yPosition);
      yPosition += 8;

      suggestedTasks.forEach((task: any, index: number) => {
        checkAndAddPage(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${task.title}`, margin, yPosition);
        yPosition += 6;

        if (task.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          addWrappedText(task.description, margin + 5, 9, maxWidth - 5);
        }

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Priority: ${task.priority || 'N/A'}`, margin + 5, yPosition);
        yPosition += 5;

        if (task.tags && task.tags.length > 0) {
          doc.text(`Tags: ${task.tags.join(', ')}`, margin + 5, yPosition);
          yPosition += 5;
        }

        doc.setTextColor(0, 0, 0);
        yPosition += 3;
      });
    }

    // Save PDF
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date(meeting.date).toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  useEffect(() => {
    if (meetingId) fetchMeeting();
  }, [meetingId]);

  useEffect(() => {
    if (!meeting?.id) return;
    let cancelled = false;
    fetch(`/api/meetings/${meeting.id}/series`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setSeries(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [meeting?.id]);

  useEffect(() => {
    const raw = searchParams.get("t");
    if (!raw || soughtRef.current || !videoSignedUrl) return;
    const seconds = Number(raw);
    const media = audioRef.current ?? videoRef.current;
    if (!Number.isFinite(seconds) || !media) return;
    soughtRef.current = true;
    media.currentTime = seconds;
    const line = meeting?.transcript?.findIndex((item) => timestampToSeconds(item.timestamp) === seconds) ?? -1;
    if (line >= 0) setActiveLine(line);
    void media.play().catch(() => undefined);
  }, [searchParams, videoSignedUrl, meeting]);

  useEffect(() => {
    // Transcript limit logic removed in favor of pagination
    // if (meeting?.transcript) {
    //   setTranscriptLimit(meeting.transcript.length >= 10 ? 10 : meeting.transcript.length);
    // }

    // Fetch signed URLs when meeting data is available
    if (meeting?.videoFile?._id) {
      fetch(`/api/documents/download?fileId=${meeting.videoFile._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setVideoSignedUrl(data.url);
        })
        .catch(err => console.error("Failed to fetch video URL", err));
    } else {
      setVideoSignedUrl(null);
    }

    const shots = meeting?.screenshots || [];
    if (shots.length === 0) {
      setScreenShots([]);
    } else {
      Promise.all(shots.map(async (shot) => {
        const fileId = shot.file?._id;
        if (!fileId) return null;
        const response = await fetch(`/api/documents/download?fileId=${fileId}`);
        const data = await response.json();
        if (!data.url) return null;
        return { url: data.url as string, seconds: shot.seconds || 0 };
      }))
        .then((items) => setScreenShots(items.filter((item): item is { url: string; seconds: number } => Boolean(item))))
        .catch(() => setScreenShots([]));
    }

    if (meeting?.transcriptFile?._id) {
      fetch(`/api/documents/download?fileId=${meeting.transcriptFile._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setTranscriptSignedUrl(data.url);
        })
        .catch(err => console.error("Failed to fetch transcript URL", err));
    } else {
      setTranscriptSignedUrl(null);
    }

  }, [meeting]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px] text-red-500 font-bold">
        {error || 'Meeting not found'}
      </div>
    );
  }

  const suggestedTasks = meeting.tasks ? meeting.tasks.filter((t: any) => t.suggested === true) : [];

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4 pt-2 px-2 md:px-0">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
              {meeting.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium pl-1 md:pl-0">
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(meeting.date).toLocaleDateString()}</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1"><Clock size={12} /> {meeting.duration}</span>
            <span className="w-px h-3 bg-border" />
            <div className="flex gap-2">
              {meeting.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-muted-foreground">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleDeleteClick}
            className="px-3 md:px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/15 transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline">Delete</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-3 md:px-4 py-2 bg-card text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Link2 size={14} />
            <span className="hidden md:inline">{isSharing ? 'Copying...' : 'Share'}</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 md:px-4 py-2 bg-card text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download size={14} />
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 px-1 md:px-4 pb-2 overflow-y-auto lg:overflow-hidden">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 h-auto lg:h-full lg:overflow-hidden">
          {screenShots[0] && (
            <div className="shrink-0 overflow-hidden rounded-xl border border-border">
              <img
                src={screenShots[0].url}
                alt="Meeting cover"
                className="aspect-video max-h-72 w-full object-cover"
              />
            </div>
          )}
          {videoSignedUrl && (
            <div className="shrink-0 overflow-hidden rounded-xl border border-border bg-black">
              {meeting.videoFile?.filetype === 'audio' ? (
                <audio ref={audioRef} src={videoSignedUrl} controls className="w-full px-4 py-3" />
              ) : (
                <video ref={videoRef} src={videoSignedUrl} controls playsInline className="max-h-80 w-full bg-black" />
              )}
            </div>
          )}
          <div className="shrink-0 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Sparkles size={14} />
              </div>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">AI Summary</span>
            </div>
            <p className="text-[13px] md:text-sm font-medium text-[#022c22] text-green-600 leading-relaxed">
              {meeting.summary}
            </p>
          </div>

          {series && series.meetings.length > 0 && (
            <div className="shrink-0 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Before the next {series.category} call</p>
              {series.meetings[0] && (
                <button
                  type="button"
                  onClick={() => router.push(`/meetings/${series.meetings[0].id}`)}
                  className="mt-3 w-full rounded-xl bg-background px-3 py-3 text-left hover:bg-muted"
                >
                  <p className="text-xs text-muted-foreground">Last time · {new Date(series.meetings[0].date).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm font-medium">{series.meetings[0].title}</p>
                  {series.meetings[0].decisions[0] && <p className="mt-2 text-xs text-foreground">Decision: {series.meetings[0].decisions[0]}</p>}
                  {series.meetings[0].openTasks[0] && <p className="mt-1 text-xs text-muted-foreground">Still open: {series.meetings[0].openTasks[0].title}</p>}
                  {series.meetings[0].speakers && series.meetings[0].speakers.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Spoke most: {series.meetings[0].speakers.map((speaker) => `${speaker.name} ${speaker.time}`).join(" · ")}
                    </p>
                  )}
                </button>
              )}
              {series.meetings.length > 1 && (
                <div className="mt-3 space-y-2">
                  {series.meetings.slice(1).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => router.push(`/meetings/${item.id}`)}
                      className="w-full rounded-xl border border-border px-3 py-2 text-left text-xs hover:bg-muted"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="h-auto lg:h-full lg:flex-1 flex flex-col min-h-0 bg-muted/30 border border-border rounded-xl lg:overflow-hidden">
            <div className="flex items-center justify-between px-2 md:px-4 py-2 border-b border-border bg-muted/50">
              <div className="flex gap-1">
                {(['Transcript', 'MOM'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveContent(tab)}
                    className={`px-4 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all
                       ${activeContent === tab
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                     `}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeContent === 'Transcript' && meeting?.transcript && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, meeting.transcript.length)}-
                    {Math.min(currentPage * itemsPerPage, meeting.transcript.length)} of {meeting.transcript.length}
                  </span>
                  <div className="flex items-center border border-border rounded-md bg-background overflow-hidden">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 hover:bg-muted disabled:opacity-50 border-r border-border transition-colors"
                    >
                      <ArrowLeft size={10} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(meeting.transcript.length / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(meeting.transcript.length / itemsPerPage)}
                      className="px-2 py-1 hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <ArrowLeft size={10} className="rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-visible lg:overflow-y-auto p-4 custom-scrollbar bg-background/50">
              {activeContent === 'Transcript' && (
                <div className="space-y-3">
                  {videoSignedUrl && (
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Click a line to jump in the recording</p>
                  )}
                  {meeting.transcript && meeting.transcript.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => {
                    const line = (currentPage - 1) * itemsPerPage + i;
                    const canSeek = Boolean(videoSignedUrl) && timestampToSeconds(item.timestamp) !== null;
                    return (
                    <div
                      key={line}
                      onClick={() => canSeek && seekToTimestamp(item.timestamp, line)}
                      className={`group w-full p-3 md:p-4 rounded-xl border bg-card text-left transition-colors ${activeLine === line ? 'border-primary/50 bg-primary/5' : 'border-border/40 hover:bg-muted/50'} ${canSeek ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs font-bold text-primary min-w-[3rem]">{item.speakername}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.timestamp}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => handleShareMoment(event, item.timestamp)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Link2 size={12} />
                          Moment
                        </button>
                      </div>
                      <p className="text-[13px] text-foreground leading-relaxed">{item.content}</p>
                    </div>
                    );
                  })}
                  {(!meeting.transcript || meeting.transcript.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground font-mono text-xs">No Transcript available</div>
                  )}
                </div>
              )}

              {activeContent === 'MOM' && (
                <div className="grid gap-2">
                  {meeting.mom && meeting.mom.map((item, i) => {
                    const colors = item.type === 'decision'
                      ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/30'
                      : item.type === 'action'
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                        : 'bg-muted/30 border-border/50';

                    const badge = item.type === 'decision'
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10'
                      : item.type === 'action'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : 'text-muted-foreground bg-muted';

                    return (
                      <div key={i} className={`p-3 rounded-xl border ${colors} transition-all flex gap-3`}>
                        <div className={`mt-0.5 shrink-0 px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${badge}`}>
                          {item.type.charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.content}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Utilities - Independent Scroll */}
        <div className="col-span-1 lg:col-span-4 h-auto lg:h-full flex flex-col gap-4 lg:overflow-hidden mt-0 lg:mt-0">

          {/* File Attachment Card */}
          {meeting.videoFile && (
            <div className="shrink-0 p-3 rounded-xl border border-border bg-card flex items-center justify-between group hover:border-border/80 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-all">
                  <Video size={18} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground line-clamp-1 max-w-[150px]" title={meeting.videoFile.gcsobjectkey}>
                    {meeting.videoFile.filetype === 'audio' ? 'Meeting audio' : 'Meeting video'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {meeting.videoFile.filesize ? (meeting.videoFile.filesize / (1024 * 1024)).toFixed(1) + ' MB' : 'Recording'}
                  </div>
                </div>
              </div>
              {videoSignedUrl && (
                <a href={videoSignedUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Download size={16} />
                </a>
              )}
            </div>
          )}
          {(!meeting.videoFile && meeting.transcriptFile) && (
            <div className="shrink-0 p-3 rounded-xl border border-border bg-card flex items-center justify-between group hover:border-border/80 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-all">
                  <FileText size={18} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground line-clamp-1 max-w-[150px]" title={meeting.transcriptFile.gcsobjectkey}>
                    {meeting.transcriptFile.gcsobjectkey}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {(meeting.transcriptFile.filesize ? (meeting.transcriptFile.filesize / 1024).toFixed(1) + ' KB' : 'TXT')}
                  </div>
                </div>
              </div>
              {transcriptSignedUrl && (
                <a href={transcriptSignedUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Download size={16} />
                </a>
              )}
            </div>
          )}

          {screenShots.length > 0 && (
            <div className="shrink-0 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Shared screen</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {screenShots.map((shot) => {
                  const minutes = Math.floor(shot.seconds / 60);
                  const rest = shot.seconds % 60;
                  const clock = `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
                  return (
                    <a key={`${shot.url}-${clock}`} href={shot.url} target="_blank" rel="noreferrer" className="block">
                      <img src={shot.url} alt={`Shared screen at ${clock}`} className="aspect-video w-full rounded-lg border border-border object-cover" />
                      <p className="mt-1 text-[10px] text-muted-foreground">{clock}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {meeting.transcript?.length > 0 && (
            <div className="shrink-0 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Who spoke</p>
              <div className="mt-3 space-y-2">
                {speakerShare(meeting.transcript).map((speaker) => (
                  <div key={speaker.name} className="flex items-center justify-between gap-3 text-sm">
                    <span>{speaker.name}</span>
                    <span className="text-muted-foreground">{formatSpokenTime(speaker.seconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Panel */}
          <div className="h-auto lg:h-full lg:flex-1 flex flex-col min-h-0 bg-muted/30 border border-border rounded-xl lg:overflow-hidden">
            <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Action Items</h3>
              <span className="text-[10px] font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                {suggestedTasks.length} DETECTED
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {suggestedTasks.map((task: any, idx: number) => (
                <SuggestedTask
                  key={idx}
                  taskId={task._id || task.id}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  tags={task.tags}
                  onAdd={() => fetchMeeting(false)}
                />
              ))}
              {suggestedTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <MoreHorizontal size={24} className="mb-2" />
                  <span className="text-xs font-bold">No tasks detected</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && meeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-6 ring-1 ring-white/10">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                <Trash2 size={24} className="text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Meeting?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                This will permanently delete <span className="text-foreground">{meeting.title}</span> and all associated data.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingView;
