
import React, { useState } from 'react';
import { Priority } from '../types';
import StatusBadge from './StatusBadge';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { convertSuggestedToActualTask } from '../services/api/tasks';

interface SuggestedTaskProps {
  taskId: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  onAdd: () => void;
}

const SuggestedTask: React.FC<SuggestedTaskProps> = ({ taskId, title, description, priority, tags, onAdd }) => {
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsConverting(true);
      await convertSuggestedToActualTask(taskId);
      toast.success('Task added to Kanban board');
      onAdd(); // Notify parent to refresh/update UI
    } catch (error) {
      console.error('Failed to convert task:', error);
      toast.error('Failed to convert task');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="group relative p-4 bg-card hover:bg-muted/20 border border-border hover:border-border/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-2">
      {/* Header: Title + Badges + Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h4>
          <StatusBadge label={priority} type="priority" variant={priority} />
        </div>

        <button 
            onClick={handleConvert}
            disabled={isConverting}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isConverting ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Plus size={16} strokeWidth={2.5} />
            )}
        </button>
      </div>
      
      {/* Content: Description */}
      <p className="text-[11px] text-muted-foreground line-clamp-2 font-medium leading-relaxed mb-1">
        {description}
      </p>

      {/* Footer: Tags */}
      <div className="flex items-center justify-between pt-2">
         <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
                <span key={i} className="text-[9px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full border border-border">
                    #{tag}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedTask;
