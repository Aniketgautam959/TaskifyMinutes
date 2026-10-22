'use client';
import React, { useEffect, useState } from 'react';
import { Meeting } from '../types';
import { getAllMeetings, deleteMeeting } from '../services/api/meetings';
import { Loader, Trash2, Calendar, ArrowUpRight, Search } from 'lucide-react';

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
  const [covers, setCovers] = useState<Record<string, string>>({});

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
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 401) console.error('Failed to fetch meetings:', err);
        setError(status === 401 ? 'Sign in to see your meetings.' : 'Meetings could not load. The database is not reachable yet.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, [refreshKey]);

  useEffect(() => {
    const withCover = meetings.flatMap((meeting) => {
      const fileId = meeting.screenshots?.[0]?.file?._id;
      return fileId ? [{ id: meeting.id, fileId }] : [];
    });
    if (withCover.length === 0) return;
    let cancelled = false;
    Promise.all(withCover.map(async (item) => {
      const response = await fetch(`/api/documents/download?fileId=${item.fileId}`);
      const data = await response.json();
      return data.url ? { id: item.id, url: data.url as string } : null;
    })).then((items) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      items.forEach((item) => {
        if (item) next[item.id] = item.url;
      });
      setCovers(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [meetings]);

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
             <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Meetings</h1>
             <p className="text-muted-foreground text-sm">Notes, transcripts, and tasks from your sessions.</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors w-4 h-4" />
              <input 
                  type="text"
                  placeholder="Search meetings"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-72 pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
              />
          </div>
        </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Search className="mb-3 text-muted-foreground" size={28} strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">No meetings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Meeting</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Date</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Tags</th>
                  <th className="px-5 py-3 font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((meeting) => (
                  <tr
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting)}
                    className="group border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {covers[meeting.id] && (
                          <img
                            src={covers[meeting.id]}
                            alt=""
                            className="h-12 w-20 shrink-0 rounded-lg border border-border object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1 max-w-xl">{meeting.summary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex rounded-full bg-primary/70 px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        {meeting.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleDelete(e, meeting.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete meeting"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ArrowUpRight size={16} className="text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsTable;
