import React from 'react';
import { AppTab } from '../types';
import { UserButton } from "@clerk/nextjs";
import { Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onNewCapture: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onNewCapture }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] px-4 pt-4 md:px-8 md:pt-6 pointer-events-none transition-all duration-300">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between bg-background/90 backdrop-blur-xl py-2 px-3 md:py-3 md:px-6 rounded-2xl border border-border pointer-events-auto shadow-sm">
        {/* Brand & Context */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tighter text-foreground leading-none hidden sm:block">TaskifyMinutes</span>
              <span className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-widest hidden md:block">Turn meetings into momentum.</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="relative flex items-center bg-muted/50 p-1 rounded-xl border border-border w-[160px] md:w-[240px] mx-2">
          {/* Sliding Background Pill */}
          <div
            className={`
              absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] 
              bg-background rounded-lg border border-border shadow-sm
              transition-transform duration-300 ease-[cubic-bezier(0.2,0,0.2,1)]
              ${activeTab === 'Tasks' ? 'translate-x-full' : 'translate-x-0'}
            `}
          />

          {(['Meetings', 'Tasks'] as AppTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                relative z-10 flex-1 py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]
                transition-colors duration-200
                ${activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <button
            onClick={onNewCapture}
            className="p-2 md:px-5 md:py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[12px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">New Meeting</span>
          </button>
          <div className="hidden md:block h-8 w-px bg-border mx-1"></div>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 md:w-9 md:h-9 border border-border rounded-xl",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
