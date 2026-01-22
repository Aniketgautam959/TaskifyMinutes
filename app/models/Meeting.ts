import mongoose, { Schema, Model, models } from 'mongoose';

export interface IMeeting {
  title: string;
  date: Date;
  duration: string;
  summary: string;
  transcript: { speakername: string; content: string; timestamp: string }[];
  mom: { type: 'action' | 'decision' | 'info'; content: string }[];
  videoFile?: mongoose.Types.ObjectId;
  transcriptFile?: mongoose.Types.ObjectId;
  confidenceLevel?: number;
  tags: string[];
  category: string;
  tasks: mongoose.Types.ObjectId[];
  user: mongoose.Types.ObjectId;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: String },
    summary: { type: String },
    transcript: [{
      speakername: String,
      content: String,
      timestamp: String
    }],
    mom: [{
      type: { type: String, enum: ['action', 'decision', 'info'] },
      content: String
    }],
    videoFile: { type: Schema.Types.ObjectId, ref: 'File' },
    transcriptFile: { type: Schema.Types.ObjectId, ref: 'File' },
    confidenceLevel: { type: Number },
    tags: { type: [String], default: [] },
    category: { type: String },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Meeting: Model<IMeeting> = models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
