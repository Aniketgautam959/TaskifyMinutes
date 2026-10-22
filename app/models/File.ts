import mongoose, { Schema, Model, models } from 'mongoose';

export interface IFile {
  gcsobjectkey: string;
  storageId?: string;
  filesize: number;
  createdat: Date;
  user: mongoose.Types.ObjectId;
  filetype: 'text' | 'video' | 'image' | 'audio';
  duration?: number;
}

const FileSchema = new Schema<IFile>(
  {
    gcsobjectkey: { type: String, required: true },
    storageId: { type: String },
    filesize: { type: Number, required: true },
    createdat: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filetype: { type: String, enum: ['text', 'video', 'image', 'audio'], required: true },
    duration: { type: Number },
  },
  { timestamps: true }
);

if (models.File && !models.File.schema.path('storageId')) {
  mongoose.deleteModel('File');
}

export const FileModel: Model<IFile> = models.File || mongoose.model<IFile>('File', FileSchema);
