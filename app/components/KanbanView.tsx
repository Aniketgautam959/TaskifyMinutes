import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus } from '../types';
import KanbanColumn from '../microcomponents/KanbanColumn';
import TaskModal from '../microcomponents/TaskModal';
import { Search, Filter, Loader, Plus } from 'lucide-react';
import { getAllTasks, createTask, updateTask, deleteTask } from '../services/api/tasks';

const KanbanView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getAllTasks();
      const activeTasks = data.filter((t: any) => t.suggested === false);
      setTasks(activeTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handlers
  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      setIsSubmitting(true);
      const newTask = await createTask(taskData as any);
      setTasks(prev => [newTask, ...prev]);
      setIsModalOpen(false);
      toast.success('Task created successfully');
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!currentTask) return;
    try {
      setIsSubmitting(true);
      const updatedTask = await updateTask(currentTask.id, taskData);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setIsModalOpen(false);
      setCurrentTask(null);
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted successfully');
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task');
    }
  };

  // Move Status Handler (Internal + Prop)
  const handleMoveStatus = async (id: string, status: TaskStatus) => {
      try {
          // Optimistic update locally
          setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
          await updateTask(id, { status });
      } catch (err) {
          console.error("Failed to update status", err);
          fetchTasks(); // Revert on failure
      }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setIsEditing(true);
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const columns: { title: TaskStatus; accent: string; bg: string }[] = [
    { title: 'Backlog', accent: 'bg-gray-300', bg: 'bg-brand-surface' },
    { title: 'In Progress', accent: 'bg-indigo-500', bg: 'bg-brand-lavender/50' },
    { title: 'Review', accent: 'bg-orange-500', bg: 'bg-brand-sky/50' },
    { title: 'Completed', accent: 'bg-emerald-500', bg: 'bg-brand-mint/50' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="animate-spin text-zinc-500" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 text-sm font-bold">
        {error}
      </div>
    );
  }

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <>
      {/* 
        Main Container: 
        Uses h-[calc(100vh-...)] to fill screen. 
        Flex-col to separate Header and Board.
      */}
      <div className="flex flex-col h-[calc(100vh-6rem)] w-full pt-4 px-4 md:px-8 space-y-6">
        
        {/* 1. Controller Header */}
        <div className="shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tighter leading-none">Stuff ToDo</h1>
            <p className="hidden md:block text-muted-foreground text-xs font-medium">Manage your tasks flow.</p>
          </div>

          <div className="grid grid-cols-2 md:flex items-center gap-3 w-full xl:w-auto">
             {/* Search: Full width on mobile/grid */}
             <div className="col-span-2 md:col-span-1 relative group w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
                <input 
                  type="text" 
                  placeholder="SEARCH TASKS" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-[10px] font-bold text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest"
                />
             </div>

             {/* Filter */}
             <div className="relative w-full md:w-auto">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Filter size={12} className="text-muted-foreground" />
               </div>
               <select 
                 value={priorityFilter}
                 onChange={(e) => setPriorityFilter(e.target.value)}
                 className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-muted/50 border border-border rounded-xl text-[10px] font-black text-foreground uppercase tracking-widest focus:outline-none focus:border-primary hover:bg-muted transition-all appearance-none cursor-pointer"
               >
                 <option value="All">All Levels</option>
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
               </select>
             </div>

             {/* New Task Button */}
             <button 
              onClick={openCreateModal}
              className="w-full md:w-auto justify-center px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-primary/20 hover:text-primary transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={3} /> New Task
            </button>
          </div>
        </div>

        {/* 2. Full Height Board Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
           <div className="flex h-full gap-4 md:gap-6 min-w-full w-max px-1">
              {columns.map(col => (
                <div key={col.title} className="w-[300px] md:w-[320px] lg:w-[350px] shrink-0 h-full">
                  <KanbanColumn 
                    title={col.title}
                    accent={col.accent}
                    bg={col.bg}
                    tasks={filteredTasks.filter(t => t.status === col.title)}
                    onUpdateStatus={handleMoveStatus}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                  />
                </div>
              ))}
           </div>
        </div>
      </div>
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={isEditing ? handleUpdateTask : handleCreateTask}
        task={currentTask}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default KanbanView;
