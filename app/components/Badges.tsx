import React from 'react';

export const MeetingStatusBadge = ({ status }: { status: string }) => {
  let color = 'text-muted-foreground bg-muted border-border';
  if (status === 'Completed') color = 'text-green-500 bg-green-500/10 border-green-500/20';
  if (status === 'Scheduled') color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  if (status === 'Cancelled') color = 'text-red-500 bg-red-500/10 border-red-500/20';

  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      {status}
    </span>
  );
};
