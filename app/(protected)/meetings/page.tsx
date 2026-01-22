'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import MeetingsTable from '../../components/MeetingsTable';
import { Meeting } from '../../types';

export default function MeetingsPage() {
  const router = useRouter();

  const handleSelectMeeting = (meeting: Meeting) => {
    router.push(`/meetings/${meeting.id}`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-8">
      {/* Header Section */}
      <MeetingsTable onSelectMeeting={handleSelectMeeting} />
    </div>
  );
}
