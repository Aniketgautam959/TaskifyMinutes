'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';
import MeetingModal from '../microcomponents/MeetingModal';
import { AppTab } from '../types';

import { RefreshContext } from '../context/RefreshContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const activeTab: AppTab = pathname.includes('/kanbans') ? 'Tasks' : 'Meetings';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleTabChange = (tab: AppTab) => {
    if (tab === 'Meetings') {
      router.push('/meetings');
    } else {
      router.push('/kanbans');
    }
  };

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      <div className="min-h-screen bg-transparent selection:bg-indigo-900 selection:text-indigo-100">
        <Navbar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onNewCapture={() => setIsModalOpen(true)}
        />
        
        <main className="mx-auto pt-28 mb-10">
          <div className="animate-in fade-in duration-700">
            {children}
          </div>
        </main>

        <MeetingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={triggerRefresh}
        />
      </div>
    </RefreshContext.Provider>
  );
}
