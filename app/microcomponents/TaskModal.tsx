
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task, Priority, TaskStatus } from '@/app/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  task?: Task | null; // If provided, we are in edit mode
  isSubmitting?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, task, isSubmitting = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Backlog');
  const [tags, setTags] = useState('');

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setStatus(task.status);
        setTags(task.tags.join(', '));
      } else {
        // Reset for new task
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus('Backlog');
        setTags('');
      }
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSubmit({
      title,
      description,
      priority,
      status,
      tags: tagList,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <h2 className="text-lg font-bold text-foreground">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Title */}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</label>
             <input 
               type="text"
               required
               value={title}
               onChange={e => setTitle(e.target.value)}
               className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
               placeholder="e.g. Update Documentation"
             />
          </div>

          {/* Description */}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
             <textarea 
               rows={3}
               value={description}
               onChange={e => setDescription(e.target.value)}
               className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
               placeholder="Task details..."
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Status */}
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none"
              >
                <option value="Backlog">Backlog</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tags</label>
             <input 
               type="text"
               value={tags}
               onChange={e => setTags(e.target.value)}
               className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
               placeholder="Comma separated tags e.g. dev, api"
             />
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background flex justify-end gap-2">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                type="button"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
