'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Meeting, Task } from '../types';
import SuggestedTask from '../microcomponents/SuggestedTask';
import { Calendar, Clock, Download, FileText, Loader, ArrowLeft, Trash2, Maximize2, MoreHorizontal, Sparkles } from 'lucide-react';
import { getMeetingById, deleteMeeting } from '../services/api/meetings';
import jsPDF from 'jspdf';

interface MeetingViewProps {
  meetingId: string;
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, onAddTask }) => {
  const router = useRouter();
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
            className="px-3 md:px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline">Delete</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 md:px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-muted/80 hover:text-foreground transition-all flex items-center gap-2"
          >
            <Download size={14} />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 px-1 md:px-4 pb-2 overflow-y-auto lg:overflow-hidden">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 h-auto lg:h-full lg:overflow-hidden">
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
                  {meeting.transcript && meeting.transcript.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => (
                    <div key={i} className="group p-3 md:p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-xs font-bold text-primary min-w-[3rem]">{item.speakername}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.timestamp}</span>
                      </div>
                      <p className="text-[13px] text-foreground leading-relaxed">{item.content}</p>
                    </div>
                  ))}
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
