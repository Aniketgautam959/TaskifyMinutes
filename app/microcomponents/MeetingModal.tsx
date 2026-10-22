
import React, { useRef, useState } from 'react';
import { X, Loader2, Mic, Square, Camera } from 'lucide-react';
import { startMeetingCapture, type MeetingSnap } from '@/app/lib/meetingCapture';

type SavedSnap = MeetingSnap & { previewUrl: string };

function formatSnapClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}


interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordNote, setRecordNote] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<SavedSnap[]>([]);

  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const snapRecordingRef = useRef<(() => Promise<MeetingSnap | null>) | null>(null);
  const snapsRef = useRef<SavedSnap[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordSecondsRef = useRef(0);
  const ignoreRecordingRef = useRef(false);
  const fieldsRef = useRef({ title, date, category, transcriptText });
  fieldsRef.current = { title, date, category, transcriptText };

  const clearRecordTimer = () => {
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const submitCapture = async (fileOverride?: File, recordedSeconds?: number) => {
    const file = fileOverride || transcriptFile;
    if (!transcriptText && !file) {
      alert("Please provide a transcript, upload a file, or record the meeting.");
      return;
    }

    try {
      let response;

      if (file) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        if (recordedSeconds && recordedSeconds > 0) {
          uploadFormData.append('duration', String(recordedSeconds));
        }

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.status === 401) {
          throw new Error('Sign in first, then record the meeting.');
        }
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload file');
        }

        const { fileId } = await uploadResponse.json();

        const uploadedShots: { id: string; seconds: number }[] = [];
        for (const shot of snapsRef.current) {
          const shotBody = new FormData();
          shotBody.append('file', shot.file);
          const shotResponse = await fetch('/api/documents/upload', { method: 'POST', body: shotBody });
          if (!shotResponse.ok) continue;
          const shotData = await shotResponse.json();
          if (shotData.fileId) uploadedShots.push({ id: shotData.fileId, seconds: shot.seconds });
        }
        setIsUploading(false);

        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileId', fileId);
        formData.append('title', fieldsRef.current.title);
        formData.append('date', fieldsRef.current.date || new Date().toISOString().slice(0, 10));
        formData.append('category', fieldsRef.current.category);
        if (recordedSeconds && recordedSeconds > 0) {
          formData.append('duration', String(recordedSeconds));
        }
        uploadedShots.forEach((shot) => {
          formData.append('screenshotIds', shot.id);
          formData.append('screenshotSeconds', String(shot.seconds));
        });

        response = await fetch('/api/meetings/analyze/file', {
          method: 'POST',
          body: formData,
        });
      } else {
        setIsProcessing(true);
        response = await fetch('/api/meetings/analyze/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: fieldsRef.current.transcriptText,
            title: fieldsRef.current.title,
            date: fieldsRef.current.date,
            category: fieldsRef.current.category
          }),
        });
      }

      if (response.status === 401) {
        throw new Error('Sign in first, then record the meeting.');
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Failed to analyze transcript');
      }

      if (onSuccess) onSuccess();
      onClose();

      setTranscriptText('');
      setTranscriptFile(null);
      setTitle('');
      setDate('');
      setRecordNote(null);
      setRecordError(null);
      snapsRef.current.forEach((shot) => URL.revokeObjectURL(shot.previewUrl));
      snapsRef.current = [];
      setSnaps([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze transcript";
      console.error("Failed to analyze transcript:", error);
      setRecordNote(null);
      setRecordError(message);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleStartRecording = async () => {
    setRecordError(null);
    setRecordNote(null);
    ignoreRecordingRef.current = false;
    try {
      snapsRef.current.forEach((shot) => URL.revokeObjectURL(shot.previewUrl));
      snapsRef.current = [];
      setSnaps([]);
      const capture = await startMeetingCapture();
      stopRecordingRef.current = capture.stop;
      snapRecordingRef.current = capture.snap;
      setIsRecording(true);
      recordSecondsRef.current = 0;
      setRecordSeconds(0);
      setRecordNote(capture.hadMicrophone
        ? "Recording the Meet tab and your microphone."
        : "Recording the Meet tab. Microphone is off, so only the tab audio is included.");
      clearRecordTimer();
      recordTimerRef.current = window.setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(recordSecondsRef.current);
      }, 1000);

      capture.done
        .then((file) => {
          clearRecordTimer();
          const seconds = recordSecondsRef.current;
          setIsRecording(false);
          stopRecordingRef.current = null;
          snapRecordingRef.current = null;
          if (ignoreRecordingRef.current) return;
          setTranscriptFile(file);
          setRecordNote("Recording saved. Creating the meeting...");
          void submitCapture(file, seconds);
        })
        .catch((error: unknown) => {
          clearRecordTimer();
          setIsRecording(false);
          stopRecordingRef.current = null;
          snapRecordingRef.current = null;
          if (ignoreRecordingRef.current) return;
          setRecordError(error instanceof Error ? error.message : "Recording failed.");
        });
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : "Recording failed.");
    }
  };

  const handleStopRecording = () => {
    stopRecordingRef.current?.();
  };

  const handleSnap = async () => {
    const shot = await snapRecordingRef.current?.();
    if (!shot) {
      setRecordError('Could not grab the screen. Keep the Meet tab shared.');
      return;
    }
    if (snapsRef.current.length >= 12) {
      setRecordError('Twelve screen shots is the limit for one meeting.');
      return;
    }
    setRecordError(null);
    const saved = { ...shot, previewUrl: URL.createObjectURL(shot.file) };
    snapsRef.current = [...snapsRef.current, saved];
    setSnaps(snapsRef.current);
  };

  const handleClose = () => {
    ignoreRecordingRef.current = true;
    snapRecordingRef.current = null;
    stopRecordingRef.current?.();
    clearRecordTimer();
    setIsRecording(false);
    onClose();
  };

  if (!isOpen) return null;

  const clock = `${String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:${String(recordSeconds % 60).padStart(2, "0")}`;

  const handleTranscriptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTranscriptFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCapture();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <h2 className="text-lg font-bold text-foreground">
            New Session Capture
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Title */}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Meeting Title</label>
             <input 
               type="text"
               value={title}
               onChange={e => setTitle(e.target.value)}
               className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
               placeholder="e.g. Q3 Roadmap Discussion"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Category */}
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none"
              >
                <option value="General">General</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Record a live meeting</p>
                <p className="text-xs text-muted-foreground">Chrome: choose the Google Meet tab and turn on Share tab audio.</p>
              </div>
              {isRecording ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSnap()}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground"
                  >
                    <Camera size={12} />
                    Snap
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Square size={12} fill="currentColor" />
                    Stop {clock}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isProcessing || isUploading || !!transcriptText || !!transcriptFile}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-500 disabled:opacity-50"
                >
                  <Mic size={12} />
                  Record
                </button>
              )}
            </div>
            {isRecording && (
              <p className="text-xs text-muted-foreground">Snap saves the shared screen at this second. Slides and shared windows stay with the meeting.</p>
            )}
            {snaps.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {snaps.map((shot) => (
                  <figure key={shot.previewUrl} className="shrink-0">
                    <img src={shot.previewUrl} alt={`Screen at ${formatSnapClock(shot.seconds)}`} className="h-14 w-24 rounded-lg border border-border object-cover" />
                    <figcaption className="mt-1 text-[10px] text-muted-foreground">{formatSnapClock(shot.seconds)}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            {recordNote && <p className="text-xs text-foreground">{recordNote}</p>}
            {recordError && <p className="text-xs text-red-500">{recordError}</p>}
          </div>

          {/* Conditional Input Area */}
          <div className="space-y-1">
                <div className="space-y-3">
                     <textarea 
                        rows={6}
                        value={transcriptText}
                        onChange={e => setTranscriptText(e.target.value)}
                        disabled={!!transcriptFile}
                        className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none font-mono ${transcriptFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder={transcriptFile ? "File selected. Remove file to paste text." : "Paste meeting transcript here..."}
                      />
                      <div className={`flex items-center gap-3 ${transcriptText ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{transcriptFile ? 'Selected:' : 'Or upload audio, video, or txt'}</span>
                        {transcriptFile ? (
                           <div className="flex items-center gap-2 bg-muted border border-border rounded px-2 py-1">
                                <span className="text-xs text-foreground font-bold truncate max-w-[150px]">{transcriptFile.name}</span>
                                <button type="button" onClick={() => setTranscriptFile(null)} className="text-muted-foreground hover:text-foreground"><X size={12}/></button>
                           </div>
                        ) : (
                           <input 
                             type="file" 
                             accept=".txt,.md,audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.m4v,.mov,.webm,.mpeg,.mpg" 
                             onChange={handleTranscriptFileChange}
                             disabled={!!transcriptText}
                             className="text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer disabled:cursor-not-allowed"
                           />
                        )}
                      </div>
                </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background flex justify-end gap-2">
            <button 
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                type="button"
            >
                Cancel
            </button>
            <button 
                onClick={() => void submitCapture()}
                disabled={isProcessing || isUploading || isRecording || (!transcriptText && !transcriptFile)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
            >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading file...</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Initiate Processing</span>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
