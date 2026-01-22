'use client';
import React, { useEffect, useState } from 'react';
import { Meeting } from '../types';
import { getAllMeetings, deleteMeeting } from '../services/api/meetings';
import { Loader, Trash2, Calendar, ArrowUpRight, Search, LayoutGrid, List } from 'lucide-react';

import { toast } from 'sonner';
import { useRefresh } from '../context/RefreshContext';

interface MeetingsTableProps {
  onSelectMeeting: (meeting: Meeting) => void;
}

const MeetingsTable: React.FC<MeetingsTableProps> = ({ onSelectMeeting }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useRefresh();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = meetings.filter(meeting => {
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.summary.toLowerCase().includes(query) ||
      meeting.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const data = await getAllMeetings();
        setMeetings(data);
      } catch (err) {
        console.error('Failed to fetch meetings:', err);
        setError('Failed to load meetings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    try {
      await deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      toast.success('Meeting deleted successfully');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      toast.error('Failed to delete meeting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
         <Loader className="animate-spin text-neutral-500" size={20} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center text-rose-500/80 font-medium text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
       {/* Responsive Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 px-1">
          <div className="space-y-1">
             <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Analyzed Meetings</h1>
             <p className="text-muted-foreground text-xs md:text-sm font-medium">Archived meeting intelligence and transcripts.</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors w-4 h-4" />
              <input 
                  type="text"
                  placeholder="SEARCH ARCHIVES..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-72 pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-xs font-bold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all uppercase tracking-wide"
              />
          </div>
        </div>

      {filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-border rounded-2xl bg-muted/10">
           <Search className="mb-3 text-muted-foreground" size={32} strokeWidth={1.5} />
           <p className="text-muted-foreground font-medium text-sm">No meetings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
          {filteredMeetings.map((meeting) => (
            <div 
              key={meeting.id} 
              onClick={() => onSelectMeeting(meeting)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
            >
              {/* Subtle Glow Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10 space-y-4">
                 {/* Card Header */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                       <Calendar className="w-3 h-3 text-muted-foreground" />
                       {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                    </div>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-full border ${
                        meeting.category === 'Client' ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' :
                        meeting.category === 'Internal' ? 'bg-blue-500/5 text-blue-600 dark:text-blue-500 border-blue-500/20' :
                        'bg-muted text-muted-foreground border-border'
                    }`}>
                      {meeting.category}
                    </span>
                 </div>

                 {/* Content */}
                 <div>
                    <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                      {meeting.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                       {meeting.summary}
                    </p>
                 </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                     {meeting.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider group-hover:bg-muted group-hover:text-foreground transition-colors">
                            #{tag}
                        </span>
                     ))}
                     {meeting.tags.length > 2 && (
                        <span className="text-[9px] text-muted-foreground font-medium">+{meeting.tags.length - 2}</span>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                       <button 
                          onClick={(e) => handleDelete(e, meeting.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Meeting"
                       >
                          <Trash2 size={14} />
                       </button>
                       <div className="p-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                           <ArrowUpRight size={16} />
                       </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingsTable;
