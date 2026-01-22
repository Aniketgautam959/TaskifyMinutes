import mongoose, { Schema, Model, models } from 'mongoose';

export interface ITask {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Backlog' | 'In Progress' | 'Review' | 'Completed';
  tags: string[];
  sourceMeeting: mongoose.Types.ObjectId;
  suggested: boolean;
  user: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High'], 
      default: 'Medium' 
    },
    status: { 
      type: String, 
      enum: ['Backlog', 'In Progress', 'Review', 'Completed'], 
      default: 'Backlog' 
    },
    tags: { type: [String], default: [] },
    sourceMeeting: { type: Schema.Types.ObjectId, ref: 'Meeting'},
    suggested: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Task: Model<ITask> = models.Task || mongoose.model<ITask>('Task', TaskSchema);
