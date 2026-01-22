import React from 'react';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  title: TaskStatus;
  accent: string;
  bg: string;
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, accent, bg, tasks, onUpdateStatus, onEdit, onDelete }) => {
  const statuses: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Completed'];
  const curIdx = statuses.indexOf(title);
  const nextStatus = curIdx < statuses.length - 1 ? statuses[curIdx + 1] : null;

  return (
    <div className={`flex flex-col gap-4 p-4 rounded-3xl min-w-[280px] w-full h-full ${bg} transition-all border border-border bg-muted/20`}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-3.5 rounded-full ${accent}`}></div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em] text-foreground">
            {title}
          </span>
        </div>
        <div className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[9px] font-bold text-muted-foreground">
          {tasks.length.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Scrollable Tasks Area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1 custom-scrollbar">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            showMoveAction={!!nextStatus}
            onMove={nextStatus ? (id) => onUpdateStatus(id, nextStatus) : undefined} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-24 border border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/10">
            <span className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.4em]">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
