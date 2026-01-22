
export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  tags: string[];
  sourceMeeting: string | { title: string; _id: string }; // Can be string (local) or object (populated)
  suggested: boolean;
}

export interface FileData {
  _id: string;
  gcsobjectkey: string;
  filesize: number;
  createdat: string;
  filetype: 'text' | 'video' | 'image' | 'audio';
  duration?: number;
}

export interface Meeting {
  _id: string;
  id: string; 
  title: string;
  date: string;
  duration: string;
  summary: string;
  transcript: { speakername: string; content: string; timestamp: string }[];
  mom: { type: 'action' | 'decision' | 'info'; content: string }[];
  videoFile?: FileData;
  transcriptFile?: FileData;
  confidenceLevel?: number;
  thumbnail?: string;
  tags: string[];
  category: string;
  tasks: any[]; // specific Task[] type causes circular dep if not careful, but Task is in same file so Task[] is fine
}

export type AppTab = 'Meetings' | 'Tasks';
