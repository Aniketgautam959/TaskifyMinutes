'use client';
import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import MeetingView from '../../../components/MeetingView';
import { Task } from '../../../types';

export default function MeetingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const handleAddTask = (task: Omit<Task, 'id' | 'status'>) => {
    console.log('Adding task for meeting', id, task);
    // Logic to add task would go here
  };

  return (
    <div className="space-y-6 px-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest pl-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Sessions
      </button>

      <MeetingView 
        meetingId={id} 
        onAddTask={handleAddTask} 
      />
    </div>
  );
}
